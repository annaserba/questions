<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import BulletinSheet from './components/BulletinSheet.vue'
import ControlPanel from './components/ControlPanel.vue'
import MeetingNotice from './components/MeetingNotice.vue'
import maketImg from './images/maket.png'
import komPred1Img from './images/kom_pred1.png'
import komPred2Img from './images/kom_pred2.png'
import {
  addDays,
  addMonths,
  buildQuestionSections,
  buildQuestions,
  createDefaultForm,
  formatRuDate,
  getOwnerFormFromCookie,
  houseAddressOptions,
  saveOwnerFormToCookie,
} from './data/bulletin'
import type {
  VoteChoice,
} from './types'

type DocumentView = 'bulletin' | 'notice'

const materials = [
  { src: maketImg, label: 'Предполагаемый проект' },
  { src: komPred1Img, label: 'Коммерческое предложение, стр. 1' },
  { src: komPred2Img, label: 'Коммерческое предложение, стр. 2' },
]

const lightboxIndex = ref<number | null>(null)
const materialsOpen = ref(false)

function openLightbox(index: number) {
  lightboxIndex.value = index
}

function closeLightbox() {
  lightboxIndex.value = null
}

function prevImage() {
  if (lightboxIndex.value !== null && lightboxIndex.value > 0) {
    lightboxIndex.value--
  }
}

function nextImage() {
  if (lightboxIndex.value !== null && lightboxIndex.value < materials.length - 1) {
    lightboxIndex.value++
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeLightbox()
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
}

const form = reactive({
  ...createDefaultForm(),
  ...getOwnerFormFromCookie(),
})
const currentDocument = ref<DocumentView>('bulletin')
const questionVotes = reactive<Record<number, VoteChoice | undefined>>({})

const questions = computed(() => buildQuestions(form))
const questionSections = computed(() => buildQuestionSections(questions.value))
const latestNoticeDate = computed(() => addDays(form.votingStartDate, -10))
const maxVotingEndDate = computed(() => addMonths(form.votingStartDate, 2))
const durationWarning = computed(() =>
  form.votingEndDate > maxVotingEndDate.value
    ? 'Срок голосования не может превышать 2 месяца от даты начала голосования.'
    : '',
)

const noticeWarning = computed(() =>
  form.noticeDate > latestNoticeDate.value
    ? 'Дата уведомления должна быть минимум за 10 дней до даты начала голосования.'
    : '',
)

const gisIdentityWarning = computed(() =>
  !form.passportNumber.trim() && !form.snils.trim()
    ? 'Для голосования в ГИС ЖКХ укажите номер паспорта или СНИЛС собственника.'
    : '',
)

const formattedDates = computed(() => ({
  noticeDate: formatRuDate(form.noticeDate),
  votingStartDate: formatRuDate(form.votingStartDate),
  votingEndDate: formatRuDate(form.votingEndDate),
}))

watch(
  () => ({
    ownerName: form.ownerName,
    apartment: form.apartment,
    area: form.area,
    ownershipDocument: form.ownershipDocument,
    passportNumber: form.passportNumber,
    snils: form.snils,
    extraNotes: form.extraNotes,
  }),
  (ownerData) => {
    saveOwnerFormToCookie(ownerData)
  },
)

watch(
  () => form.votingStartDate,
  (newStartDate) => {
    if (form.noticeDate > addDays(newStartDate, -10)) {
      form.noticeDate = addDays(newStartDate, -10)
    }

    if (form.votingEndDate < newStartDate) {
      form.votingEndDate = newStartDate
      return
    }

    const maxEndDate = addMonths(newStartDate, 2)
    if (form.votingEndDate > maxEndDate) {
      form.votingEndDate = maxEndDate
    }
  },
  { immediate: true },
)

watch(
  () => form.noticeDate,
  (newNoticeDate) => {
    const maxNoticeDate = addDays(form.votingStartDate, -10)
    if (newNoticeDate > maxNoticeDate) {
      form.noticeDate = maxNoticeDate
    }
  },
)

watch(
  () => form.votingEndDate,
  (newVotingEndDate) => {
    if (newVotingEndDate < form.votingStartDate) {
      form.votingEndDate = form.votingStartDate
      return
    }

    const maxEndDate = addMonths(form.votingStartDate, 2)
    if (newVotingEndDate > maxEndDate) {
      form.votingEndDate = maxEndDate
    }
  },
)

function printPage(): void {
  window.print()
}

function handleVoteSelection(questionIndex: number, vote: VoteChoice): void {
  questionVotes[questionIndex] = questionVotes[questionIndex] === vote ? undefined : vote
}
</script>

<template>
  <div class="page-shell">
    <ControlPanel
      :form="form"
      :house-address-options="houseAddressOptions"
      :current-document="currentDocument"
      :latest-notice-date="latestNoticeDate"
      :max-voting-end-date="maxVotingEndDate"
      :duration-warning="durationWarning"
      :notice-warning="noticeWarning"
      :gis-identity-warning="gisIdentityWarning"
      @update:current-document="currentDocument = $event"
      @print="printPage"
    />
    <div class="documents">
      <header class="page-header">
        <label class="header-label">
          <span>Адрес дома</span>
          <select v-model="form.houseAddress" class="header-select">
            <option
              v-for="address in houseAddressOptions"
              :key="address"
              :value="address"
            >
              {{ address }}
            </option>
          </select>
        </label>
        <button class="header-print" type="button" @click="printPage">
          Печать
        </button>
      </header>
      <MeetingNotice
        v-if="currentDocument === 'notice'"
        :form="form"
        :question-sections="questionSections"
        :formatted-dates="formattedDates"
      />
      <BulletinSheet
        v-else
        :form="form"
        :question-sections="questionSections"
        :formatted-dates="formattedDates"
        :question-votes="questionVotes"
        @select-vote="handleVoteSelection"
      />

      <footer class="materials-footer" :class="{ open: materialsOpen }">
        <button class="materials-toggle" type="button" @click="materialsOpen = !materialsOpen">
          <h3>Материалы к проекту</h3>
          <span class="materials-caret">{{ materialsOpen ? '▲' : '▼' }}</span>
        </button>
        <div class="materials-body">
          <div class="materials-slider">
            <figure
              v-for="(mat, idx) in materials"
              :key="idx"
              class="mat-slide"
              @click="openLightbox(idx)"
            >
              <img :src="mat.src" :alt="mat.label" />
              <figcaption>{{ mat.label }}</figcaption>
            </figure>
          </div>
        </div>
      </footer>
    </div>

    <Teleport to="body">
      <div
        v-if="lightboxIndex !== null"
        class="lightbox-overlay"
        @click="closeLightbox"
        @keydown="onKeydown"
        tabindex="0"
      >
        <button class="lightbox-close" @click.stop="closeLightbox">&times;</button>
        <button
          v-if="lightboxIndex > 0"
          class="lightbox-arrow lightbox-prev"
          @click.stop="prevImage"
        >&#8249;</button>
        <img
          :src="materials[lightboxIndex].src"
          :alt="materials[lightboxIndex].label"
          class="lightbox-image"
          @click.stop
        />
        <button
          v-if="lightboxIndex < materials.length - 1"
          class="lightbox-arrow lightbox-next"
          @click.stop="nextImage"
        >&#8250;</button>
        <p class="lightbox-label">{{ materials[lightboxIndex].label }}</p>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.page-shell {
  display: grid;
  grid-template-columns: minmax(320px, 430px) minmax(0, 1fr);
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(13, 76, 211, 0.1), transparent 30%),
    linear-gradient(180deg, #f6faff 0%, #eef5ff 100%);
}

.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: end;
  gap: 16px;
  padding: 18px 26px 16px;
  background: #fff;
  border-bottom: 1px solid rgba(13, 76, 211, 0.12);
  box-shadow: 0 1px 8px rgba(6, 58, 156, 0.08);
}

.header-label {
  display: grid;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.header-print {
  flex-shrink: 0;
  padding: 10px 20px;
  border: 0;
  border-radius: 8px;
  background: var(--gos-blue, #0d4cd3);
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 140ms ease;
}

.header-print:hover {
  background: #0b3fb0;
}

.header-label span {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--gos-muted, #6b7c9e);
}

.header-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(13, 76, 211, 0.18);
  border-radius: 8px;
  background: #f8faff;
  color: var(--gos-ink, #0b1e3c);
  font-size: clamp(1.1rem, 2.2vw, 1.35rem);
  font-weight: 700;
  cursor: pointer;
  appearance: auto;
}

.header-select:focus {
  outline: none;
  border-color: var(--gos-blue, #0d4cd3);
  box-shadow: 0 0 0 3px rgba(13, 76, 211, 0.12);
}

.header-select option {
  color: #0b1e3c;
  background: #fff;
  font-weight: 500;
  font-size: 1rem;
}

.documents {
  padding: 0 0 32px;
}

.materials-footer {
  position: sticky;
  bottom: 0;
  z-index: 5;
  margin-top: 24px;
  background: #fff;
  border-top: 1px solid rgba(13, 76, 211, 0.12);
  box-shadow: 0 -1px 8px rgba(6, 58, 156, 0.06);
}

.materials-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 26px;
  border: 0;
  background: none;
  cursor: pointer;
  color: inherit;
}

.materials-toggle h3 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--gos-muted, #6b7c9e);
}

.materials-caret {
  font-size: 0.7rem;
  color: var(--gos-muted, #6b7c9e);
}

.materials-body {
  display: none;
  padding: 0 26px 10px;
}

.materials-footer.open .materials-body {
  display: block;
}

.materials-slider {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 2px;
}

.mat-slide {
  flex: 0 0 200px;
  scroll-snap-align: start;
  margin: 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--gos-line);
  cursor: pointer;
  transition: box-shadow 140ms ease;
}

.mat-slide:hover {
  box-shadow: 0 2px 12px rgba(13, 76, 211, 0.12);
}

.mat-slide img {
  display: block;
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.mat-slide figcaption {
  padding: 5px 8px;
  font-size: 0.72rem;
  color: var(--gos-muted);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.88);
  outline: none;
}

.lightbox-image {
  max-width: 92vw;
  max-height: 88vh;
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5);
}

.lightbox-close {
  position: fixed;
  top: 16px;
  right: 20px;
  border: 0;
  background: none;
  color: #fff;
  font-size: 2rem;
  cursor: pointer;
  z-index: 1001;
}

.lightbox-arrow {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 2.4rem;
  width: 48px;
  height: 64px;
  border-radius: 8px;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-prev {
  left: 12px;
}

.lightbox-next {
  right: 12px;
}

.lightbox-arrow:hover {
  background: rgba(255, 255, 255, 0.22);
}

.lightbox-label {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  margin: 0;
  padding: 8px 20px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  font-size: 0.9rem;
  z-index: 1001;
}

@media (max-width: 980px) {
  .page-shell {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px 14px;
  }

  .header-print {
    padding: 10px 14px;
    font-size: 0.85rem;
  }

  .header-select {
    font-size: 1rem;
    padding: 10px 12px;
  }

  .documents {
    padding: 0 0 20px;
  }

  .materials-footer {
    margin-top: 16px;
  }

  .materials-toggle {
    padding: 8px 14px;
  }

  .materials-body {
    padding: 0 14px 8px;
  }

  .mat-slide {
    flex: 0 0 150px;
  }

  .mat-slide img {
    height: 90px;
  }
}

@media print {
  .page-shell {
    display: block;
    background: #fff;
  }

  .page-header {
    display: none;
  }

  .materials-footer {
    display: none;
  }

  .documents {
    padding: 0;
  }
}
</style>

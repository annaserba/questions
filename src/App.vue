<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import BulletinSheet from './components/BulletinSheet.vue'
import ControlPanel from './components/ControlPanel.vue'
import MeetingNotice from './components/MeetingNotice.vue'
import QuestionChecklist from './components/QuestionChecklist.vue'
import VoterStartScreen from './components/VoterStartScreen.vue'
import maketImg from './images/maket.png'
import photo1 from './images/photo1.jpg'
import photo2 from './images/photo2.jpg'
import photo3 from './images/photo3.jpg'
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
  DocumentView,
  MeetingSettings,
  VoterProfile,
  VoteChoice,
} from './types'
import approvedQuestionsData from './data/approved-questions.json'
import apartments48_1 from './data/apartments-48-1.json'

const approvedQuestionsByHouse: Record<string, string[]> = approvedQuestionsData

const apartmentsByHouse: Record<string, Record<string, { cadastral: string; floor: string; area: string; share: string; name: string; phone: string; wantsBlank: boolean }>> = {
  'пр-т. Октябрьской революции, 48/1': apartments48_1 as any,
}

const materials = [
  { src: maketImg, label: 'Схема установки' },
  { src: photo1, label: 'Коммерческое предложение, стр. 1' },
  { src: photo2, label: 'Коммерческое предложение, стр. 2' },
  { src: photo3, label: 'Коммерческое предложение, стр. 3' },
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
const voterProfileKey = 'voting_voter_profile'
const storedProfile = getStoredVoterProfile()
const voterProfile = ref<VoterProfile | null>(storedProfile)
const profileCompleted = ref(voterProfile.value !== null)
const managerUnlocked = ref(voterProfile.value?.managerUnlocked === true)

if (storedProfile) {
  applyVoterProfile(storedProfile)
}

const documentPath: Record<DocumentView, string> = {
  bulletin: '/',
  notice: '/notice',
  checklist: '/checklist',
}

function getDocumentFromPath(): DocumentView {
  if (window.location.pathname === '/notice') return 'notice'
  if (window.location.pathname === '/checklist') return 'checklist'
  return 'bulletin'
}

const currentDocument = ref<DocumentView>(getDocumentFromPath())
const questionVotes = reactive<Record<number, VoteChoice | undefined>>({})
const approvedQuestionKey = 'voting_approved_questions'
const approvedQuestions = reactive<Record<string, boolean>>(getApprovedQuestions())
const approvedSaveStatus = ref('')
const meetingSaveStatus = ref('')
const meetingSettingsLoaded = ref(false)
let meetingSaveTimer: number | undefined
const canManageMeeting = computed(() => managerUnlocked.value && isManagerIdentity())
const startProfile = computed<VoterProfile>(() => ({
  houseAddress: form.houseAddress,
  ownerName: form.ownerName,
  apartment: form.apartment,
  wantsOnlineVote: voterProfile.value?.wantsOnlineVote || 'yes',
  managerUnlocked: managerUnlocked.value,
}))

const questions = computed(() => buildQuestions(form))
const questionSections = computed(() => buildQuestionSections(questions.value))
const approvedQuestionSections = computed(() =>
  buildQuestionSections(
    questions.value.filter((question) => approvedQuestions[question.title] === true),
  ),
)
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
    share: form.share,
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

watch(
  () => form.apartment,
  (newApartment) => {
    const houseData = apartmentsByHouse[form.houseAddress]

    if (!houseData || !newApartment || !newApartment.trim()) {
      form.ownershipDocument = ''
      form.area = ''
      form.share = ''
      return
    }

    const apt = houseData[newApartment.trim()]
    if (!apt) {
      form.ownershipDocument = ''
      form.area = ''
      form.share = ''
      return
    }

    form.ownershipDocument = apt.cadastral || ''
    form.area = apt.area || ''
    form.share = apt.share || ''
    if (apt.name && (managerUnlocked.value || !form.ownerName.trim())) {
      form.ownerName = apt.name
    }
  },
  { flush: 'sync' },
)

watch(
  () => form.houseAddress,
  () => {
    const houseData = apartmentsByHouse[form.houseAddress]
    const aptNumber = form.apartment.trim()

    if (!houseData || !aptNumber) {
      form.ownershipDocument = ''
      form.area = ''
      form.share = ''
      return
    }

    const apt = houseData[aptNumber]
    if (!apt) {
      form.ownershipDocument = ''
      form.area = ''
      form.share = ''
      return
    }

    form.ownershipDocument = apt.cadastral || ''
    form.area = apt.area || ''
    form.share = apt.share || ''
    if (apt.name && (managerUnlocked.value || !form.ownerName.trim())) {
      form.ownerName = apt.name
    }
  },
  { flush: 'sync' },
)

function printPage(): void {
  window.print()
}

function setCurrentDocument(document: DocumentView): void {
  if (document === 'checklist' && !canManageMeeting.value) {
    return
  }

  currentDocument.value = document
  window.history.pushState({}, '', documentPath[document])
}

function normalizeProfileValue(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ')
}

function isManagerIdentity(): boolean {
  return window.location.search.includes('admin')
}

function getStoredVoterProfile(): VoterProfile | null {
  const savedValue = window.localStorage.getItem(voterProfileKey)

  if (!savedValue) {
    return null
  }

  try {
    const parsedValue = JSON.parse(savedValue) as Partial<VoterProfile>
    if (
      typeof parsedValue.houseAddress === 'string' &&
      typeof parsedValue.ownerName === 'string' &&
      typeof parsedValue.apartment === 'string' &&
      (parsedValue.wantsOnlineVote === 'yes' || parsedValue.wantsOnlineVote === 'no') &&
      typeof parsedValue.managerUnlocked === 'boolean'
    ) {
      return {
        houseAddress: parsedValue.houseAddress,
        ownerName: parsedValue.ownerName,
        apartment: parsedValue.apartment,
        wantsOnlineVote: parsedValue.wantsOnlineVote,
        managerUnlocked: parsedValue.managerUnlocked,
      }
    }
  } catch {
    return null
  }

  return null
}

function applyVoterProfile(profile: VoterProfile): void {
  form.houseAddress = profile.houseAddress
  form.ownerName = profile.ownerName
  form.apartment = profile.apartment
}

function saveVoterProfile(profile: VoterProfile): void {
  window.localStorage.setItem(voterProfileKey, JSON.stringify(profile))
}

function handleProfileSubmit(profile: VoterProfile): void {
  applyVoterProfile(profile)
  managerUnlocked.value = profile.managerUnlocked
  voterProfile.value = profile
  saveVoterProfile(profile)
  profileCompleted.value = true

  if (!canManageMeeting.value && currentDocument.value === 'checklist') {
    setCurrentDocument('bulletin')
  }
}

function editProfile(): void {
  profileCompleted.value = false
}

function handleVoteSelection(questionIndex: number, vote: VoteChoice): void {
  questionVotes[questionIndex] = questionVotes[questionIndex] === vote ? undefined : vote
}

function getMeetingSettings(): MeetingSettings {
  return {
    noticeDate: form.noticeDate,
    votingStartDate: form.votingStartDate,
    votingEndDate: form.votingEndDate,
  }
}

function applyMeetingSettings(settings: MeetingSettings): void {
  form.noticeDate = settings.noticeDate
  form.votingStartDate = settings.votingStartDate
  form.votingEndDate = settings.votingEndDate
}

async function loadMeetingSettingsFromProject(): Promise<void> {
  try {
    const response = await fetch('/api/meeting-settings')

    if (!response.ok) {
      return
    }

    const payload = await response.json() as { settings?: MeetingSettings | null }
    if (payload.settings) {
      applyMeetingSettings(payload.settings)
    }
  } catch {
    // Default form dates remain available if the dev API is unavailable.
  } finally {
    meetingSettingsLoaded.value = true
  }
}

async function saveMeetingSettingsToProject(): Promise<void> {
  meetingSaveStatus.value = 'Сохраняю в проект...'

  try {
    const response = await fetch('/api/meeting-settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(getMeetingSettings()),
    })

    if (!response.ok) {
      const payload = await response.json() as { error?: string }
      throw new Error(payload.error || 'Не удалось сохранить параметры собрания.')
    }

    meetingSaveStatus.value = 'Параметры сохранены в проект'
    window.setTimeout(() => {
      if (meetingSaveStatus.value === 'Параметры сохранены в проект') {
        meetingSaveStatus.value = ''
      }
    }, 1800)
  } catch (error) {
    meetingSaveStatus.value = error instanceof Error
      ? error.message
      : 'Не удалось сохранить параметры собрания.'
  }
}

function scheduleMeetingSettingsSave(): void {
  if (!canManageMeeting.value || !meetingSettingsLoaded.value) {
    return
  }

  if (meetingSaveTimer) {
    window.clearTimeout(meetingSaveTimer)
  }

  meetingSaveTimer = window.setTimeout(() => {
    void saveMeetingSettingsToProject()
  }, 350)
}

function buildApprovedQuestionTitles(): string[] {
  return questions.value
    .filter((question) => approvedQuestions[question.title] === true)
    .map((question) => question.title)
}

function applyApprovedQuestionTitles(titles: string[]): void {
  Object.keys(approvedQuestions).forEach((key) => {
    delete approvedQuestions[key]
  })

  titles.forEach((title) => {
    approvedQuestions[title] = true
  })
}

async function loadApprovedQuestionsFromProject(): Promise<void> {
  const houseQuestions = approvedQuestionsByHouse[form.houseAddress]
  if (Array.isArray(houseQuestions)) {
    applyApprovedQuestionTitles(houseQuestions)
    saveApprovedQuestions()
  }
}

async function saveApprovedQuestionsToProject(): Promise<void> {
  approvedSaveStatus.value = 'Сохраняю...'
  try {
    window.localStorage.setItem(
      '__approved_questions_source',
      JSON.stringify(buildApprovedQuestionTitles()),
    )
    approvedSaveStatus.value = 'Сохранено'
    window.setTimeout(() => {
      if (approvedSaveStatus.value === 'Сохранено') {
        approvedSaveStatus.value = ''
      }
    }, 1800)
  } catch (error) {
    approvedSaveStatus.value = error instanceof Error
      ? error.message
      : 'Не удалось сохранить согласованные вопросы.'
  }
}

function getApprovedQuestions(): Record<string, boolean> {
  const savedValue = window.localStorage.getItem(getApprovedQuestionKey())

  if (!savedValue) {
    return {}
  }

  try {
    const parsedValue = JSON.parse(savedValue) as Record<string, unknown>
    return Object.entries(parsedValue).reduce<Record<string, boolean>>((acc, [key, value]) => {
      if (value === true) {
        acc[key] = true
      }

      return acc
    }, {})
  } catch {
    return {}
  }
}

function saveApprovedQuestions(): void {
  window.localStorage.setItem(getApprovedQuestionKey(), JSON.stringify(approvedQuestions))
}

function getApprovedQuestionKey(): string {
  return approvedQuestionKey
}

function toggleApprovedQuestion(questionTitle: string): void {
  if (approvedQuestions[questionTitle]) {
    delete approvedQuestions[questionTitle]
  } else {
    approvedQuestions[questionTitle] = true
  }

  saveApprovedQuestions()
  void saveApprovedQuestionsToProject()
}

window.addEventListener('popstate', () => {
  const document = getDocumentFromPath()
  currentDocument.value = document === 'checklist' && !canManageMeeting.value
    ? 'bulletin'
    : document
})

watch(
  () => form.houseAddress,
  () => {
    void loadApprovedQuestionsFromProject()
  },
)

watch(profileCompleted, (completed) => {
  if (completed) {
    void loadApprovedQuestionsFromProject()
  }
}, { immediate: true })

watch(profileCompleted, (completed) => {
  if (completed) {
    void loadMeetingSettingsFromProject()
  }
}, { immediate: true })

watch(
  () => [form.noticeDate, form.votingStartDate, form.votingEndDate],
  () => {
    scheduleMeetingSettingsSave()
  },
)

watch(
  canManageMeeting,
  (canManage) => {
    if (!canManage && currentDocument.value === 'checklist') {
      setCurrentDocument('bulletin')
    }
  },
  { immediate: true },
)
</script>

<template>
  <VoterStartScreen
    v-if="!profileCompleted"
    :house-address-options="houseAddressOptions"
    :initial-profile="startProfile"
    @submit="handleProfileSubmit"
  />
  <div v-else class="page-shell">
    <ControlPanel
      :form="form"
      :house-address-options="houseAddressOptions"
      :current-document="currentDocument"
      :can-manage-meeting="canManageMeeting"
      :latest-notice-date="latestNoticeDate"
      :max-voting-end-date="maxVotingEndDate"
      :duration-warning="durationWarning"
      :notice-warning="noticeWarning"
      :gis-identity-warning="gisIdentityWarning"
      :meeting-save-status="meetingSaveStatus"
      @update:current-document="setCurrentDocument"
      @edit-profile="editProfile"
      @print="printPage"
    />
    <div class="documents">
      <header class="page-header">
        <label class="header-label">
          <span>Адрес дома</span>
          <select
            v-model="form.houseAddress"
            class="header-select"
          >
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
        :question-sections="approvedQuestionSections"
        :formatted-dates="formattedDates"
      />
      <QuestionChecklist
        v-else-if="currentDocument === 'checklist' && canManageMeeting"
        :house-address="form.houseAddress"
        :question-sections="questionSections"
        :approved-questions="approvedQuestions"
        :save-status="approvedSaveStatus"
        @toggle-approved="toggleApprovedQuestion"
      />
      <BulletinSheet
        v-else
        :form="form"
        :question-sections="approvedQuestionSections"
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

.header-select:disabled {
  cursor: default;
  color: var(--gos-ink, #0b1e3c);
  opacity: 1;
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

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import BulletinSheet from './components/BulletinSheet.vue'
import ControlPanel from './components/ControlPanel.vue'
import MeetingNotice from './components/MeetingNotice.vue'
import {
  addDays,
  addMonths,
  buildQuestionSections,
  buildQuestionVoteNoteSections,
  buildQuestions,
  createDefaultForm,
  formatRuDate,
  getOwnerFormFromCookie,
  houseAddressOptions,
  saveOwnerFormToCookie,
} from './data/bulletin'
import type {
  BulletinQuestionVoteNoteSection,
  NumberedBulletinQuestionSection,
  VoteChoice,
} from './types'

type DocumentView = 'bulletin' | 'notice'

const form = reactive({
  ...createDefaultForm(),
  ...getOwnerFormFromCookie(),
})
const currentDocument = ref<DocumentView>('bulletin')
const questionVotes = reactive<Record<number, VoteChoice | undefined>>({})

const questions = computed(() => buildQuestions(form))
const questionSections = computed<NumberedBulletinQuestionSection[]>(() => {
  let displayNumber = 1

  return buildQuestionSections(questions.value).map((section) => {
    const numberedSection: NumberedBulletinQuestionSection = {
      ...section,
      questions: section.questions.map((question) => ({
        ...question,
        displayNumber: displayNumber++,
      })),
    }
    return numberedSection
  })
})
const voteNoteSections = computed<BulletinQuestionVoteNoteSection[]>(() =>
  buildQuestionVoteNoteSections(questionSections.value),
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

function handleVoteSelection(questionId: number, vote: VoteChoice): void {
  questionVotes[questionId] = questionVotes[questionId] === vote ? undefined : vote
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
      :vote-note-sections="voteNoteSections"
      @update:current-document="currentDocument = $event"
      @print="printPage"
    />
    <div class="documents">
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
    </div>
  </div>
</template>

<style scoped>
.page-shell {
  display: grid;
  grid-template-columns: minmax(320px, 430px) minmax(0, 1fr);
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(222, 193, 125, 0.16), transparent 28%),
    linear-gradient(180deg, #f1efe8 0%, #f7f5ef 100%);
}

.documents {
  padding: 26px 26px 32px;
}

@media (max-width: 980px) {
  .page-shell {
    grid-template-columns: 1fr;
  }

  .documents {
    padding: 18px 18px 28px;
  }
}

@media print {
  .page-shell {
    display: block;
    background: #fff;
  }

  .documents {
    padding-bottom: 0;
  }
}
</style>

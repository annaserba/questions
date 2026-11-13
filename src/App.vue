<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import BulletinSheet from './components/BulletinSheet.vue'
import ControlPanel from './components/ControlPanel.vue'
import MeetingNotice from './components/MeetingNotice.vue'
import VoterStartScreen from './components/VoterStartScreen.vue'
import VoteRegistry from './components/VoteRegistry.vue'
import maketImg from './images/maket.png'
import photo1 from './images/photo1.jpg'
import photo2 from './images/photo2.jpg'
import photo3 from './images/photo3.jpg'
import mchsImg from './images/IMG_20260618_235449.jpg'
import dorozhnikiImg from './images/IMG_20260618_235454.jpg'
import {
  addDays,
  addMonths,
  buildQuestionSections,
  buildQuestions,
  createDefaultForm,
  formatRuDate,
  getMeetingAdministrationDefaults,
  getOwnerFormFromCookie,
  houseAddressOptions,
  saveOwnerFormToCookie,
} from './data/bulletin'
import type {
  DocumentView,
  MeetingSettings,
  VoteProgressSettings,
  VoteRegistry as VoteRegistryData,
  VoteRegistryStatus,
  VoterProfile,
  VoteChoice,
} from './types'
import apartments48_1 from './data/apartments-48-1.json'
import apartments48 from './data/apartments-48.json'
import initialVoteRegistry from './data/vote-registry.json'
import initialVoteProgress from './data/vote-progress.json'

const apartmentsByHouse: Record<string, Record<string, { cadastral: string; floor: string; area: string; share: string; name?: string; phone: string; wantsBlank: boolean }>> = {
  'пр-т. Октябрьской революции, 48': apartments48 as any,
  'пр-т. Октябрьской революции, 48/1': apartments48_1 as any,
}

type Material = {
  src: string
  label: string
  type: 'image' | 'file'
  printPages?: string[]
}

const materials: Material[] = [
  { src: maketImg, label: 'Схема установки', type: 'image' },
  { src: photo1, label: 'Коммерческое предложение, стр. 1', type: 'image' },
  { src: photo2, label: 'Коммерческое предложение, стр. 2', type: 'image' },
  { src: photo3, label: 'Коммерческое предложение, стр. 3', type: 'image' },
  { src: mchsImg, label: 'Согласование МЧС', type: 'image' },
  { src: dorozhnikiImg, label: 'Согласование дорожных служб', type: 'image' },
  {
    src: '/docs/management-contract-yuzhny-bereg.pdf',
    label: 'Договор управления Южный берег',
    type: 'file',
    printPages: [
      '/docs/management-contract-pages/page-1.png',
      '/docs/management-contract-pages/page-2.png',
      '/docs/management-contract-pages/page-3.png',
      '/docs/management-contract-pages/page-4.png',
      '/docs/management-contract-pages/page-5.png',
      '/docs/management-contract-pages/page-6.png',
      '/docs/management-contract-pages/page-7.png',
      '/docs/management-contract-pages/page-8.png',
    ],
  },
]

const lightboxIndex = ref<number | null>(null)
const materialsOpen = ref(false)

function openLightbox(index: number) {
  if (materials[index]?.type === 'file') {
    return
  }

  lightboxIndex.value = index
}

function closeLightbox() {
  lightboxIndex.value = null
}

function prevImage() {
  if (lightboxIndex.value === null) {
    return
  }

  for (let idx = lightboxIndex.value - 1; idx >= 0; idx--) {
    if (materials[idx]?.type !== 'file') {
      lightboxIndex.value = idx
      return
    }
  }
}

function nextImage() {
  if (lightboxIndex.value === null) {
    return
  }

  for (let idx = lightboxIndex.value + 1; idx < materials.length; idx++) {
    if (materials[idx]?.type !== 'file') {
      lightboxIndex.value = idx
      return
    }
  }
}

function hasPreviousImage(): boolean {
  if (lightboxIndex.value === null) return false
  return materials.slice(0, lightboxIndex.value).some((mat) => mat.type !== 'file')
}

function hasNextImage(): boolean {
  if (lightboxIndex.value === null) return false
  return materials.slice(lightboxIndex.value + 1).some((mat) => mat.type !== 'file')
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
const largePrint = ref(false)
const printExplanations = ref(false)

watch(largePrint, (val) => {
  if (val) {
    document.body.classList.add('large-print')
  } else {
    document.body.classList.remove('large-print')
  }
})

watch(printExplanations, (val) => {
  if (val) {
    document.body.classList.add('print-explanations')
  } else {
    document.body.classList.remove('print-explanations')
  }
})

if (storedProfile) {
  applyVoterProfile(storedProfile)
  form.propertyType = storedProfile.propertyType || 'жилое'
}

const documentPath: Record<DocumentView, string> = {
  bulletin: '/',
  notice: '/notice',
  registry: '/registry',
}

function getDocumentFromPath(): DocumentView {
  if (window.location.pathname === '/notice') return 'notice'
  if (window.location.pathname === '/registry') return 'registry'
  return 'bulletin'
}

const currentDocument = ref<DocumentView>(getDocumentFromPath())
const questionVotes = reactive<Record<number, VoteChoice | undefined>>(loadVotesFromStorage())
const votesStorageKey = 'voting_question_votes'

function loadVotesFromStorage(): Record<number, VoteChoice | undefined> {
  try {
    const raw = window.localStorage.getItem(votesStorageKey + '_' + form.houseAddress)
    if (!raw) return {}
    return JSON.parse(raw) as Record<number, VoteChoice | undefined>
  } catch {
    return {}
  }
}

function saveVotesToStorage(): void {
  window.localStorage.setItem(
    votesStorageKey + '_' + form.houseAddress,
    JSON.stringify(questionVotes)
  )
}
const meetingSaveStatus = ref('')
const meetingSettingsLoaded = ref(false)
let meetingSaveTimer: number | undefined
const noticeDates = reactive<Record<string, string>>({})
const paperDecisionEndDates = reactive<Record<string, string>>({})
const voteRegistry = reactive<VoteRegistryData>(initialVoteRegistry as VoteRegistryData)
const voteProgress = reactive<VoteProgressSettings>(initialVoteProgress as VoteProgressSettings)
const voteRegistryLoaded = ref(false)
const voteRegistrySaving = ref(false)
const voteRegistrySaveStatus = ref('')
let voteRegistrySaveTimer: number | undefined
let voteProgressSaveTimer: number | undefined
const canManageMeeting = computed(() => managerUnlocked.value && isManagerIdentity())
const startProfile = computed<VoterProfile>(() => ({
  houseAddress: form.houseAddress,
  ownerName: form.ownerName,
  apartment: form.apartment,
  propertyType: form.propertyType as 'жилое' | 'нежилое',
  wantsOnlineVote: voterProfile.value?.wantsOnlineVote || 'yes',
  managerUnlocked: managerUnlocked.value,
}))

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
  paperDecisionStartDate: formatRuDate(form.paperDecisionStartDate),
  paperDecisionEndDate: formatRuDate(form.paperDecisionEndDate),
}))

function updatePrintSignatureName(signatureName: string): void {
  const value = signatureName.trim() || '__________________________'
  document.documentElement.style.setProperty(
    '--print-signature-name',
    JSON.stringify(value),
  )
}

watch(
  () => [
    form.isRepresentative,
    form.representativeName,
    form.ownerName,
  ] as const,
  ([isRepresentative, representativeName, ownerName]) => {
    updatePrintSignatureName(
      isRepresentative ? representativeName : ownerName,
    )
  },
  { immediate: true },
)

watch(
  () => ({
    ownerName: form.ownerName,
    apartment: form.apartment,
    area: form.area,
    ownershipDocument: form.ownershipDocument,
    passportNumber: form.passportNumber,
    snils: form.snils,
    phone: form.phone,
    propertyType: form.propertyType,
    isRepresentative: form.isRepresentative,
    representativeName: form.representativeName,
    representativePhone: form.representativePhone,
    representativePassport: form.representativePassport,
    representativeSnils: form.representativeSnils,
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
  () => [form.apartment, form.propertyType] as const,
  ([newApartment]) => {
    const houseData = apartmentsByHouse[form.houseAddress]

    if (!houseData || !newApartment || !newApartment.trim()) {
      form.ownershipDocument = ''
      form.area = ''
      form.share = '1/1'
      return
    }

    const key = newApartment.trim()
    const officeKey = 'офис' + key
    const lookupKey = form.propertyType === 'нежилое' ? officeKey : key
    const apt = houseData[lookupKey] || (form.propertyType === 'жилое' ? houseData[officeKey] : houseData[key])
    if (!apt) {
      form.ownershipDocument = ''
      form.area = ''
      form.share = '1/1'
      return
    }

    form.ownershipDocument = apt.cadastral || ''
    form.area = apt.area || ''
    form.share = apt.share || '1/1'
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
      form.share = '1/1'
      return
    }

    const apt = houseData[aptNumber]
      || houseData['офис' + aptNumber]
    if (!apt) {
      form.ownershipDocument = ''
      form.area = ''
      form.share = '1/1'
      return
    }

    form.ownershipDocument = apt.cadastral || ''
    form.area = apt.area || ''
    form.share = apt.share || '1/1'
  },
  { flush: 'sync' },
)

function printPage(): void {
  const originalTitle = document.title
  const documentLabel = currentDocument.value === 'notice' ? 'Уведомление' : 'Бюллетень'
  const houseLabel = form.houseAddress
    .replace('пр-т. Октябрьской революции, ', 'ПОР ')
    .replace('/', '-')

  document.title = `${documentLabel} ${houseLabel}`
  window.print()
  document.title = originalTitle
}

function setCurrentDocument(document: DocumentView): void {
  currentDocument.value = document
  const adminParam = window.location.search.includes('admin') ? '?admin' : ''
  window.history.pushState({}, '', documentPath[document] + adminParam)
}

function normalizeProfileValue(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU').replace(/\s+/g, ' ')
}

function isManagerIdentity(): boolean {
  return window.location.search.includes('admin') || managerUnlocked.value
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
        propertyType: parsedValue.propertyType === 'нежилое' ? 'нежилое' : 'жилое',
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
  form.propertyType = profile.propertyType || 'жилое'
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

}

function editProfile(): void {
  profileCompleted.value = false
}

function handleVoteSelection(questionIndex: number, vote: VoteChoice): void {
  questionVotes[questionIndex] = questionVotes[questionIndex] === vote ? undefined : vote
  saveVotesToStorage()
}

function getMeetingSettings(): MeetingSettings {
  noticeDates[form.houseAddress] = form.noticeDate
  paperDecisionEndDates[form.houseAddress] = form.paperDecisionEndDate

  return {
    noticeDate: form.noticeDate,
    noticeDates: { ...noticeDates },
    votingStartDate: form.votingStartDate,
    votingEndDate: form.votingEndDate,
    paperDecisionReceptionProcedure: form.paperDecisionReceptionProcedure,
    materialsReviewProcedure: form.materialsReviewProcedure,
    paperDecisionStartDate: form.paperDecisionStartDate,
    paperDecisionStartTime: form.paperDecisionStartTime,
    paperDecisionEndDate: form.paperDecisionEndDate,
    paperDecisionEndTime: form.paperDecisionEndTime,
    paperDecisionEndDates: { ...paperDecisionEndDates },
    protocolStorageAddress: form.protocolStorageAddress,
  }
}

function applyMeetingSettings(settings: MeetingSettings): void {
  Object.assign(noticeDates, settings.noticeDates)
  form.noticeDate = noticeDates[form.houseAddress] || settings.noticeDate
  form.votingStartDate = settings.votingStartDate
  form.votingEndDate = settings.votingEndDate
  form.paperDecisionReceptionProcedure = settings.paperDecisionReceptionProcedure
  form.materialsReviewProcedure = settings.materialsReviewProcedure
  form.paperDecisionStartDate = settings.paperDecisionStartDate
  form.paperDecisionStartTime = settings.paperDecisionStartTime
  Object.assign(paperDecisionEndDates, settings.paperDecisionEndDates)
  form.paperDecisionEndDate =
    paperDecisionEndDates[form.houseAddress] || settings.paperDecisionEndDate
  form.paperDecisionEndTime = settings.paperDecisionEndTime
  form.protocolStorageAddress = settings.protocolStorageAddress
  syncHouseAdministrationDetails()
}

function syncHouseAdministrationDetails(): void {
  const currentDefaults = houseAddressOptions.map(getMeetingAdministrationDefaults)
  const nextDefaults = getMeetingAdministrationDefaults(form.houseAddress)

  if (currentDefaults.some((item) => item.paperDecisionReceptionProcedure === form.paperDecisionReceptionProcedure)) {
    form.paperDecisionReceptionProcedure = nextDefaults.paperDecisionReceptionProcedure
  }

  if (currentDefaults.some((item) => item.protocolStorageAddress === form.protocolStorageAddress)) {
    form.protocolStorageAddress = nextDefaults.protocolStorageAddress
  }
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

function todayIsoDate(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function updateVoteRegistryStatus(
  house: string,
  entrance: string,
  floor: string,
  apartment: string,
  status: VoteRegistryStatus,
): void {
  const entry = voteRegistry[house]?.[entrance]?.[floor]?.find((item) => item.apartment === apartment)
  if (!entry) return

  entry.status = status
  entry.updatedAt = status === 'pending' ? '' : todayIsoDate()
  scheduleVoteRegistrySave()
}

function updateVoteRegistryNote(house: string, entrance: string, floor: string, apartment: string, note: string): void {
  const entry = voteRegistry[house]?.[entrance]?.[floor]?.find((item) => item.apartment === apartment)
  if (!entry) return

  entry.note = note.trim()
  scheduleVoteRegistrySave()
}

async function loadVoteRegistryFromProject(): Promise<void> {
  try {
    const response = await fetch('/api/vote-registry')
    if (!response.ok) return

    const payload = await response.json() as { registry?: VoteRegistryData }
    if (payload.registry) {
      Object.keys(voteRegistry).forEach((house) => delete voteRegistry[house])
      Object.assign(voteRegistry, payload.registry)
    }
  } catch {
    // The starter JSON remains available if the local API is unavailable.
  } finally {
    voteRegistryLoaded.value = true
  }
}

async function loadVoteProgressFromProject(): Promise<void> {
  try {
    const response = await fetch('/api/vote-progress')
    if (!response.ok) return
    const payload = await response.json() as { settings?: VoteProgressSettings }
    if (payload.settings) {
      Object.keys(voteProgress).forEach((house) => delete voteProgress[house])
      Object.assign(voteProgress, payload.settings)
    }
  } catch {
    // The starter values remain available if the local API is unavailable.
  }
}

function updateVoteProgress(house: string, area: number): void {
  voteProgress[house] = Math.max(0, Number.isFinite(area) ? area : 0)
  if (voteProgressSaveTimer) window.clearTimeout(voteProgressSaveTimer)
  voteProgressSaveTimer = window.setTimeout(() => {
    void saveVoteProgressToProject()
  }, 250)
}

async function saveVoteProgressToProject(): Promise<void> {
  try {
    await fetch('/api/vote-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteProgress),
    })
  } catch {
    // The next change will retry saving the progress settings.
  }
}

async function saveVoteRegistryToProject(): Promise<void> {
  voteRegistrySaving.value = true
  voteRegistrySaveStatus.value = 'Сохраняю в JSON...'

  try {
    const response = await fetch('/api/vote-registry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteRegistry),
    })
    if (!response.ok) {
      const payload = await response.json() as { error?: string }
      throw new Error(payload.error || 'Не удалось сохранить реестр.')
    }
    voteRegistrySaveStatus.value = 'Реестр сохранен в проект'
    window.setTimeout(() => {
      if (voteRegistrySaveStatus.value === 'Реестр сохранен в проект') {
        voteRegistrySaveStatus.value = ''
      }
    }, 1800)
  } catch (error) {
    voteRegistrySaveStatus.value = error instanceof Error ? error.message : 'Не удалось сохранить реестр.'
  } finally {
    voteRegistrySaving.value = false
  }
}

function scheduleVoteRegistrySave(): void {
  if (!canManageMeeting.value || !voteRegistryLoaded.value) return
  if (voteRegistrySaveTimer) window.clearTimeout(voteRegistrySaveTimer)
  voteRegistrySaveTimer = window.setTimeout(() => {
    void saveVoteRegistryToProject()
  }, 250)
}

function voteForAll(): void {
  questions.value.forEach((_, idx) => {
    questionVotes[idx + 1] = 'for'
  })
  saveVotesToStorage()
}

const printFooterStyleId = 'print-footer-style'

function injectPrintFooter(): void {
  if (document.getElementById(printFooterStyleId)) return
  const style = document.createElement('style')
  style.id = printFooterStyleId
  style.textContent = `@media print { @page { margin-bottom: 20mm; @bottom-left { content: "Подпись __________________________"; padding-top: 2mm; font-family: "Times New Roman", serif; font-size: 7.6pt; color: #000; } @bottom-right { content: "Расшифровка подписи " var(--print-signature-name, "__________________________") "   Дата ____________________"; padding-top: 2mm; font-family: "Times New Roman", serif; font-size: 7.6pt; color: #000; text-align: right; } } @page :first { @bottom-left { content: none; } @bottom-right { content: none; } } }`
  document.head.appendChild(style)
}

function removePrintFooter(): void {
  const style = document.getElementById(printFooterStyleId)
  if (style) style.remove()
}

watch(currentDocument, (doc) => {
  if (doc === 'bulletin') {
    injectPrintFooter()
  } else {
    removePrintFooter()
  }
}, { immediate: true })

window.addEventListener('popstate', () => {
  currentDocument.value = getDocumentFromPath()
})

watch(
  () => form.houseAddress,
  () => {
    syncHouseAdministrationDetails()
    if (noticeDates[form.houseAddress]) {
      form.noticeDate = noticeDates[form.houseAddress]
    }
    if (paperDecisionEndDates[form.houseAddress]) {
      form.paperDecisionEndDate = paperDecisionEndDates[form.houseAddress]
    }
    const saved = loadVotesFromStorage()
    Object.keys(questionVotes).forEach(k => delete questionVotes[Number(k)])
    Object.assign(questionVotes, saved)
  },
)

watch(profileCompleted, (completed) => {
  if (completed) {
    void loadMeetingSettingsFromProject()
    void loadVoteRegistryFromProject()
    void loadVoteProgressFromProject()
  }
}, { immediate: true })

watch(
  () => [
    form.noticeDate,
    form.votingStartDate,
    form.votingEndDate,
    form.paperDecisionReceptionProcedure,
    form.materialsReviewProcedure,
    form.paperDecisionStartDate,
    form.paperDecisionStartTime,
    form.paperDecisionEndDate,
    form.paperDecisionEndTime,
    form.protocolStorageAddress,
  ],
  () => {
    noticeDates[form.houseAddress] = form.noticeDate
    paperDecisionEndDates[form.houseAddress] = form.paperDecisionEndDate
    scheduleMeetingSettingsSave()
  },
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
      <header v-if="currentDocument !== 'registry'" class="page-header">
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
        <div class="header-actions">
          <button class="header-print" type="button" @click="printPage">
            Печать
          </button>
          <button
            class="header-toggle"
            :class="{ active: largePrint }"
            type="button"
            @click="largePrint = !largePrint"
          >
            Крупный шрифт
          </button>
          <button
            class="header-toggle"
            :class="{ active: printExplanations }"
            type="button"
            @click="printExplanations = !printExplanations"
          >
            С пояснениями
          </button>
        </div>
        <button
          class="header-action header-vote-all"
          type="button"
          @click="voteForAll"
        >
          Голосовать ЗА везде
        </button>
      </header>
      <VoteRegistry
        v-if="currentDocument === 'registry' && canManageMeeting"
        :house-address="form.houseAddress"
        :registry="voteRegistry"
        :house-progress="voteProgress"
        :saving="voteRegistrySaving"
        :save-status="voteRegistrySaveStatus"
        :is-page="true"
        @close="setCurrentDocument('bulletin')"
        @update-status="updateVoteRegistryStatus"
        @update-note="updateVoteRegistryNote"
        @update-house-progress="updateVoteProgress"
      />
      <MeetingNotice
        v-else-if="currentDocument === 'notice'"
        :form="form"
        :question-sections="questionSections"
        :formatted-dates="formattedDates"
        :materials="materials"
      />
      <BulletinSheet
        v-else
        :form="form"
        :question-sections="questionSections"
        :formatted-dates="formattedDates"
        :question-votes="questionVotes"
        @select-vote="handleVoteSelection"
      />

      <footer v-if="currentDocument !== 'registry'" class="materials-footer" :class="{ open: materialsOpen }">
        <button class="materials-toggle" type="button" @click="materialsOpen = !materialsOpen">
          <h3>Приложения</h3>
          <span class="materials-caret">{{ materialsOpen ? '▲' : '▼' }}</span>
        </button>
        <div class="materials-body">
          <div class="materials-slider">
            <template
              v-for="(mat, idx) in materials"
              :key="idx"
            >
              <figure
                v-if="mat.type !== 'file'"
                class="mat-slide"
                @click="openLightbox(idx)"
              >
                <img :src="mat.src" :alt="mat.label" />
                <figcaption>{{ mat.label }}</figcaption>
              </figure>
              <a
                v-else
                class="mat-slide mat-file"
                :href="mat.src"
                target="_blank"
                rel="noopener"
              >
                <span class="mat-file-icon">DOC</span>
                <span>{{ mat.label }}</span>
              </a>
            </template>
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
          v-if="hasPreviousImage()"
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
          v-if="hasNextImage()"
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

.header-action {
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

.header-action:hover {
  background: #0b3fb0;
}

.header-toggle {
  flex-shrink: 0;
  padding: 10px 20px;
  border: 1px solid rgba(13, 76, 211, 0.25);
  border-radius: 8px;
  background: transparent;
  color: var(--gos-blue);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 140ms ease;
}

.header-toggle.active {
  background: var(--gos-blue);
  color: #fff;
  border-color: var(--gos-blue);
}

.header-toggle:hover {
  background: rgba(13, 76, 211, 0.08);
}

.header-toggle.active:hover {
  background: #0b3fb0;
}


.header-vote-all:hover {
  background: #0b3fb0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
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

.mat-file {
  display: grid;
  place-items: center;
  gap: 8px;
  min-height: 153px;
  padding: 16px 12px;
  color: var(--gos-blue);
  text-align: center;
  text-decoration: none;
  background: #edf5ff;
}

.mat-file-icon {
  display: inline-grid;
  place-items: center;
  width: 54px;
  height: 40px;
  border: 1px solid #9bbcf5;
  border-radius: 6px;
  background: #fff;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
}

.mat-file span:last-child {
  max-width: 100%;
  font-size: 0.78rem;
  font-weight: 700;
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

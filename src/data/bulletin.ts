import type {
  BulletinForm,
  BulletinQuestion,
  BulletinQuestionSection,
} from '../types'

export const houseAddressOptions = [
  'пр-т. Октябрьской революции, 48',
  'пр-т. Октябрьской революции, 48/1',
] as const

export const houseChairman: Record<string, string> = {
  'пр-т. Октябрьской революции, 48': 'Филиппова Галина Вячеславовна',
  'пр-т. Октябрьской революции, 48/1': 'Серба Анна Владимировна',
}

const ownerCookieName = 'voting_owner_profile'
const ownerCookieFields = [
  'ownerName',
  'apartment',
  'area',
  'ownershipDocument',
  'passportNumber',
  'snils',
  'phone',
  'share',
  'extraNotes',
] as const

type OwnerCookieField = (typeof ownerCookieFields)[number]
type OwnerCookieData = Pick<BulletinForm, OwnerCookieField>

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function parseDate(dateString: string): Date | null {
  if (!dateString) {
    return null
  }

  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? null : date
}

export function addDays(dateString: string, days: number): string {
  const date = parseDate(dateString)
  if (!date) {
    return ''
  }

  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export function addMonths(dateString: string, months: number): string {
  const date = parseDate(dateString)
  if (!date) {
    return ''
  }

  const targetDay = date.getDate()
  date.setMonth(date.getMonth() + months)

  if (date.getDate() !== targetDay) {
    date.setDate(0)
  }

  return toIsoDate(date)
}

export function formatRuDate(dateString: string): string {
  const date = parseDate(dateString)
  if (!date) {
    return '________________'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function createDefaultForm(): BulletinForm {
  const today = new Date()
  const noticeDate = new Date(today)
  noticeDate.setDate(today.getDate() + 10)

  const votingStartDate = new Date(noticeDate)
  votingStartDate.setDate(noticeDate.getDate() + 10)

  const votingEndDate = new Date(votingStartDate)
  votingEndDate.setMonth(votingStartDate.getMonth() + 2)

  return {
    houseAddress: houseAddressOptions[0],
    managementCompany: 'ООО «Южный берег»',
    previousManagementCompany: 'ООО «УК Стрелецкая бухта»',
    meetingType:
      'В форме электронного голосования через Государственную информационную систему жилищно-коммунального хозяйства (ГИС ЖКХ)',
    noticeDate: toIsoDate(noticeDate),
    votingStartDate: toIsoDate(votingStartDate),
    votingEndDate: toIsoDate(votingEndDate),
    ownerName: '',
    apartment: '',
    area: '',
    ownershipDocument: '',
    passportNumber: '',
    snils: '',
    phone: '',
    share: '1/1',
    extraNotes: '',
  }
}

export function getOwnerFormFromCookie(): Partial<OwnerCookieData> {
  if (typeof document === 'undefined') {
    return {}
  }

  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${ownerCookieName}=`))

  if (!cookie) {
    return {}
  }

  try {
    const rawValue = cookie.slice(ownerCookieName.length + 1)
    const parsedValue = JSON.parse(
      decodeURIComponent(rawValue),
    ) as Partial<Record<OwnerCookieField, unknown>>

    return ownerCookieFields.reduce<Partial<OwnerCookieData>>((acc, field) => {
      if (typeof parsedValue[field] === 'string') {
        acc[field] = parsedValue[field]
      }

      return acc
    }, {})
  } catch {
    return {}
  }
}

export function saveOwnerFormToCookie(data: OwnerCookieData): void {
  if (typeof document === 'undefined') {
    return
  }

  const normalizedData = ownerCookieFields.reduce<OwnerCookieData>((acc, field) => {
    acc[field] = data[field]
    return acc
  }, {
    ownerName: '',
    apartment: '',
    area: '',
    ownershipDocument: '',
    passportNumber: '',
    snils: '',
    phone: '',
    share: '1/1',
    extraNotes: '',
  })

  const isEmpty = ownerCookieFields.every((field) => !normalizedData[field].trim())

  if (isEmpty) {
    document.cookie = `${ownerCookieName}=; max-age=0; path=/; samesite=lax`
    return
  }

  document.cookie = `${ownerCookieName}=${encodeURIComponent(JSON.stringify(normalizedData))}; max-age=31536000; path=/; samesite=lax`
}

export { buildQuestions } from './questions'

export function buildQuestionSections(
  questions: BulletinQuestion[],
): BulletinQuestionSection[] {
  let number = 1
  const groups = new Map<string, BulletinQuestion[]>()

  for (const q of questions) {
    if (!groups.has(q.section)) {
      groups.set(q.section, [])
    }
    groups.get(q.section)!.push(q)
  }

  return Array.from(groups.entries()).map(([title, sectionQuestions]) => {
    const startNumber = number
    number += sectionQuestions.length
    return { title, startNumber, questions: sectionQuestions }
  })
}

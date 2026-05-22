import type {
  BulletinForm,
  BulletinQuestion,
  BulletinQuestionSection,
  NumberedBulletinQuestionSection,
  BulletinQuestionVoteNoteSection,
} from '../types'

export const houseAddressOptions = [
  'г. Севастополь, пр-т. Октябрьской революции, 48',
  'г. Севастополь, пр-т. Октябрьской революции, 48/1',
] as const

const ownerCookieName = 'voting_owner_profile'
const ownerCookieFields = [
  'ownerName',
  'apartment',
  'area',
  'ownershipDocument',
  'passportNumber',
  'snils',
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
  votingEndDate.setMonth(votingStartDate.getMonth() + 1)

  return {
    houseAddress: houseAddressOptions[0],
    managementCompany: '"Стрелецкая бухта"',
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
    extraNotes: '',
  })

  const isEmpty = ownerCookieFields.every((field) => !normalizedData[field].trim())

  if (isEmpty) {
    document.cookie = `${ownerCookieName}=; max-age=0; path=/; samesite=lax`
    return
  }

  document.cookie = `${ownerCookieName}=${encodeURIComponent(JSON.stringify(normalizedData))}; max-age=31536000; path=/; samesite=lax`
}

export function buildQuestions(form: BulletinForm): BulletinQuestion[] {
  return [
    {
      id: 1,
      title: 'О реализации ранее принятого решения об установке шлагбаумов',
      description:
        'Принять решение о реализации ранее принятого собственниками решения об установке шлагбаумов на въездах к придомовой территории многоквартирного дома; определить, что в рамках исполнения указанного решения подлежат уточнению места размещения оборудования, технические параметры, состав работ по поставке, монтажу, подключению, настройке и вводу в эксплуатацию; предусмотреть беспрепятственный доступ для собственников помещений, а также аварийных, коммунальных и экстренных служб; поручить управляющей компании организовать выполнение необходимых мероприятий по реализации ранее утвержденного проекта.',
    },
    {
      id: 2,
      title:
        'О наделении полномочиями по согласованию установки ворот и шлагбаумов',
      description:
        'Уполномочить управляющую компанию и/или председателя совета многоквартирного дома представлять интересы собственников помещений по вопросам согласования установки ворот и шлагбаумов, в том числе подавать заявления, схемы, проекты и иные документы, получать технические условия, согласования, замечания, ответы и иные документы, а также взаимодействовать с государственными органами, органами местного самоуправления, МЧС России, подразделениями ГИБДД, ресурсоснабжающими, коммунальными и иными организациями по вопросам размещения, установки и эксплуатации указанного оборудования.',
    },
    {
      id: 3,
      title: 'Об установке системы видеонаблюдения в подъездах и лифтах',
      description:
        'Принять решение об установке системы видеонаблюдения в подъездах, у входных групп и в кабинах лифтов для повышения уровня безопасности, сохранности общего имущества и фиксации инцидентов; определить места установки камер с учетом технической возможности монтажа; включить в состав работ поставку оборудования, монтаж, подключение, настройку и ввод системы в эксплуатацию; поручить управляющей компании организовать выполнение монтажных работ и взаимодействие с подрядной организацией.',
    },
    {
      id: 4,
      title:
        'Об утверждении организации "Севдомофон" для обслуживания камер и домофонных систем',
      description:
        'Принять решение об утверждении организации "Севдомофон" в качестве исполнителя услуг по техническому обслуживанию камер видеонаблюдения и домофонных систем, установленных в подъездах, лифтах, на калитках во внутренний двор и на площадке для сбора мусора; поручить заключение соответствующих договоров на обслуживание, диагностику, настройку, ремонт и поддержание работоспособности указанного оборудования.',
    },
    {
      id: 5,
      title:
        'О единоразовом сборе денежных средств через управляющую компанию на реализацию решения по шлагбаумам',
      description: `Принять решение о единоразовом сборе денежных средств через ${form.managementCompany} на приобретение, поставку, монтаж, подключение, настройку и ввод в эксплуатацию шлагбаумов; установить, что начисление производится отдельной строкой в платежных документах с указанием целевого назначения платежа; поручить управляющей компании вести раздельный учет поступивших средств и расходов по данному мероприятию и предоставлять собственникам информацию о расходовании денежных средств.`,
    },
    {
      id: 6,
      title: 'О создании специального счета для ремонта и обслуживания шлагбаумов',
      description:
        'Принять решение о создании специального счета для накопления и расходования денежных средств на ремонт, техническое обслуживание, восстановление и при необходимости замену шлагбаумов после реализации ранее принятого решения об их установке; определить целевое назначение счета исключительно для работ и услуг, связанных со шлагбаумами; установить, что расходование средств допускается на основании договоров, актов выполненных работ, счетов и иных подтверждающих документов; поручить управляющей компании вести учет поступлений и расходов по указанному счету.',
    },
    {
      id: 7,
      title:
        'О единоразовом сборе денежных средств через управляющую компанию на установку камер',
      description:
        `Принять решение о единоразовом сборе денежных средств через ${form.managementCompany} на приобретение, поставку, монтаж, подключение, настройку и ввод в эксплуатацию системы видеонаблюдения в подъездах и лифтах; установить, что начисление производится отдельной строкой в платежных документах с указанием целевого назначения платежа; поручить управляющей компании вести раздельный учет поступивших средств и расходов по данному мероприятию и предоставлять собственникам информацию о расходовании денежных средств.`,
    },
    {
      id: 8,
      title: 'О создании отдельного счета для оплаты электроэнергии оборудования',
      description:
        'Принять решение о создании отдельного счета для учета и оплаты электроэнергии, потребляемой оборудованием, установленным по решениям настоящего собрания, включая шлагбаумы, систему открытия ворот, камеры видеонаблюдения и иное утвержденное оборудование; обеспечить раздельный учет соответствующих расходов; поручить управляющей компании организовать выставление начислений и контроль оплаты по данному направлению.',
    },
    {
      id: 9,
      title: 'О создании отдельного счета для электроэнергии домофона на мусорной площадке',
      description:
        'Принять решение о создании отдельного счета для оплаты электроэнергии, необходимой для установки и эксплуатации домофона на площадке для сбора мусора; определить, что данный счет используется исключительно для расходов, связанных с электроснабжением указанного оборудования; поручить управляющей компании обеспечить раздельный учет таких расходов и их выделение из иных коммунальных затрат.',
    },
    {
      id: 10,
      title:
        'О единоразовом сборе денежных средств через управляющую компанию на систему открытия ворот',
      description:
        `Принять решение о единоразовом сборе денежных средств через ${form.managementCompany} на приобретение, монтаж, подключение и настройку системы дистанционного открытия ворот; включить в состав расходов стоимость оборудования, монтажных и пусконаладочных работ, ввода системы в эксплуатацию и первичного запуска; предусмотреть возможность использования брелоков, ключей, телефонных номеров и иных идентификаторов в зависимости от выбранного технического решения; установить, что начисление производится отдельной строкой в платежных документах с указанием целевого назначения платежа; поручить управляющей компании вести раздельный учет поступивших средств и расходов по данному мероприятию.`,
    },
    {
      id: 11,
      title: 'Об установке домофона на калитки, ведущие во внутренний двор',
      description:
        'Принять решение об установке домофонной системы на калитки, ведущие во внутренний двор, с привлечением подрядной организации "Севдомофон"; утвердить выбор указанного подрядчика для поставки, монтажа и настройки оборудования; предусмотреть подключение системы, настройку доступа для собственников помещений и ввод оборудования в эксплуатацию; поручить управляющей компании заключить договор и принять выполненные работы.',
    },
  ]
}

const questionSectionOrder = [
  {
    title: 'Ворота',
    questionIds: [2, 10],
  },
  {
    title: 'Шлагбаумы',
    questionIds: [1, 5, 6],
  },
  {
    title: 'Домофоны',
    questionIds: [9, 11],
  },
  {
    title: 'Камеры',
    questionIds: [3, 7],
  },
  {
    title: 'Общие вопросы',
    questionIds: [4, 8],
  },
] as const

const questionVoteRequirementNotes: Record<number, string> = {
  1: 'Ориентир для подготовки: 2/3 голосов.',
  2: 'Ориентир для подготовки: 2/3 голосов.',
  3: 'Ориентир для подготовки: 2/3 голосов.',
  4: 'Ориентир для подготовки: 50% + 1 голос.',
  5: 'Ориентир для подготовки: 2/3 голосов.',
  6: 'Ориентир для подготовки: 2/3 голосов.',
  7: 'Ориентир для подготовки: 2/3 голосов.',
  8: 'Ориентир для подготовки: 50% + 1 голос.',
  9: 'Ориентир для подготовки: 50% + 1 голос.',
  10: 'Ориентир для подготовки: 2/3 голосов.',
  11: 'Ориентир для подготовки: 2/3 голосов.',
}

export function buildQuestionSections(
  questions: BulletinQuestion[],
): BulletinQuestionSection[] {
  const questionsById = new Map(questions.map((question) => [question.id, question]))

  return questionSectionOrder
    .map((section) => ({
      title: section.title,
      questions: section.questionIds
        .map((questionId) => questionsById.get(questionId))
        .filter((question): question is BulletinQuestion => Boolean(question)),
    }))
    .filter((section) => section.questions.length > 0)
}

export function buildQuestionVoteNoteSections(
  sections: NumberedBulletinQuestionSection[],
): BulletinQuestionVoteNoteSection[] {
  return sections.map((section) => ({
    title: section.title,
    items: section.questions.map((question) => ({
      id: question.id,
      displayNumber: question.displayNumber,
      title: question.title,
      note:
        questionVoteRequirementNotes[question.id] ??
        'Ориентир для подготовки: проверьте применимый порог голосов.',
    })),
  }))
}

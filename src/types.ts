export interface BulletinForm {
  houseAddress: string
  managementCompany: string
  previousManagementCompany: string
  meetingType: string
  noticeDate: string
  votingStartDate: string
  votingEndDate: string
  ownerName: string
  apartment: string
  area: string
  ownershipDocument: string
  passportNumber: string
  snils: string
  extraNotes: string
}

export interface BulletinQuestion {
  title: string
  description: string
  explanation?: string
  section: string
}

export type VoteChoice = 'for' | 'against' | 'abstain'

export interface BulletinQuestionSection {
  title: string
  startNumber: number
  questions: BulletinQuestion[]
}

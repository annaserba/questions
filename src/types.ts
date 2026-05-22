export interface BulletinForm {
  houseAddress: string
  managementCompany: string
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
  id: number
  title: string
  description: string
}

export type VoteChoice = 'for' | 'against' | 'abstain'

export interface BulletinQuestionSection {
  title: string
  questions: BulletinQuestion[]
}

export interface NumberedBulletinQuestion extends BulletinQuestion {
  displayNumber: number
}

export interface NumberedBulletinQuestionSection {
  title: string
  questions: NumberedBulletinQuestion[]
}

export interface BulletinQuestionVoteNote {
  id: number
  displayNumber: number
  title: string
  note: string
}

export interface BulletinQuestionVoteNoteSection {
  title: string
  items: BulletinQuestionVoteNote[]
}

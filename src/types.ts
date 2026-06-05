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

export type DocumentView = 'bulletin' | 'notice' | 'checklist'

export type OnlineVotePreference = 'yes' | 'no'

export interface VoterProfile {
  houseAddress: string
  ownerName: string
  apartment: string
  wantsOnlineVote: OnlineVotePreference
  managerUnlocked: boolean
}

export interface ApprovedQuestionRecord {
  index: number
  section: string
  title: string
  description: string
}

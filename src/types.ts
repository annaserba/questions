export interface BulletinForm {
  houseAddress: string
  managementCompany: string
  previousManagementCompany: string
  meetingType: string
  noticeDate: string
  votingStartDate: string
  votingEndDate: string
  paperDecisionReceptionProcedure: string
  materialsReviewProcedure: string
  paperDecisionStartDate: string
  paperDecisionStartTime: string
  paperDecisionEndDate: string
  paperDecisionEndTime: string
  protocolStorageAddress: string
  ownerName: string
  apartment: string
  area: string
  ownershipDocument: string
  share: string
  passportNumber: string
  snils: string
  phone: string
  propertyType: 'жилое' | 'нежилое'
  isRepresentative: boolean
  representativeName: string
  representativePhone: string
  representativePassport: string
  representativeSnils: string
  extraNotes: string
}

export interface BulletinQuestion {
  title: string
  description: string
  explanation?: string
  section: string
  quorum?: string
}

export type VoteChoice = 'for' | 'against' | 'abstain'

export interface BulletinQuestionSection {
  title: string
  startNumber: number
  questions: BulletinQuestion[]
}

export type DocumentView = 'bulletin' | 'notice' | 'registry'

export type OnlineVotePreference = 'yes' | 'no'

export interface VoterProfile {
  houseAddress: string
  ownerName: string
  apartment: string
  propertyType: 'жилое' | 'нежилое'
  wantsOnlineVote: OnlineVotePreference
  managerUnlocked: boolean
}

export interface MeetingSettings {
  noticeDate: string
  noticeDates: Record<string, string>
  votingStartDate: string
  votingEndDate: string
  paperDecisionReceptionProcedure: string
  materialsReviewProcedure: string
  paperDecisionStartDate: string
  paperDecisionStartTime: string
  paperDecisionEndDate: string
  paperDecisionEndTime: string
  paperDecisionEndDates: Record<string, string>
  protocolStorageAddress: string
}

export type VoteRegistryStatus = 'pending' | 'online' | 'paper'
export type PreviousVoteStatus = 'none' | 'online' | 'paper' | 'online_and_paper'

export interface VoteRegistryEntry {
  apartment: string
  ownerName: string
  phone: string
  area: string
  cadastral: string
  previousVote: PreviousVoteStatus
  status: VoteRegistryStatus
  updatedAt: string
  note: string
}

export type VoteRegistry = Record<string, Record<string, Record<string, VoteRegistryEntry[]>>>

export type VoteProgressSettings = Record<string, number>

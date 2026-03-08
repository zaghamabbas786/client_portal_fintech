import type { Role, PostTag, TicketStatus, TicketPriority, EAStatus, FileType } from '@prisma/client'

export type { Role, PostTag, TicketStatus, TicketPriority, EAStatus, FileType }

export interface UserProfile {
  id: string
  supabaseId: string
  email: string
  fullName: string | null
  phone: string | null
  avatarUrl: string | null
  role: Role
  referralCode: string
  emailNotifications: boolean
  communityAlerts: boolean
  payoutUpdates: boolean
  createdAt: Date
}

export interface PostWithMeta {
  id: string
  content: string
  tag: PostTag
  amount: string | null
  imageUrl: string | null
  isPinned: boolean
  createdAt: Date
  user: {
    id: string
    fullName: string | null
    email: string
    role: Role
  }
  _count: {
    likes: number
    comments: number
  }
  isLiked?: boolean
}

export interface LeaderboardEntryWithUser {
  id: string
  month: string
  year: number
  system: string
  propFirm: string | null
  payout: string
  rank?: number
  user: {
    id: string
    fullName: string | null
    email: string
    role: Role
  }
}

export interface TickerItemData {
  id: string
  text: string
  amount: string | null
}

export interface EAWithUserStatus {
  id: string
  name: string
  description: string | null
  version: string
  requiredRole: Role
  status: EAStatus
  userEA?: {
    accountNumber: string | null
    broker: string | null
    status: EAStatus
  } | null
}

export interface DownloadFile {
  id: string
  name: string
  description: string | null
  fileType: FileType
  fileUrl: string
  version: string
  isLatest: boolean
  requiredRole: Role
  ea?: { name: string } | null
}

export interface VideoItem {
  id: string
  title: string
  description: string | null
  duration: string | null
  embedUrl: string
  category: string
  isFeatured: boolean
  thumbnail: string | null
  requiredRole: Role
}

export interface SupportTicketWithMeta {
  id: string
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  createdAt: Date
  updatedAt: Date
  _count?: { replies: number }
}

export interface ReferralStats {
  totalSent: number
  signedUp: number
  converted: number
  commissionRate: number
}

export interface AdminInstructorDto {
  id: number
  userId: number
  name: string
  email: string
  isActive: boolean
  studentCount: number
  ratioBadge: 'ok' | 'warning' | 'alert'
}

export interface ComplianceRow {
  instructorId: number
  name: string
  pending: number
  draft: number
  sent: number
  recentCheckinSubmitted: boolean
}

export interface AdminNotificationDto {
  id: number
  fromUserName: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface VolunteerHourDto {
  id: number
  volunteerName: string
  category: string
  hours: number
  description: string | null
  recordedAt: string
  source: 'manual' | 'pike13'
}

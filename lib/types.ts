export interface Home {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export interface HomeMember {
  id: string
  home_id: string
  user_id: string
  joined_at: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_emoji: string
  updated_at: string
}

export interface Task {
  id: string
  home_id: string
  title: string
  description: string | null
  created_by: string
  created_at: string
  is_preset: boolean
  points: number
  category: string
  interval_days: number | null
  last_completed_at: string | null
  last_completed_by: string | null
}

export interface Completion {
  id: string
  task_id: string
  home_id: string
  completed_by: string
  completed_at: string
  helper_id: string | null
  points: number
}

export interface ActivityLog {
  id: string
  home_id: string
  user_id: string
  action: string
  task_id: string | null
  task_title: string | null
  created_at: string
}

export interface ShoppingItem {
  id: string
  home_id: string
  name: string
  quantity: string | null
  added_by: string
  is_purchased: boolean
  created_at: string
}

export type Profiles = Record<string, Profile>

export interface NotificationPrefs {
  user_id: string
  task_needed: boolean
  task_done: boolean
  helper_mention: boolean
  rank_change: boolean
  shopping: boolean
  morning_brief: boolean
  evening_reminder: boolean
  weekly_summary: boolean
  streak_warning: boolean
  quiet_start: string
  quiet_end: string
}

export type PrefKey = Exclude<keyof NotificationPrefs, 'user_id' | 'quiet_start' | 'quiet_end'>

export const DEFAULT_PREFS: Omit<NotificationPrefs, 'user_id'> = {
  task_needed: true,
  task_done: true,
  helper_mention: true,
  rank_change: true,
  shopping: true,
  morning_brief: true,
  evening_reminder: true,
  weekly_summary: true,
  streak_warning: true,
  quiet_start: '22:00',
  quiet_end: '07:00',
}

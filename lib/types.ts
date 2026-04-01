export type RepeatType = 'none' | 'daily' | 'weekly' | 'biweekly'

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
  email?: string
}

export type PresetStatus = 'idle' | 'needs_doing'

export interface Task {
  id: string
  home_id: string
  title: string
  description: string | null
  assigned_to: string | null
  created_by: string
  due_date: string | null
  is_completed: boolean
  repeat_type: RepeatType
  completed_at: string | null
  created_at: string
  is_preset: boolean
  preset_status: PresetStatus
  assigned_email?: string
  created_email?: string
  assigned_emoji?: string
  created_emoji?: string
}

export interface PresetCompletion {
  id: string
  task_id: string
  home_id: string
  completed_by: string
  completed_at: string
  completed_email?: string
  completed_emoji?: string
}

export interface ActivityLog {
  id: string
  home_id: string
  user_id: string
  action: string
  task_id: string | null
  task_title: string | null
  created_at: string
  user_email?: string
  user_emoji?: string
}

export interface ShoppingItem {
  id: string
  home_id: string
  name: string
  quantity: string | null
  added_by: string
  is_purchased: boolean
  created_at: string
  added_email?: string
}

export interface UserPoints {
  id: string
  home_id: string
  user_id: string
  points: number
  updated_at: string
  email?: string
}

export interface Profile {
  id: string
  display_name: string | null
  avatar_emoji: string
  updated_at: string
}

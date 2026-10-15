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

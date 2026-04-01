'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/actions/profile'
import { Leaderboard } from '@/components/leaderboard/Leaderboard'
import { PushPrompt } from '@/components/push/PushPrompt'
import { Avatar } from '@/components/ui/Avatar'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { Copy, Check, LogOut, Pencil } from 'lucide-react'
import type { Home, UserPoints, Profile } from '@/lib/types'

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [home, setHome] = useState<Home | null>(null)
  const [points, setPoints] = useState<UserPoints[]>([])
  const [copied, setCopied] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Record<string, Profile>>({})
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserEmail(user.email ?? '')

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single()
      if (profileData) {
        setProfile(profileData)
        setDisplayName(profileData.display_name ?? '')
      }

      const { data: membership } = await supabase
        .from('home_members')
        .select('home_id')
        .eq('user_id', user.id)
        .single()
      if (!membership) return

      const { data: homeData } = await supabase
        .from('homes')
        .select()
        .eq('id', membership.home_id)
        .single()
      setHome(homeData)

      // Get all member IDs for profile lookup
      const { data: members } = await supabase
        .from('home_members')
        .select('user_id')
        .eq('home_id', membership.home_id)

      const memberIds = (members ?? []).map((m) => m.user_id)

      // Load all profiles
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select()
        .in('id', memberIds)

      const profileMap: Record<string, Profile> = {}
      for (const p of allProfiles ?? []) {
        profileMap[p.id] = p
      }
      setProfiles(profileMap)

      const { data: pointsData } = await supabase
        .from('user_points')
        .select()
        .eq('home_id', membership.home_id)
      setPoints((pointsData ?? []).map((p) => ({
        ...p,
        email: profileMap[p.user_id]?.display_name ?? (p.user_id === user.id ? user.email : undefined),
      })))
    }
    load()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function copyInviteCode() {
    if (!home?.invite_code) return
    await navigator.clipboard.writeText(home.invite_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleEmojiSelect(emoji: string) {
    await updateProfile(emoji)
    setProfile((p) => p ? { ...p, avatar_emoji: emoji } : p)
  }

  async function handleNameSave() {
    if (!displayName.trim()) return
    await updateProfile(profile?.avatar_emoji ?? '😀', displayName.trim())
    setProfile((p) => p ? { ...p, display_name: displayName.trim() } : p)
    setEditingName(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-neutral-50">Settings</h1>
      </div>

      {/* Profile card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-4">
          {/* Avatar with edit overlay */}
          <button
            onClick={() => setShowEmojiPicker(true)}
            className="relative group"
          >
            <Avatar
              emoji={profile?.avatar_emoji}
              email={userEmail}
              displayName={profile?.display_name}
              size="lg"
            />
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Pencil className="w-4 h-4 text-white" />
            </div>
          </button>

          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  onClick={handleNameSave}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-neutral-100 truncate">
                  {profile?.display_name || userEmail?.split('@')[0]}
                </p>
                <button
                  onClick={() => setEditingName(true)}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
            <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {home && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
          <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-1">Your Home</p>
          <p className="text-lg font-semibold text-neutral-100 mb-4">{home.name}</p>

          <div className="space-y-2">
            <p className="text-xs text-neutral-500 font-medium">Invite Code</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-neutral-800 rounded-xl text-sm font-mono text-orange-300 border border-neutral-700">
                {home.invite_code}
              </code>
              <button
                onClick={copyInviteCode}
                className="p-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-neutral-600">Share this code with household members to let them join.</p>
          </div>
        </div>
      )}

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
        <p className="text-sm font-semibold text-neutral-200 mb-4 flex items-center gap-2">
          🏆 Leaderboard
        </p>
        <Leaderboard entries={points} profiles={profiles} />
      </div>

      <div className="mb-4">
        <PushPrompt />
      </div>

      <button
        onClick={handleSignOut}
        className="w-full py-3 flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 font-medium rounded-2xl text-sm transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>

      <EmojiPicker
        open={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
        current={profile?.avatar_emoji ?? '😀'}
      />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/actions/profile'
import { Leaderboard } from '@/components/leaderboard/Leaderboard'
import { PushPrompt } from '@/components/push/PushPrompt'
import { Avatar } from '@/components/ui/Avatar'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { Copy, Check, LogOut, Pencil, Trophy, House, Bell } from 'lucide-react'
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

      const { data: members } = await supabase
        .from('home_members')
        .select('user_id')
        .eq('home_id', membership.home_id)

      const memberIds = (members ?? []).map((m) => m.user_id)

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
      {/* Header */}
      <div className="relative mb-6 pt-2">
        <div className="absolute -top-4 -right-4 w-40 h-40 rounded-full bg-purple-500/6 blur-3xl pointer-events-none" />
        <h1 className="text-3xl font-bold text-white tracking-tight">Indstillinger</h1>
      </div>

      {/* Profile card */}
      <div className="relative rounded-3xl overflow-hidden mb-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/50 via-[#16161e] to-[#16161e]" />
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-orange-500/10 to-transparent" />

        <div className="relative p-5 border border-white/[0.06]  rounded-3xl">
          <div className="flex items-center gap-4">
            {/* Avatar with edit overlay */}
            <button
              onClick={() => setShowEmojiPicker(true)}
              className="relative group flex-shrink-0"
            >
              <Avatar
                emoji={profile?.avatar_emoji}
                email={userEmail}
                displayName={profile?.display_name}
                size="lg"
              />
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 group-active:opacity-100 flex items-center justify-center transition-opacity">
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
                    className="flex-1 px-3 py-2 bg-white/[0.06] border border-white/[0.1] rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                  <button
                    onClick={handleNameSave}
                    className="px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    Gem
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-white truncate">
                    {profile?.display_name || userEmail?.split('@')[0]}
                  </p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.08] text-zinc-600 hover:text-zinc-300 transition-colors flex-shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
              <p className="text-xs text-zinc-500 truncate mt-0.5">{userEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Home card */}
      {home && (
        <div className="bg-[#16161e] border border-white/[0.05] rounded-3xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <House className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Jeres hjem</p>
              <p className="text-base font-bold text-white">{home.name}</p>
            </div>
          </div>

          <p className="text-xs font-semibold text-zinc-500 mb-2">Invitationskode</p>
          <button
            onClick={copyInviteCode}
            className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] rounded-2xl transition-all active:scale-[0.99]"
          >
            <code className="text-sm font-mono font-bold text-orange-300 tracking-wider">
              {home.invite_code}
            </code>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">Kopieret!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Kopiér
                </>
              )}
            </div>
          </button>
          <p className="text-xs text-zinc-700 mt-2">Del denne kode med husstandsmedlemmer, så de kan tilslutte sig.</p>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-[#16161e] border border-white/[0.05] rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl bg-yellow-500/15 flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <p className="text-base font-bold text-white">Rangliste</p>
        </div>
        <Leaderboard entries={points} profiles={profiles} />
      </div>

      {/* Push notifications */}
      <div className="bg-[#16161e] border border-white/[0.05] rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-xl bg-green-500/15 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5 text-green-400" />
          </div>
          <p className="text-base font-bold text-white">Notifikationer</p>
        </div>
        <PushPrompt />
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="w-full py-3.5 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-400 font-semibold rounded-3xl text-sm transition-all active:scale-[0.98]"
      >
        <LogOut className="w-4 h-4" />
        Log ud
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

'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { useToast } from '@/components/ui/Toast'
import { updateProfile } from '@/lib/actions/profile'
import { displayName } from '@/lib/utils'
import type { Profile } from '@/lib/types'

export function ProfileCard({ profile, email }: { profile: Profile | null; email: string }) {
  const toast = useToast()
  const [emoji, setEmoji] = useState(profile?.avatar_emoji ?? '😀')
  const [name, setName] = useState(profile?.display_name ?? '')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const [pickerOpen, setPickerOpen] = useState(false)

  async function saveName() {
    const trimmed = draft.trim()
    setEditing(false)
    if (!trimmed || trimmed === name) return
    const prev = name
    setName(trimmed)
    try {
      await updateProfile(emoji, trimmed)
    } catch {
      setName(prev)
      toast.show('Kunne ikke gemme navnet')
    }
  }

  async function saveEmoji(next: string) {
    const prev = emoji
    setEmoji(next)
    try {
      await updateProfile(next, name || undefined)
    } catch {
      setEmoji(prev)
      toast.show('Kunne ikke gemme avataren')
    }
  }

  return (
    <section className="bg-card rounded-card shadow-card p-4 flex items-center gap-4">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        aria-label="Skift avatar"
        className="relative rounded-full active:scale-95 transition-transform"
      >
        <Avatar id={profile?.id ?? email} emoji={emoji} name={displayName({ display_name: name }, email)} size="lg" />
        <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-ink text-ground dark:bg-accent dark:text-ink flex items-center justify-center ring-2 ring-card">
          <Pencil className="w-3 h-3" />
        </span>
      </button>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); saveName() }} className="flex items-center gap-2">
            <label htmlFor="navn" className="sr-only">Navn</label>
            <input
              id="navn"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={saveName}
              autoFocus
              maxLength={40}
              className="flex-1 min-w-0 h-10 px-3 bg-soft border-2 border-accent rounded-xl text-[15px] font-extrabold text-ink focus:outline-none"
            />
            <button type="submit" className="h-10 px-3 rounded-xl bg-accent text-ink text-xs font-extrabold">Gem</button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(name); setEditing(true) }}
            className="flex items-center gap-2 text-left min-h-[40px]"
          >
            <span className="font-display text-xl font-semibold truncate">{displayName({ display_name: name }, email)}</span>
            <Pencil className="w-3.5 h-3.5 text-faint flex-shrink-0" />
          </button>
        )}
        <span className="text-xs font-semibold text-muted truncate">{email}</span>
      </div>

      <EmojiPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={saveEmoji} current={emoji} />
    </section>
  )
}

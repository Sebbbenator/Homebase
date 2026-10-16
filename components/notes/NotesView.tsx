'use client'

import { useState } from 'react'
import { Pin, Plus, Trash2 } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { createNote, deleteNote, updateNote } from '@/lib/actions/notes'
import { cn, displayName, formatDate } from '@/lib/utils'
import type { Note, Profiles } from '@/lib/types'

interface NotesViewProps {
  notes: Note[]
  profiles: Profiles
}

const inputClass =
  'w-full h-12 px-4 bg-soft border-2 border-transparent rounded-2xl text-ink placeholder-faint text-[15px] font-semibold focus:outline-none focus:border-accent focus:bg-card transition'

export function NotesView({ notes: initial, profiles }: NotesViewProps) {
  const toast = useToast()
  const [notes, setNotes] = useState(initial)
  const [editing, setEditing] = useState<Note | null | 'new'>(null)

  const sorted = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updated_at.localeCompare(a.updated_at))

  async function togglePin(note: Note) {
    setNotes((prev) => prev.map((n) => (n.id === note.id ? { ...n, pinned: !n.pinned } : n)))
    try {
      await updateNote(note.id, { pinned: !note.pinned })
    } catch {
      setNotes((prev) => prev.map((n) => (n.id === note.id ? note : n)))
      toast.show('Kunne ikke gemme')
    }
  }

  async function remove(note: Note) {
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    setEditing(null)
    try {
      await deleteNote(note.id)
    } catch {
      setNotes((prev) => [note, ...prev])
      toast.show('Kunne ikke slette')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-12">
          <span className="w-16 h-16 rounded-3xl bg-accent-soft flex items-center justify-center">
            <Pin className="w-8 h-8 text-accent-ink" />
          </span>
          <p className="font-display text-xl font-semibold">Tavlen er tom</p>
          <p className="text-sm font-semibold text-muted max-w-xs">Wifi-kode, viceværtens nummer, husregler, hvor sikringerne sidder – alt det, man ellers spørger om i gruppechatten.</p>
          <button onClick={() => setEditing('new')} className="mt-2 h-12 px-6 rounded-2xl bg-accent text-ink font-extrabold shadow-float">Skriv første opslag</button>
        </div>
      ) : (
        sorted.map((n) => {
          const p = profiles[n.created_by]
          return (
            <article key={n.id} className={cn('bg-card rounded-card shadow-card p-4 flex flex-col gap-2', n.pinned && 'ring-2 ring-warn/50')}>
              <div className="flex items-start gap-2">
                <button type="button" onClick={() => setEditing(n)} className="flex-1 min-w-0 text-left">
                  <h2 className="font-display text-lg font-semibold leading-tight">{n.title}</h2>
                </button>
                <button type="button" onClick={() => togglePin(n)} aria-pressed={n.pinned} aria-label={n.pinned ? 'Frigør' : 'Fastgør'}
                  className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', n.pinned ? 'bg-warn-soft text-warn-ink' : 'text-faint hover:bg-soft')}>
                  <Pin className={cn('w-4 h-4', n.pinned && 'fill-current')} />
                </button>
              </div>
              {n.body && (
                <button type="button" onClick={() => setEditing(n)} className="text-left">
                  <p className="text-sm font-semibold text-body whitespace-pre-wrap break-words">{n.body}</p>
                </button>
              )}
              <div className="flex items-center gap-2 text-[11px] font-bold text-faint">
                <Avatar id={n.created_by} emoji={p?.avatar_emoji} name={displayName(p)} size="xs" />
                {displayName(p)} · {formatDate(n.updated_at)}
              </div>
            </article>
          )
        })
      )}

      <button
        type="button"
        onClick={() => setEditing('new')}
        aria-label="Nyt opslag"
        className="fixed z-30 right-5 bottom-[96px] w-14 h-14 rounded-full bg-accent text-ink flex items-center justify-center shadow-float active:scale-95 transition-transform sm:right-[calc(50%-16rem)]"
      >
        <Plus className="w-7 h-7" strokeWidth={3} />
      </button>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nyt opslag' : 'Rediger opslag'}>
        {editing && (
          <NoteForm
            key={editing === 'new' ? 'new' : editing.id}
            note={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={(saved) => setNotes((prev) => (prev.some((n) => n.id === saved.id) ? prev.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...prev]))}
            onDelete={remove}
          />
        )}
      </Sheet>
    </div>
  )
}

function NoteForm({ note, onClose, onSaved, onDelete }: { note: Note | null; onClose: () => void; onSaved: (n: Note) => void; onDelete: (n: Note) => void }) {
  const [title, setTitle] = useState(note?.title ?? '')
  const [body, setBody] = useState(note?.body ?? '')
  const [pinned, setPinned] = useState(note?.pinned ?? false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    try {
      const saved = note ? await updateNote(note.id, { title, body, pinned }) : await createNote({ title, body, pinned })
      onSaved(saved)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Noget gik galt')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="note-title" className="block text-[13px] font-extrabold text-muted mb-2">Overskrift</label>
        <input id="note-title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus maxLength={80} placeholder="fx Wifi" className={inputClass} />
      </div>
      <div>
        <label htmlFor="note-body" className="block text-[13px] font-extrabold text-muted mb-2">Tekst</label>
        <textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder="fx Netværk: Galthen · Kode: …" className={cn(inputClass, 'h-auto py-3 resize-none')} />
      </div>
      <button type="button" role="switch" aria-checked={pinned} onClick={() => setPinned((v) => !v)} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-soft text-left">
        <Pin className="w-4 h-4 text-warn-ink" />
        <span className="flex-1 text-sm font-extrabold">Fastgør øverst</span>
        <span className={cn('w-[50px] h-[30px] rounded-full p-[3px] flex items-center transition-colors', pinned ? 'bg-good justify-end' : 'bg-line justify-start')}>
          <span className="w-6 h-6 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)]" />
        </span>
      </button>
      {error && <p className="text-danger-ink text-sm font-bold bg-danger-soft rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-3">
        {note && (
          confirmDelete ? (
            <button type="button" onClick={() => onDelete(note)} className="h-12 px-4 rounded-2xl bg-danger text-white font-extrabold text-[15px]">Slet nu</button>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} aria-label="Slet opslag" className="h-12 w-12 rounded-2xl bg-danger-soft text-danger-ink flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </button>
          )
        )}
        <button type="button" onClick={onClose} className="flex-1 h-12 rounded-2xl bg-soft text-body font-extrabold text-[15px]">Annullér</button>
        <button type="submit" disabled={loading || !title.trim()} className="flex-1 h-12 rounded-2xl bg-accent text-ink font-extrabold text-[15px] shadow-float disabled:opacity-50">
          {loading ? 'Gemmer…' : 'Gem'}
        </button>
      </div>
    </form>
  )
}

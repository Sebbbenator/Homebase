export type Tone = 'accent' | 'warn' | 'info' | 'good' | 'muted'

export const CATEGORIES = [
  { id: 'common', label: 'Fællesområder', tone: 'accent' },
  { id: 'kitchen', label: 'Køkken', tone: 'warn' },
  { id: 'bathroom', label: 'Badeværelse', tone: 'info' },
  { id: 'living', label: 'Stue', tone: 'good' },
  { id: 'bedroom', label: 'Soveværelse', tone: 'info' },
  { id: 'laundry', label: 'Tøjvask', tone: 'accent' },
  { id: 'outdoor', label: 'Udendørs', tone: 'good' },
  { id: 'other', label: 'Andet', tone: 'muted' },
] as const satisfies readonly { id: string; label: string; tone: Tone }[]

export type CategoryId = typeof CATEGORIES[number]['id']

export function getCategory(id: string | null | undefined) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

/** Chip-klasser pr. tone (soft baggrund + mørk tekst) */
export const TONE_CHIP: Record<Tone, string> = {
  accent: 'bg-accent-soft text-accent-ink',
  warn: 'bg-warn-soft text-warn-ink',
  info: 'bg-info-soft text-info-ink',
  good: 'bg-good-soft text-good-ink',
  muted: 'bg-soft text-muted',
}

import type { WasteEvent } from '@/lib/types'

/** Simpel ICS-parser: VEVENT med DTSTART (dato eller tidspunkt) + SUMMARY. RRULE ignoreres. */
export function parseIcs(text: string): WasteEvent[] {
  // Fold linjer sammen (fortsættelseslinjer starter med mellemrum/tab)
  const lines = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n')
  const events: WasteEvent[] = []
  let cur: Partial<WasteEvent> | null = null
  for (const raw of lines) {
    const line = raw.trim()
    if (line === 'BEGIN:VEVENT') { cur = {}; continue }
    if (line === 'END:VEVENT') {
      if (cur?.date && cur.summary) events.push({ date: cur.date, summary: cur.summary })
      cur = null
      continue
    }
    if (!cur) continue
    const idx = line.indexOf(':')
    if (idx < 0) continue
    const key = line.slice(0, idx).split(';')[0].toUpperCase()
    const value = line.slice(idx + 1)
    if (key === 'DTSTART') {
      const m = value.match(/^(\d{4})(\d{2})(\d{2})/)
      if (m) cur.date = `${m[1]}-${m[2]}-${m[3]}`
    } else if (key === 'SUMMARY') {
      cur.summary = value.replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\n/g, ' ').trim()
    }
  }
  return events.sort((a, b) => a.date.localeCompare(b.date))
}

export async function fetchWasteEvents(url: string, revalidateSeconds = 6 * 3600): Promise<WasteEvent[]> {
  const res = await fetch(url, { next: { revalidate: revalidateSeconds }, headers: { Accept: 'text/calendar, */*' } })
  if (!res.ok) throw new Error(`Kunne ikke hente kalenderen (${res.status})`)
  const text = await res.text()
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error('Det ser ikke ud til at være en kalender (ICS)')
  return parseIcs(text)
}

/** De næste afhentninger fra og med i dag (grupperet pr. dag) */
export function nextWaste(events: WasteEvent[], today: string, limit = 4): { date: string; summaries: string[] }[] {
  const out: { date: string; summaries: string[] }[] = []
  for (const e of events) {
    if (e.date < today) continue
    const last = out[out.length - 1]
    if (last && last.date === e.date) {
      if (!last.summaries.includes(e.summary)) last.summaries.push(e.summary)
    } else {
      if (out.length >= limit) break
      out.push({ date: e.date, summaries: [e.summary] })
    }
  }
  return out
}

export function relativeDay(date: string, today: string): string {
  const diff = Math.round((new Date(date).getTime() - new Date(today).getTime()) / 86_400_000)
  if (diff === 0) return 'i dag'
  if (diff === 1) return 'i morgen'
  if (diff < 7) return new Date(date).toLocaleDateString('da-DK', { weekday: 'long' })
  return new Date(date).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })
}

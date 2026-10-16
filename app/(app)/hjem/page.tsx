import { loadHomeData } from '@/lib/data/home'
import { HjemView } from '@/components/home/HjemView'
import { fetchWasteEvents, nextWaste } from '@/lib/waste'
import { dateKey } from '@/lib/rotation'

export default async function HjemPage() {
  const data = await loadHomeData()

  let waste: { date: string; summaries: string[] }[] = []
  if (data.home?.waste_ics_url) {
    try {
      const events = await fetchWasteEvents(data.home.waste_ics_url.replace(/^webcal:\/\//i, 'https://'))
      waste = nextWaste(events, dateKey(new Date()), 2)
    } catch {
      waste = []
    }
  }

  return <HjemView data={data} waste={waste} />
}

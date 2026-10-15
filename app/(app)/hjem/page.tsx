import { loadHomeData } from '@/lib/data/home'
import { HjemView } from '@/components/home/HjemView'

export default async function HjemPage() {
  const data = await loadHomeData()
  return <HjemView data={data} />
}

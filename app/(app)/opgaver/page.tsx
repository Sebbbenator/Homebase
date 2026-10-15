import { loadHomeData } from '@/lib/data/home'
import { OpgaverView } from '@/components/tasks/OpgaverView'

export default async function OpgaverPage() {
  const data = await loadHomeData()
  return <OpgaverView data={data} />
}

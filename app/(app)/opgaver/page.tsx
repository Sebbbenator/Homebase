import { loadHomeData } from '@/lib/data/home'
import { OpgaverView } from '@/components/tasks/OpgaverView'

export default async function OpgaverPage({ searchParams }: { searchParams: Promise<{ task?: string; filter?: string }> }) {
  const [data, params] = await Promise.all([loadHomeData(), searchParams])
  return <OpgaverView data={data} initialOpenId={params.task} initialFilter={params.filter} />
}

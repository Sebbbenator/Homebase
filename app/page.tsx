import { redirect } from 'next/navigation'
import { getSession } from '@/lib/data/session'

export default async function RootPage() {
  const { user } = await getSession()
  redirect(user ? '/hjem' : '/login')
}

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('worklient_session')

  if (sessionCookie) {
    redirect('/dashboard')
  }

}

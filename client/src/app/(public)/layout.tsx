import { headers } from 'next/headers'

import { Navbar } from '@/components/layout/navbar'
export const dynamic = 'force-static'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const hasSession = headers().get('x-session-present') === '1'
  return (
    <>
      <Navbar hasSession={hasSession} />
      {children}
    </>
  )
}

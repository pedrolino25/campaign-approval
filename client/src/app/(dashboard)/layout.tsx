import { redirect } from "next/navigation"

import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { AuthProvider } from "@/lib/auth/auth-context"
import { getServerSession } from "@/lib/auth/get-server-session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()

  if (!session) {
    redirect("/")
  }

  if (!session.onboardingCompleted) {
    if (session.actorType === "INTERNAL") {
      redirect("/complete-signup/internal")
    }
    if (session.actorType === "REVIEWER") {
      redirect("/complete-signup/reviewer")
    }
  }

  return (
    <AuthProvider session={session}>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="md:pl-64">
          <Header />
          <main className="max-w-6xl mx-auto py-6 px-4">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  )
}

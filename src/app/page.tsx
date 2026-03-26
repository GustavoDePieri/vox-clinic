import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { LandingPage } from "@/components/landing/landing-page"

export default async function Home() {
  const { userId } = await auth()

  let isAuthenticated = false
  let dashboardUrl = "/dashboard"

  if (userId) {
    isAuthenticated = true
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    })
    if (!user?.onboardingComplete) {
      dashboardUrl = "/onboarding"
    }
  }

  return <LandingPage isAuthenticated={isAuthenticated} dashboardUrl={dashboardUrl} />
}

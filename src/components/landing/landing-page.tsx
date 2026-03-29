"use client"

import { NavBar } from "./nav-bar"
import { HeroSection } from "./hero-section"
import { SocialProofBar } from "./social-proof-bar"
import { HowItWorksSection } from "./how-it-works-section"
import { FeaturesBentoSection } from "./features-bento-section"
import { SecuritySection } from "./security-section"
import { TestimonialsSection } from "./testimonials-section"
import { PricingSection } from "./pricing-section"
import { FAQSection } from "./faq-section"
import { FinalCTASection } from "./final-cta-section"

interface LandingPageProps {
  isAuthenticated?: boolean
  dashboardUrl?: string
}

export function LandingPage({ isAuthenticated = false, dashboardUrl = "/dashboard" }: LandingPageProps) {
  return (
    <div className="relative min-h-screen scroll-smooth bg-[#09090b] text-white antialiased">
      <NavBar isAuthenticated={isAuthenticated} dashboardUrl={dashboardUrl} />
      <main>
        <HeroSection isAuthenticated={isAuthenticated} dashboardUrl={dashboardUrl} />
        <SocialProofBar />
        <HowItWorksSection />
        <FeaturesBentoSection />
        <SecuritySection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
    </div>
  )
}

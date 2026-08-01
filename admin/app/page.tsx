'use client'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import SmoothScrollProvider from '@/components/landing/SmoothScrollProvider'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import FeatureShowcase from '@/components/landing/FeatureShowcase'
import HowItWorks from '@/components/landing/HowItWorks'
import SocialProof from '@/components/landing/SocialProof'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function Home() {
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme('light')
  }, [setTheme])

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <FeatureShowcase />
          <HowItWorks />
          <SocialProof />
          <Pricing />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </SmoothScrollProvider>
  )
}

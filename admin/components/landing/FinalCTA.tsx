'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

export default function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        section.querySelectorAll('.cta-reveal'),
        {
          opacity: 0,
          y: 40,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            once: true,
          },
        },
      )
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="bg-[#F8FAF9]"
    >
      <div className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">
        <h2 className="cta-reveal text-3xl md:text-5xl font-bold text-foreground">
          Ready to put your fleet operations on autopilot?
        </h2>
        <p className="cta-reveal text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
          Join hundreds of fleet operators already using FleetOps to reduce costs,
          increase utilization, and delight customers.
        </p>
        <div className="cta-reveal flex justify-center gap-4 mt-10">
          <Button
            size="lg"
            className="bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-base font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border border-border text-foreground px-8 py-3.5 rounded-full text-base font-semibold hover:bg-muted transition-all"
          >
            Request Demo
          </Button>
        </div>
      </div>
    </section>
  )
}

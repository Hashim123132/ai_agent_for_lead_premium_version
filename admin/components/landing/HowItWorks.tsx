'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Database, Zap, BarChart3 } from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const steps = [
  {
    number: 1,
    title: 'Connect Your Fleet Data',
    description:
      'Import your existing fleet, booking system, and customer data in one click.',
    Icon: Database,
  },
  {
    number: 2,
    title: 'AI Agents Go Live',
    description: 'Configure your agents in minutes — no code required.',
    Icon: Zap,
  },
  {
    number: 3,
    title: 'Watch Your Fleet Optimize',
    description:
      'Real-time dashboards show bookings, pricing, and maintenance all in one place.',
    Icon: BarChart3,
  },
]

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null)
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])
  const desktopLineRef = useRef<SVGLineElement>(null)
  const mobileLineRef = useRef<SVGLineElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate steps with stagger
      gsap.from(stepsRef.current.filter(Boolean), {
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        },
      })

      // Animate connecting lines (both desktop and mobile)
      const lines = [desktopLineRef.current, mobileLineRef].filter(Boolean)
      lines.forEach((line) => {
        gsap.to(line, {
          strokeDashoffset: 0,
          duration: 1.2,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        })
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="section-bg-light">
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
          How It Works
        </h2>
        <div className="w-12 h-0.5 bg-emerald-accent mx-auto mt-6 rounded-full" />

        {/* Steps Container - relative for SVG line positioning */}
        <div className="relative mt-16 md:mt-20">
          {/* Desktop horizontal connecting line */}
          <svg
            className="hidden md:block absolute top-6 left-[calc(16.666%+24px)] right-[calc(16.666%+24px)] w-auto h-2 pointer-events-none"
            viewBox="0 0 1000 2"
            preserveAspectRatio="none"
          >
            <line
              ref={desktopLineRef}
              x1="0"
              y1="1"
              x2="1000"
              y2="1"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="2"
              className="connecting-line"
            />
          </svg>

          {/* Mobile vertical connecting line */}
          <svg
            className="md:hidden absolute left-6 top-12 bottom-12 w-2 h-auto pointer-events-none"
            viewBox="0 0 2 1000"
            preserveAspectRatio="none"
          >
            <line
              ref={mobileLineRef}
              x1="1"
              y1="0"
              x2="1"
              y2="1000"
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="2"
              className="connecting-line"
            />
          </svg>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, index) => {
              const { Icon } = step
              return (
                <div
                  key={step.number}
                  ref={(el) => {
                    stepsRef.current[index] = el
                  }}
                  className="flex flex-col items-center text-center gap-4 relative z-10"
                >
                  {/* Icon Circle */}
                  <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-foreground mt-2">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

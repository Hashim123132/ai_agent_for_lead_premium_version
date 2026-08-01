'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const logos = ['FleetCo', 'AutoDrive', 'RentMax', 'CarHub', 'DriveEasy']

type Stat = {
  target: number
  suffix: string
  prefix: string
  label: string
  noCount?: boolean
}

const stats: Stat[] = [
  { target: 40, suffix: '%', prefix: '', label: 'fewer missed bookings' },
  { target: 3.2, suffix: 'x', prefix: '', label: 'faster dispatch times' },
  { target: 24, suffix: '/7', prefix: '', label: 'availability', noCount: true },
]

const animateCounter = (
  element: HTMLElement,
  target: number,
  suffix: string = '',
  prefix: string = ''
) => {
  const obj = { value: 0 }
  gsap.to(obj, {
    value: target,
    duration: 2,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent =
        prefix +
        (target % 1 !== 0 ? obj.value.toFixed(1) : Math.round(obj.value)) +
        suffix
    },
  })
}

export default function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null)
  const logoStripRef = useRef<HTMLDivElement>(null)
  const testimonialRef = useRef<HTMLDivElement>(null)
  const statNumberRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo strip animation
      if (logoStripRef.current) {
        gsap.from(logoStripRef.current.children, {
          opacity: 0,
          y: 20,
          duration: 0.5,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        })
      }

      // Testimonial animation
      if (testimonialRef.current) {
        gsap.from(testimonialRef.current, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 80%',
            once: true,
          },
        })
      }

      // Stats counter animation
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          stats.forEach((stat, index) => {
            const el = statNumberRefs.current[index]
            if (!el) return

            if (stat.noCount) {
              gsap.fromTo(
                el,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.6, delay: index * 0.15 }
              )
              el.textContent = stat.prefix + stat.target + stat.suffix
            } else {
              gsap.fromTo(
                el,
                { opacity: 0, y: 10 },
                {
                  opacity: 1,
                  y: 0,
                  duration: 0.3,
                  delay: index * 0.15,
                  onComplete: () => {
                    animateCounter(el, stat.target, stat.suffix, stat.prefix)
                  },
                }
              )
            }
          })
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef}>
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        {/* Part 1: Logo Strip */}
        <p className="text-sm text-muted-foreground text-center mb-8">
          Trusted by fleet operators managing 10,000+ vehicles
        </p>
        <div
          ref={logoStripRef}
          className="flex justify-center items-center gap-8 md:gap-16 flex-wrap"
        >
          {logos.map((name) => (
            <div
              key={name}
              className="grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
            >
              <span className="font-bold text-lg tracking-tight text-foreground">
                {name}
              </span>
            </div>
          ))}
        </div>

        {/* Part 2: Testimonial */}
        <div className="w-16 h-px bg-border mx-auto my-12" />

        <div ref={testimonialRef} className="text-center">
          <span className="quote-mark block" aria-hidden="true">
            &ldquo;
          </span>
          <p className="text-2xl md:text-3xl font-semibold text-center text-foreground max-w-3xl mx-auto italic -mt-6">
            FleetOps cut our response time from hours to seconds. Our booking rate
            jumped 40% in the first month.
          </p>
          <p className="text-muted-foreground text-center mt-6 text-sm">
            — Operations Manager, FleetCo
          </p>
        </div>

        <div className="w-16 h-px bg-border mx-auto mt-12" />

        {/* Part 3: Stats Counter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
          {stats.map((stat, index) => (
            <div key={stat.label} className="text-center">
              <span
                ref={(el) => {
                  statNumberRefs.current[index] = el
                }}
                className="text-5xl md:text-6xl font-bold text-foreground block"
              >
                {stat.prefix}0{stat.suffix}
              </span>
              <span className="text-muted-foreground text-sm font-medium block mt-2">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

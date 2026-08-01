'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

gsap.registerPlugin(ScrollTrigger)

const plans = [
  {
    name: 'Starter',
    monthlyPrice: 49,
    annualPrice: 39,
    description: 'Perfect for small fleets getting started with AI.',
    features: [
      'Up to 25 vehicles',
      'Booking Agent',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Growth',
    monthlyPrice: 149,
    annualPrice: 119,
    description: 'For growing fleets that need full AI power.',
    features: [
      'Up to 200 vehicles',
      'All 5 AI Agents',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'API access',
    ],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    description: 'Tailored solutions for large-scale operations.',
    features: [
      'Unlimited vehicles',
      'All 5 AI Agents',
      'White-label options',
      'Dedicated support',
      'Custom agent builds',
      'SLA guarantee',
      'On-premise deployment',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
]

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const priceRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!cardsRef.current) return

      const cards = cardsRef.current.querySelectorAll('.pricing-card')
      gsap.set(cards, { opacity: 0, scale: 0.95, y: 20 })

      gsap.to(cards, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        },
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    priceRefs.current.forEach((el) => {
      if (!el) return
      gsap.fromTo(
        el,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      )
    })
  }, [isAnnual])

  return (
    <section
      ref={sectionRef}
      className="section-bg-light"
    >
      <div className="max-w-6xl mx-auto px-6 py-24 md:py-32">
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
          Simple, Transparent Pricing
        </h2>
        <p className="text-muted-foreground text-center mt-4">
          Start free, scale as you grow. No hidden fees.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mt-8">
          <div className="inline-flex items-center rounded-full bg-muted/60 p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                !isAnnual
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                isAnnual
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annual
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 border-0 text-[10px] px-1.5 py-0 h-5 font-semibold"
              >
                Save 20%
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto mt-12"
        >
          {plans.map((plan, index) => {
            const price = plan.monthlyPrice
              ? isAnnual
                ? plan.annualPrice!
                : plan.monthlyPrice
              : null

            return (
              <div
                key={plan.name}
                className={`pricing-card relative rounded-2xl border bg-card p-8 flex flex-col transition-transform duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? 'pricing-card-highlighted border-emerald-500/50 md:scale-[1.02] shadow-lg shadow-emerald-500/10'
                    : 'border-border'
                }`}
              >
                {/* Most Popular Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white border-0 shadow-sm px-3 py-1 text-xs font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan Name */}
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mt-6 mb-6">
                  {price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-foreground text-lg font-medium">
                        $
                      </span>
                      <span
                        ref={(el) => {
                          priceRefs.current[index] = el
                        }}
                        className="text-4xl font-bold text-foreground transition-opacity duration-300"
                      >
                        {price}
                      </span>
                      <span className="text-muted-foreground text-base font-normal">
                        /mo
                      </span>
                    </div>
                  ) : (
                    <span
                      ref={(el) => {
                        priceRefs.current[index] = el
                      }}
                      className="text-4xl font-bold text-foreground"
                    >
                      Custom
                    </span>
                  )}
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full ${
                    plan.highlighted
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : ''
                  } ${
                    !plan.highlighted && plan.monthlyPrice !== null
                      ? ''
                      : ''
                  } ${
                    plan.monthlyPrice === null ? 'bg-card border border-border text-foreground hover:bg-accent' : ''
                  }`}
                  variant={plan.monthlyPrice === null ? 'outline' : 'default'}
                >
                  {plan.cta}
                </Button>

                {/* Divider */}
                <div className="border-t border-border/60 my-6" />

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

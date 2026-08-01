'use client'

import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

gsap.registerPlugin(ScrollTrigger)

const faqs = [
  {
    question: 'How long does setup take?',
    answer:
      'Most fleets are up and running within 24 hours. Our onboarding team handles data migration and agent configuration so you don\'t have to write a single line of code.',
  },
  {
    question: 'Does this work with my existing booking system?',
    answer:
      'Yes. FleetOps integrates with all major booking platforms (AutoRent, TSD, Rentall) via API. If you use a custom system, our team will build a connector — typically within a week.',
  },
  {
    question: 'Is my fleet data secure?',
    answer:
      'Absolutely. FleetOps is SOC 2 Type II certified, uses AES-256 encryption at rest and TLS 1.3 in transit. Your data never leaves your region without explicit consent.',
  },
  {
    question: 'What if I need a custom agent?',
    answer:
      'Our platform supports custom agent creation. On the Growth plan you can configure agent behaviors through a no-code builder. Enterprise clients get fully custom agent development.',
  },
  {
    question: 'Can I try before I buy?',
    answer:
      'Of course! Every plan comes with a 14-day free trial. No credit card required. You\'ll have full access to all features on the Growth tier during the trial.',
  },
]

export default function FAQ() {
  const sectionRef = useRef<HTMLElement>(null)
  const accordionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!accordionRef.current) return

      gsap.fromTo(
        accordionRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      )
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef}>
      <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
        {/* Section Header */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
          Frequently Asked Questions
        </h2>

        {/* Accordion */}
        <div ref={accordionRef} className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-border/50"
              >
                <AccordionTrigger className="text-base font-medium text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}

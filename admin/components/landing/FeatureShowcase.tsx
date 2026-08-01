'use client'

import { useRef, useEffect, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  DollarSign,
  Megaphone,
  Users,
  Brain,
  Volume2,
  VolumeX,
  type LucideIcon,
} from 'lucide-react'
import Image from 'next/image'

gsap.registerPlugin(ScrollTrigger)

function FeatureVideo({ src }: { src: string }) {
  const [muted, setMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted
    }
  }, [muted])

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={muted}
        playsInline
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={() => setMuted(!muted)}
        aria-label={muted ? 'Unmute video' : 'Mute video'}
        className="absolute bottom-2 right-2 z-10 flex size-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
      >
        {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>
    </div>
  )
}

interface Feature {
  id: number
  number: string
  title: string
  description: string
  tags: string[]
  icon: LucideIcon
  image: string
  video?: string
}

const features: Feature[] = [
  {
    id: 1,
    number: '01 / 05',
    title: 'Booking Agent',
    description:
      'Never miss another customer inquiry. Automate conversations and bookings across chat, SMS, and web \u2014 handling booking AND support conversations, 24/7.',
    tags: ['SMS', 'WhatsApp', 'Web Chat', 'Email'],
    icon: MessageSquare,
    image: '/images/features/booking-agent.png',
    video: '/car_rental.mp4',
  },
  {
    id: 2,
    number: '02 / 05',
    title: 'Marketing Agent',
    description:
      'Researches competitors, analyzes market trends, generates location-aware campaigns, and evaluates campaign performance.',
    tags: ['Campaigns', 'Competitor Research', 'Analytics'],
    icon: Megaphone,
    image: '/images/features/marketing-agent.png',
  },
  {
    id: 3,
    number: '03 / 05',
    title: 'Pricing Agent',
    description:
      'Analyzes demand, occupancy, booking trends, and competitor pricing to recommend optimal rental prices.',
    tags: ['Demand-Based', 'Competitor Pricing', 'Revenue'],
    icon: DollarSign,
    image: '/images/features/dynamic-pricing.png',
  },
  {
    id: 4,
    number: '04 / 05',
    title: 'Lead Generation Agent',
    description:
      'Finds qualified business leads, ranks opportunities, and prepares personalized outreach to grow your customer pipeline.',
    tags: ['Lead Search', 'Lead Scoring', 'Outreach'],
    icon: Users,
    image: '/images/features/lead-generation.png',
  },
  {
    id: 5,
    number: '05 / 05',
    title: 'Supervisor Agent',
    description:
      'Coordinates all AI agents, routes tasks intelligently, and ensures every request is handled by the right specialist.',
    tags: ['Orchestration', 'Automation', 'Multi-Agent'],
    icon: Brain,
    image: '/images/features/supervisor-agent.png',
  },
]

export default function FeatureShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const featureRefs = useRef<(HTMLDivElement | null)[]>([])
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs = useRef<(HTMLDivElement | null)[]>([])
  const [activeFeature, setActiveFeature] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  useEffect(() => {
    if (!sectionRef.current) return

    const ctx = gsap.context(() => {
      if (isMobile) {
        // Mobile: simple reveal-on-enter for each feature card
        featureRefs.current.forEach((ref, i) => {
          if (!ref) return
          gsap.fromTo(
            ref,
            { opacity: 0, y: 20 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              delay: i * 0.15,
              scrollTrigger: {
                trigger: ref,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          )
        })
      } else {
        // Desktop: pinned scroll-scrub animation
        // First, hide all features except the first
        featureRefs.current.forEach((ref, i) => {
          if (!ref) return
          if (i === 0) {
            gsap.set(ref, { opacity: 1, y: 0 })
          } else {
            gsap.set(ref, { opacity: 0, y: 20 })
          }
        })

        imageRefs.current.forEach((ref, i) => {
          if (!ref) return
          if (i === 0) {
            gsap.set(ref, { opacity: 1, x: 0 })
          } else {
            gsap.set(ref, { opacity: 0, x: 40 })
          }
        })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=5000',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              const progress = self.progress
              const featureIndex = Math.min(
                Math.floor(progress * 5),
                4
              )
              setActiveFeature(featureIndex)
            },
          },
        })

        for (let i = 0; i < features.length; i++) {
          tl.addLabel(`feature-${i}`)

          // Fade in current feature text and image
          if (i > 0) {
            tl.fromTo(
              featureRefs.current[i],
              { opacity: 0, y: 20 },
              { opacity: 1, y: 0 }
            )
            tl.fromTo(
              imageRefs.current[i],
              { opacity: 0, x: 40 },
              { opacity: 1, x: 0 },
              '<'
            )
          }

          // Hold for reading
          tl.to({}, { duration: 0.4 })

          // Fade out (except last feature)
          if (i < features.length - 1) {
            tl.to(featureRefs.current[i], { opacity: 0, y: -20 })
            tl.to(
              imageRefs.current[i],
              { opacity: 0, x: -40 },
              '<'
            )
            tl.addLabel(`feature-${i + 1}`)
          }
        }
      }
    }, sectionRef)

    return () => {
      ctx.revert()
    }
  }, [isMobile])

  return (
    <section
      ref={sectionRef}
      className="relative bg-background"
      aria-label="Your AI Workforce"
    >
      {/* Progress Dots — desktop only, fixed during pinned state */}
      <div className="hidden md:flex fixed left-8 top-1/2 -translate-y-1/2 z-20 flex-col items-center gap-3 feature-showcase-dots">
        {features.map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              dotRefs.current[i] = el
            }}
            className="rounded-full transition-all duration-300"
            style={{
              width: 10,
              height: 10,
              backgroundColor:
                activeFeature === i
                  ? '#059669'
                  : 'rgba(0,0,0,0.15)',
              transform:
                activeFeature === i ? 'scale(1.4)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Section header */}
      <div className="px-6 md:px-16 lg:px-24 pt-8 md:pt-12 pb-4 md:pb-6">
        <p className="text-xs font-medium text-muted-foreground tracking-widest uppercase mb-3">
          Your AI Workforce
        </p>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
          Five agents. One platform.
          <br className="hidden md:block" />
          <span className="text-emerald-600"> Zero manual effort.</span>
        </h2>
        <p className="mt-4 text-lg text-[#525252] max-w-2xl leading-relaxed">
          Each AI agent handles a critical part of your rental operations —
          working together to deliver a seamless, fully automated experience.
        </p>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden px-6 pb-20 flex flex-col gap-10">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.id}
              ref={(el) => {
                featureRefs.current[feature.id - 1] = el
              }}
              className="flex flex-col gap-5"
            >
              {/* Image / Video */}
              <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden bg-gray-50">
                {feature.video ? (
                  <FeatureVideo src={feature.video} />
                ) : (
                  <Image
                    src={feature.image}
                    alt={`${feature.title} demo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw"
                  />
                )}
              </div>
              {/* Text content */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-emerald-600" strokeWidth={2} />
                  <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                    {feature.number}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-base text-[#525252] leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid md:grid-cols-[40%_55%] md:gap-[5%] px-16 lg:px-24 pb-12 items-start">
        {/* Left column — text content (stacked, absolute positioned) */}
        <div className="relative min-h-[300px]">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.id}
                ref={(el) => {
                  featureRefs.current[i] = el
                }}
                className="absolute inset-0 top-0 left-0 right-0"
                style={{
                  opacity: i === 0 ? 1 : 0,
                  pointerEvents: i === activeFeature ? 'auto' : 'none',
                }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50">
                    <Icon
                      className="w-5 h-5 text-emerald-600"
                      strokeWidth={2}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                    {feature.number}
                  </span>
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                  {feature.title}
                </h3>
                <p className="mt-4 text-lg text-[#525252] leading-relaxed max-w-md">
                  {feature.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Right column — images (stacked, absolute positioned) */}
        <div className="relative min-h-[320px] lg:min-h-[360px]">
          {features.map((feature, i) => (
            <div
              key={feature.id}
              ref={(el) => {
                imageRefs.current[i] = el
              }}
              className="absolute inset-0 top-0 left-0 right-0"
              style={{
                opacity: i === 0 ? 1 : 0,
                pointerEvents: i === activeFeature ? 'auto' : 'none',
              }}
            >
              <div className="feature-demo-area relative w-full h-full rounded-2xl overflow-hidden shadow-lg shadow-black/[0.06]">
                {feature.video ? (
                  <FeatureVideo src={feature.video} />
                ) : (
                  <Image
                    src={feature.image}
                    alt={`${feature.title} demo`}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 55vw"
                    priority={i === 0}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

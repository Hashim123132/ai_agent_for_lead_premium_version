'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight,
  MessageSquare,
  MapPin,
  DollarSign,
  Headphones,
  Users
} from 'lucide-react';
gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  Node data — desktop offsets from constellation center (px)          */
/* ------------------------------------------------------------------ */
const NODES = [
  { id: 'missed-bookings', label: 'Missed Bookings', Icon: MapPin, dx: -186, dy: -162 },
  { id: 'poor-marketing', label: 'Poor Marketing ROI', Icon: MessageSquare, dx: 222, dy: -42 },
  { id: 'pricing', label: 'Guesswork Pricing', Icon: DollarSign, dx: 168, dy: 186 },
  { id: 'lead-generation', label: 'Lack of Qualified Leads', Icon: Users, dx: -180, dy: 174 },
  { id: 'support', label: 'Slow Customer Responses', Icon: Headphones, dx: 84, dy: -210 },
] as const;

const MOBILE_SCALE = 0.5;

/* ------------------------------------------------------------------ */
/*  Helper: quadratic bezier path from (dx,dy) → (0,0)                */
/* ------------------------------------------------------------------ */
function buildConnectorPath(dx: number, dy: number): string {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return '';
  const mx = dx * 0.5;
  const my = dy * 0.5;
  const offset = len * 0.15;
  const nx = (-dy / len) * offset;
  const ny = (dx / len) * offset;
  return `M ${dx} ${dy} Q ${mx + nx} ${my + ny} 0 0`;
}

/* SVG viewBox centred at (0,0) */
const VB_X = -300;
const VB_Y = -260;
const VB_W = 600;
const VB_H = 520;

/* ================================================================== */
export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  // SSR default: assume desktop (false = not mobile) to avoid flash of wrong layout
  const [isMobile, setIsMobile] = useState(false);

  /* --------------------------------------------------------------- */
  /*  Responsive detection                                             */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    // mq.matches = true means min-width:768px is met → desktop → NOT mobile
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
    update(mq);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  /* --------------------------------------------------------------- */
  /*  GSAP animations                                                  */
  /* --------------------------------------------------------------- */
  useEffect(() => {
    if (!sectionRef.current || !coreRef.current) return;

    const ctx = gsap.context(() => {
      /* 1. Idle floating for each node — staggered X + Y drift, never synced */
      NODES.forEach((node, i) => {
        const el = nodeRefs.current[node.id];
        if (!el) return;
        // X drift: ±8–14px, unique duration per node
        gsap.to(el, {
          x: `+=${8 + i * 1.5}`,
          duration: 3.2 + i * 0.45,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          id: `floatX-${node.id}`,
        });
        // Y drift: ±6–12px, different duration so X and Y are never in phase
        gsap.to(el, {
          y: `+=${6 + i * 1.2}`,
          duration: 2.5 + i * 0.35,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
          id: `floatY-${node.id}`,
        });
      });

      /* Subtle core pulse */
      gsap.to(coreRef.current, {
        scale: 1.03,
        duration: 3,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        id: 'core-pulse',
      });

      /* 2. Scroll-driven timeline */
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          // Lenis scrolls document.documentElement; tell ScrollTrigger the same
          scroller: document.documentElement,
          start: 'top top',
          end: '+=1500',
          scrub: 1,
          pin: false,
        },
      });

      /* Phase 1 — connector lines draw in (0 → 0.6) */
      NODES.forEach((node) => {
        const path = pathRefs.current[node.id];
        if (!path) return;
        const length = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        tl.to(
          path,
          { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' },
          0,
        );
      });

      /* Phase 2 — kill floating, nodes scale down and converge */
      tl.call(() => {
        NODES.forEach((node) => {
          // Kill both X and Y float tweens
          const tweenX = gsap.getById(`floatX-${node.id}`);
          const tweenY = gsap.getById(`floatY-${node.id}`);
          if (tweenX) tweenX.kill();
          if (tweenY) tweenY.kill();
        });
        const coreTween = gsap.getById('core-pulse');
        if (coreTween) coreTween.kill();
      }, [], 0.4);

      NODES.forEach((node, i) => {
        const el = nodeRefs.current[node.id];
        if (!el) return;
        tl.to(
          el,
          {
            scale: 0.3,
            x: `${-node.dx * (isMobile ? MOBILE_SCALE : 1) * 0.7}`,
            y: `${-node.dy * (isMobile ? MOBILE_SCALE : 1) * 0.7}`,
            opacity: 0,
            duration: 0.5,
            ease: 'power3.in',
          },
          0.5 + i * 0.05,
        );
      });

      /* Phase 3 — core grows slightly (0.6 → 1.0) */
      tl.to(
        coreRef.current!,
        {
          scale: 1.25,
          duration: 0.5,
          ease: 'power2.out',
        },
        0.6,
      );
    }, sectionRef);

    return () => {
      ctx.revert();
    };
  }, [isMobile]);

  /* --------------------------------------------------------------- */
  /*  Render                                                         */
  /* --------------------------------------------------------------- */
  const scale = isMobile ? MOBILE_SCALE : 1;

  return (
    <section
      ref={sectionRef}
      className="min-h-screen relative overflow-x-clip bg-background hero-grid-bg"
    >
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* ---- Text content ---- */}
        <div className="text-center">
         

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.08]">
            Streamline Your Fleet with AI Operations
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
            Five AI agents working 24/7 to handle bookings, dispatch, pricing,
            maintenance, and damage detection — all from a single platform.
          </p>

          <Link
            href="/dashboard"
            className="mt-10 inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full text-base font-semibold hover:shadow-lg transition-all"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ---- Constellation ---- */}
        <div className="relative h-[350px] sm:h-[400px] md:h-[500px] mt-24">
          {/* SVG connectors (desktop only) */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full pointer-events-none hidden md:block"
            viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
            fill="none"
          >
            <circle cx="0" cy="0" r="250" className="constellation-orbit" />
            {NODES.map((node) => (
              <path
                key={node.id}
                ref={(el) => {
                  pathRefs.current[node.id] = el;
                }}
                d={buildConnectorPath(node.dx, node.dy)}
                className="connector-line"
              />
            ))}
          </svg>

          {/* Core sphere */}
          <div
            ref={coreRef}
            className="constellation-core absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center z-10"
          >
            <span className="text-white font-semibold text-[10px] sm:text-xs tracking-wide uppercase">
              FleetOps
            </span>
          </div>

          {/* Orbiting node pills */}
          {NODES.map((node) => {
            const x = node.dx * scale;
            const y = node.dy * scale;
            return (
              <div
                key={node.id}
                ref={(el) => {
                  nodeRefs.current[node.id] = el;
                }}
                className="constellation-node absolute left-1/2 top-1/2 z-20 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[10px] sm:text-xs font-medium text-foreground whitespace-nowrap"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                <node.Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                <span>{node.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

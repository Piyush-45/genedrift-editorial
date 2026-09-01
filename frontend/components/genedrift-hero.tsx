"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect, useRef } from "react";

export default function GenedriftHero() {
  const heroRef = useRef<HTMLElement>(null);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);

  const smoothX = useSpring(pointerX, {
    stiffness: 55,
    damping: 24,
    mass: 0.8,
  });

  const smoothY = useSpring(pointerY, {
    stiffness: 55,
    damping: 24,
    mass: 0.8,
  });

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const onPointerMove = (event: PointerEvent) => {
      const rect = hero.getBoundingClientRect();

      const normalizedX =
        (event.clientX - rect.left) / rect.width - 0.5;

      const normalizedY =
        (event.clientY - rect.top) / rect.height - 0.5;

      pointerX.set(normalizedX * 14);
      pointerY.set(normalizedY * 10);
    };

    const onPointerLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    hero.addEventListener("pointermove", onPointerMove);
    hero.addEventListener("pointerleave", onPointerLeave);

    return () => {
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [pointerX, pointerY]);

  return (
    <section ref={heroRef} className="gd-hero">
      {/* atmospheric background */}
      <div className="gd-hero-grid" />
      <div className="gd-hero-vignette" />
      <div className="gd-hero-orb" />

      {/* NAVIGATION */}
      <header className="gd-nav-shell">
        <div className="gd-nav">
          <a href="/" className="gd-wordmark">
            GENEDRIFT
          </a>

          <nav className="gd-nav-links" aria-label="Primary navigation">
            <a href="#explore">Explore</a>
            <a href="#expertise">Expertise</a>
            <a href="#markets">Markets</a>
            <a href="#insights">Knowledge Hub</a>
            <a href="#success">Client Success</a>
          </nav>

          <div className="gd-nav-right">
            <a href="#company" className="gd-utility-link">
              Company
            </a>

            <a href="#contact" className="gd-nav-cta">
              Speak to an Expert
              <span>↗</span>
            </a>
          </div>
        </div>
      </header>

      {/* VISUAL */}
      <motion.div
        className="gd-prism-stage"
        style={{
          x: smoothX,
          y: smoothY,
        }}
      >
        <RegulatoryPrism />
      </motion.div>

      {/* COPY */}
      <div className="gd-hero-content">
        <motion.div
          className="gd-eyebrow"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <span className="gd-eyebrow-line" />
          GLOBAL REGULATORY CONSULTING
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.42,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          Make complex markets
          <br />
          <span>navigable.</span>
        </motion.h1>

        <motion.p
          className="gd-hero-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.55 }}
        >
          Regulatory strategy, market intelligence and local execution
          across complex emerging markets.
        </motion.p>

        <motion.div
          className="gd-hero-actions"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.66 }}
        >
          <a href="#markets" className="gd-primary-action">
            Explore Markets
            <span>↗</span>
          </a>

          <a href="#expertise" className="gd-secondary-action">
            Explore Expertise
            <span>→</span>
          </a>
        </motion.div>
      </div>

      {/* bottom intelligence rail */}
      <motion.div
        className="gd-proof-rail"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.85 }}
      >
        <div>
          <strong>30+</strong>
          <span>Markets</span>
        </div>

        <i />

        <div>
          <strong>20+</strong>
          <span>MAH Markets</span>
        </div>

        <i />

        <div>
          <strong>04</strong>
          <span>Core Regions</span>
        </div>

        <div className="gd-proof-status">
          <span />
          GLOBAL DELIVERY NETWORK
        </div>
      </motion.div>
    </section>
  );
}

function RegulatoryPrism() {
  return (
    <svg
      className="gd-prism"
      viewBox="0 0 1000 600"
      role="img"
      aria-label="Abstract regulatory intelligence prism"
    >
      <defs>
        <linearGradient id="gd-face-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8B73FF" />
          <stop offset="100%" stopColor="#5B3FD2" />
        </linearGradient>

        <linearGradient id="gd-face-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6D52DF" />
          <stop offset="100%" stopColor="#35206F" />
        </linearGradient>

        <linearGradient id="gd-face-c" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#AC9DFF" />
          <stop offset="100%" stopColor="#7258E6" />
        </linearGradient>

        <radialGradient id="gd-core">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="30%" stopColor="#A996FF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#5B3FD2" stopOpacity="0" />
        </radialGradient>

        <filter id="gd-soft">
          <feGaussianBlur stdDeviation="12" />
        </filter>
      </defs>

      {/* rays */}
      <g className="gd-rays">
        <line x1="500" y1="298" x2="20" y2="90" />
        <line x1="500" y1="298" x2="80" y2="215" />
        <line x1="500" y1="298" x2="20" y2="410" />
        <line x1="500" y1="298" x2="135" y2="555" />

        <line x1="500" y1="298" x2="980" y2="90" />
        <line x1="500" y1="298" x2="920" y2="215" />
        <line x1="500" y1="298" x2="980" y2="410" />
        <line x1="500" y1="298" x2="865" y2="555" />

        <line x1="500" y1="298" x2="500" y2="18" />
        <line x1="500" y1="298" x2="500" y2="582" />
      </g>

      {/* concentric wire prism */}
      <g className="gd-wireframes">
        {[0, 1, 2, 3, 4, 5, 6].map((index) => {
          const offset = index * 13;

          return (
            <polygon
              key={index}
              points={`
                ${500},${112 + offset}
                ${688 - offset},${232 + offset * 0.2}
                ${617 - offset * 0.5},${445 - offset}
                ${500},${510 - offset}
                ${383 + offset * 0.5},${445 - offset}
                ${312 + offset},${232 + offset * 0.2}
              `}
            />
          );
        })}
      </g>

      {/* core soft light */}
      <circle
        cx="500"
        cy="305"
        r="125"
        fill="url(#gd-core)"
        filter="url(#gd-soft)"
        opacity=".45"
      />

      {/* main prism */}
      <g className="gd-main-prism">
        <polygon
          className="gd-prism-top"
          points="500,120 690,235 500,298 310,235"
          fill="url(#gd-face-c)"
        />

        <polygon
          className="gd-prism-left"
          points="310,235 500,298 500,505 382,438"
          fill="url(#gd-face-b)"
        />

        <polygon
          className="gd-prism-right"
          points="690,235 500,298 500,505 618,438"
          fill="url(#gd-face-a)"
        />

        <polygon
          className="gd-prism-front"
          points="382,438 500,505 618,438 500,298"
          fill="#5B3FD2"
          opacity=".76"
        />
      </g>

      {/* horizontal intelligence slices */}
      <g className="gd-slices">
        {Array.from({ length: 16 }).map((_, index) => {
          const y = 175 + index * 8;
          const width = 120 + index * 4;

          return (
            <line
              key={index}
              x1={500 - width}
              x2={500 + width}
              y1={y}
              y2={y + index * 0.3}
            />
          );
        })}
      </g>

      {/* core */}
      <circle cx="500" cy="298" r="5" fill="#FFFFFF" />
      <circle
        className="gd-core-ring"
        cx="500"
        cy="298"
        r="14"
        fill="none"
      />

      {/* tiny conceptual labels */}
      <g className="gd-prism-labels">
        <text x="500" y="83" textAnchor="middle">
          INTELLIGENCE
        </text>

        <text x="270" y="292" textAnchor="end">
          STRATEGY
        </text>

        <text x="730" y="292">
          EXECUTION
        </text>

        <text x="500" y="548" textAnchor="middle">
          LOCAL MARKET
        </text>
      </g>
    </svg>
  );
}

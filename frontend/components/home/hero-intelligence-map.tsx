"use client";

import * as React from "react";
import { WorldMap, marketCountries } from "@/components/home/world-map";

const selectedSequence = ["356", "702", "784", "710", "398"];

const regionLabels = [
  ["APAC", "14 active markets", "region-label-apac"],
  ["Middle East", "06 active markets", "region-label-middle-east"],
  ["Africa", "07 active markets", "region-label-africa"],
  ["CIS", "04 active markets", "region-label-cis"]
] as const;

export function HeroIntelligenceMap() {
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % selectedSequence.length);
    }, 4400);
    return () => window.clearInterval(interval);
  }, []);

  const selected = marketCountries.find((country) => country.id === selectedSequence[activeIndex]) ?? marketCountries[0];

  return (
    <div className="hero-intelligence-map">
      <WorldMap atmospheric selectedId={selected.id} activeRouteIndex={activeIndex} />

      {regionLabels.map(([region, count, className]) => (
        <div className={`hero-region-label ${className}`} key={region}>
          <span>{region}</span><small>{count}</small>
        </div>
      ))}

      <aside className="selected-market-annotation" aria-live="polite">
        <span>{selected.region}</span>
        <strong>{selected.name}</strong>
        <small>Active market</small>
        <ul>{selected.capabilities.slice(0, 3).map((capability) => <li key={capability}>{capability}</li>)}</ul>
      </aside>
    </div>
  );
}

"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorldMap, marketCountries, type MarketCountry, type MarketRegion } from "@/components/home/world-map";

const regions: MarketRegion[] = ["Asia Pacific", "Middle East", "Africa", "CIS"];

export function MarketExplorer() {
  const [region, setRegion] = React.useState<MarketRegion>("Asia Pacific");
  const [selected, setSelected] = React.useState<MarketCountry>(marketCountries[0]);

  function changeRegion(value: string) {
    const nextRegion = value as MarketRegion;
    setRegion(nextRegion);
    const first = marketCountries.find((country) => country.region === nextRegion);
    if (first) setSelected(first);
  }

  const visibleCountries = marketCountries.filter((country) => country.region === region);

  return (
    <div className="market-explorer">
      <Tabs value={region} onValueChange={changeRegion}>
        <TabsList className="market-region-tabs" aria-label="GeneDrift operating regions">
          {regions.map((item, index) => <TabsTrigger key={item} value={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <div className="market-explorer-layout">
        <div className="market-map-panel">
          <WorldMap selectedId={selected.id} activeRegion={region} onSelect={setSelected} />
          <div className="market-legend" aria-label="Map legend">
            <span><i className="legend-active" /> Active market</span>
            <span><i className="legend-selected" /> Selected</span>
            <span><i className="legend-upcoming" /> Upcoming</span>
            <span><i className="legend-neutral" /> Non-operational</span>
          </div>
        </div>
        <aside className="market-context" aria-live="polite">
          <span>{selected.region}</span>
          <h3>{selected.name}</h3>
          <p>Capabilities</p>
          <ul>{selected.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
          <a href="#contact">Explore {selected.name} <ArrowRight aria-hidden="true" size={17} /></a>
          <div className="country-selector" aria-label={`${region} markets`}>
            {visibleCountries.map((country) => (
              <button className={country.id === selected.id ? "is-selected" : ""} key={country.id} onClick={() => setSelected(country)}>{country.name}</button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

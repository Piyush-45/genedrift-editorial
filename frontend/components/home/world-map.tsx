"use client";

import * as React from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldData from "world-atlas/countries-110m.json";
import { cn } from "@/lib/utils";

export type MarketRegion = "Asia Pacific" | "Middle East" | "Africa" | "CIS";

export type MarketCountry = {
  id: string;
  name: string;
  region: MarketRegion;
  capabilities: string[];
  status?: "active" | "upcoming";
  coordinates: [number, number];
};

export const marketCountries: MarketCountry[] = [
  { id: "356", name: "India", region: "Asia Pacific", capabilities: ["Regulatory Affairs", "Pharmacovigilance", "MAH / Local Representation"], coordinates: [78.9, 22.7] },
  { id: "764", name: "Thailand", region: "Asia Pacific", capabilities: ["Regulatory Affairs", "Product Registration", "Lifecycle Management"], coordinates: [100.9, 15.8] },
  { id: "704", name: "Vietnam", region: "Asia Pacific", capabilities: ["Regulatory Affairs", "Market Intelligence", "Local Coordination"], coordinates: [108.3, 14.1] },
  { id: "608", name: "Philippines", region: "Asia Pacific", capabilities: ["Registration Support", "Regulatory Intelligence", "Lifecycle Support"], coordinates: [122.9, 11.7] },
  { id: "458", name: "Malaysia", region: "Asia Pacific", capabilities: ["Regulatory Affairs", "Pharmacovigilance", "Local Representation"], coordinates: [102.3, 4.2] },
  { id: "702", name: "Singapore", region: "Asia Pacific", capabilities: ["Regional Project Management", "Regulatory Strategy", "PV Coordination"], coordinates: [103.8, 1.35] },
  { id: "360", name: "Indonesia", region: "Asia Pacific", capabilities: ["Market Entry", "Registration Support", "Local Representation"], coordinates: [118, -2.4] },
  { id: "158", name: "Taiwan", region: "Asia Pacific", capabilities: ["Regulatory Strategy", "Submission Support", "Lifecycle Management"], coordinates: [121, 23.7] },
  { id: "344", name: "Hong Kong", region: "Asia Pacific", capabilities: ["Regulatory Intelligence", "Market Entry", "Local Coordination"], coordinates: [114.1, 22.3] },
  { id: "116", name: "Cambodia", region: "Asia Pacific", capabilities: ["Market Entry", "Registration Support", "Local Coordination"], status: "upcoming", coordinates: [104.9, 12.6] },
  { id: "104", name: "Myanmar", region: "Asia Pacific", capabilities: ["Market Intelligence", "Registration Planning", "Local Coordination"], status: "upcoming", coordinates: [96.5, 21.9] },
  { id: "144", name: "Sri Lanka", region: "Asia Pacific", capabilities: ["Regulatory Affairs", "Local Representation", "PV Support"], coordinates: [80.7, 7.8] },
  { id: "586", name: "Pakistan", region: "Asia Pacific", capabilities: ["Regulatory Strategy", "Dossier Support", "Local Representation"], coordinates: [69.3, 30.4] },
  { id: "096", name: "Brunei", region: "Asia Pacific", capabilities: ["Market Intelligence", "Registration Planning", "Local Coordination"], status: "upcoming", coordinates: [114.7, 4.5] },
  { id: "682", name: "Saudi Arabia", region: "Middle East", capabilities: ["Regulatory Affairs", "Pharmacovigilance", "MAH / Local Representation"], coordinates: [45.1, 23.9] },
  { id: "784", name: "UAE", region: "Middle East", capabilities: ["Regional Project Management", "Regulatory Affairs", "PV Coordination"], coordinates: [54.4, 24.3] },
  { id: "634", name: "Qatar", region: "Middle East", capabilities: ["Market Entry", "Registration Support", "Local Representation"], coordinates: [51.2, 25.3] },
  { id: "512", name: "Oman", region: "Middle East", capabilities: ["Regulatory Strategy", "Product Registration", "Lifecycle Support"], coordinates: [56.1, 20.5] },
  { id: "414", name: "Kuwait", region: "Middle East", capabilities: ["Market Entry", "Regulatory Affairs", "Local Coordination"], coordinates: [47.5, 29.3] },
  { id: "048", name: "Bahrain", region: "Middle East", capabilities: ["Regulatory Intelligence", "Registration Planning", "Local Support"], status: "upcoming", coordinates: [50.6, 26.0] },
  { id: "566", name: "Nigeria", region: "Africa", capabilities: ["Regulatory Affairs", "Local Representation", "PV Support"], coordinates: [8.7, 9.1] },
  { id: "404", name: "Kenya", region: "Africa", capabilities: ["Market Entry", "Regulatory Affairs", "Local Coordination"], coordinates: [37.9, 0.2] },
  { id: "834", name: "Tanzania", region: "Africa", capabilities: ["Registration Support", "Regulatory Intelligence", "Lifecycle Support"], coordinates: [34.9, -6.4] },
  { id: "710", name: "South Africa", region: "Africa", capabilities: ["Regulatory Affairs", "Pharmacovigilance", "Regional Coordination"], coordinates: [24.2, -29.0] },
  { id: "288", name: "Ghana", region: "Africa", capabilities: ["Market Entry", "Product Registration", "Local Representation"], coordinates: [-1.0, 7.9] },
  { id: "686", name: "Senegal", region: "Africa", capabilities: ["Regulatory Intelligence", "Market Entry", "Local Support"], status: "upcoming", coordinates: [-14.5, 14.5] },
  { id: "384", name: "Ivory Coast", region: "Africa", capabilities: ["Registration Planning", "Local Coordination", "Market Intelligence"], status: "upcoming", coordinates: [-5.5, 7.5] },
  { id: "398", name: "Kazakhstan", region: "CIS", capabilities: ["Regulatory Affairs", "Local Representation", "Lifecycle Management"], coordinates: [67.3, 48.1] },
  { id: "860", name: "Uzbekistan", region: "CIS", capabilities: ["Market Entry", "Product Registration", "Local Coordination"], coordinates: [64.6, 41.4] },
  { id: "031", name: "Azerbaijan", region: "CIS", capabilities: ["Regulatory Strategy", "Registration Support", "PV Coordination"], coordinates: [47.6, 40.1] },
  { id: "417", name: "Kyrgyzstan", region: "CIS", capabilities: ["Market Intelligence", "Registration Planning", "Local Support"], status: "upcoming", coordinates: [74.6, 41.2] }
];

const topology = worldData as unknown as Topology<{ countries: GeometryCollection }>;
const countries = feature(topology, topology.objects.countries) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;
const projection = geoEqualEarth().fitExtent([[12, 12], [888, 488]], countries);
const drawPath = geoPath(projection);
const marketById = new Map(marketCountries.map((country) => [country.id, country]));

const routeCountries = ["702", "784", "710", "398", "764"];

function projectedPoint(countryId: string) {
  const country = marketById.get(countryId);
  return country ? projection(country.coordinates) : null;
}

export function WorldMap({
  selectedId,
  activeRegion,
  atmospheric = false,
  activeRouteIndex = 0,
  onSelect
}: {
  selectedId?: string;
  activeRegion?: MarketRegion;
  atmospheric?: boolean;
  activeRouteIndex?: number;
  onSelect?: (country: MarketCountry) => void;
}) {
  const activeIds = new Set(
    marketCountries.filter((country) => !activeRegion || country.region === activeRegion).map((country) => country.id)
  );
  const india = projectedPoint("356");
  const routePoints = routeCountries.map(projectedPoint).filter((point): point is [number, number] => Boolean(point));
  const routePaths = india
    ? routePoints.map((point, index) => {
        const middleX = (india[0] + point[0]) / 2;
        const controlY = Math.min(india[1], point[1]) - 30 - index * 3;
        return `M${india[0]},${india[1]} Q${middleX},${controlY} ${point[0]},${point[1]}`;
      })
    : [];

  return (
    <svg className={cn("real-world-map", atmospheric && "real-world-map-atmospheric")} viewBox="0 0 900 500" role="img" aria-label={atmospheric ? "GeneDrift global operating network" : "GeneDrift operational markets map"}>
      <g className="map-geography">
        {countries.features.map((country) => {
          const id = String(country.id).padStart(3, "0");
          const market = marketById.get(id);
          const path = drawPath(country);
          if (!path) return null;
          const isSelected = selectedId === id;
          const isActive = activeIds.has(id);
          const className = cn(
            "map-country",
            market && isActive && "map-country-active",
            market?.status === "upcoming" && isActive && "map-country-upcoming",
            isSelected && "map-country-selected"
          );
          if (market && isActive && onSelect) {
            return (
              <path
                key={id}
                d={path}
                className={className}
                role="button"
                tabIndex={0}
                aria-label={`${market.name}, ${market.region}`}
                onClick={() => onSelect(market)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(market);
                  }
                }}
              />
            );
          }
          return <path key={id} d={path} className={className} aria-hidden="true" />;
        })}
      </g>

      {atmospheric ? (
        <g className="map-routes" aria-hidden="true">
          {routePaths.map((path, index) => (
            <path key={`route-${index}`} d={path} className={index === activeRouteIndex ? "is-active" : ""} />
          ))}
          {india ? <circle cx={india[0]} cy={india[1]} r="4" className="route-origin" /> : null}
          {routePoints.map((point) => <circle key={`${point[0]}-${point[1]}`} cx={point[0]} cy={point[1]} r="3" className="route-node" />)}
          {routePaths[activeRouteIndex] ? (
            <circle key={activeRouteIndex} r="2.5" className="route-signal">
              <animateMotion dur="3.2s" path={routePaths[activeRouteIndex]} begin="0s" fill="freeze" />
            </circle>
          ) : null}
        </g>
      ) : null}
    </svg>
  );
}

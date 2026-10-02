import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { CSSProperties } from "react";
import worldData from "world-atlas/countries-110m.json";
import { Building2, FileText, ShieldCheck } from "lucide-react";

type AtlasRegion = "apac" | "middle-east" | "africa" | "cis";

const activeMarketRegionById: Record<string, AtlasRegion> = {
  "031": "cis",
  "144": "apac",
  "158": "apac",
  "288": "africa",
  "344": "apac",
  "356": "apac",
  "360": "apac",
  "398": "cis",
  "404": "africa",
  "414": "middle-east",
  "458": "apac",
  "512": "middle-east",
  "566": "africa",
  "586": "apac",
  "608": "apac",
  "634": "middle-east",
  "682": "middle-east",
  "702": "apac",
  "704": "apac",
  "710": "africa",
  "764": "apac",
  "784": "middle-east",
  "834": "africa",
  "860": "cis"
};

const regionLabels = [
  { id: "apac", label: "APAC", x: 735, y: 352 },
  { id: "middle-east", label: "MIDDLE EAST", x: 560, y: 270 },
  { id: "africa", label: "AFRICA", x: 475, y: 370 },
  { id: "cis", label: "CIS", x: 625, y: 180 }
] as const;

const topology = worldData as unknown as Topology<{ countries: GeometryCollection }>;
const countries = feature(
  topology,
  topology.objects.countries
) as unknown as FeatureCollection<Geometry, GeoJsonProperties>;
const projection = geoEqualEarth().fitExtent([[28, 28], [872, 472]], countries);
const drawPath = geoPath(projection);
const countryRenderData = countries.features.flatMap((country, index) => {
  const path = drawPath(country);
  if (!path) return [];
  const id = country.id == null ? null : String(country.id).padStart(3, "0");
  return [{ id, key: id ?? `unmapped-country-${index}`, path, region: id ? activeMarketRegionById[id] : undefined }];
});

const networkPoints = [
  { id: "india", region: "apac", coordinates: [78.9, 22.7] as [number, number] },
  { id: "saudi-arabia", region: "middle-east", coordinates: [45.1, 23.9] as [number, number] },
  { id: "singapore", region: "apac", coordinates: [103.8, 1.35] as [number, number] },
  { id: "south-africa", region: "africa", coordinates: [24.2, -29] as [number, number] },
  { id: "kazakhstan", region: "cis", coordinates: [67.3, 48.1] as [number, number] }
].map((point) => ({ ...point, projected: projection(point.coordinates) }));

const origin = networkPoints[0].projected;

function routeTo(point: [number, number]) {
  if (!origin) return "";
  const middleX = (origin[0] + point[0]) / 2;
  const controlY = Math.min(origin[1], point[1]) - 54;
  return `M${origin[0]},${origin[1]} Q${middleX},${controlY} ${point[0]},${point[1]}`;
}

export function RegulatoryAtlas() {
  return (
    <figure className="regulatory-atlas" aria-labelledby="regulatory-atlas-title">
      <figcaption className="sr-only" id="regulatory-atlas-title">
        Genedrift’s regulatory network connecting local market execution across Asia Pacific, the Middle East, Africa and CIS.
      </figcaption>

      <div className="atlas-coordinate atlas-coordinate-top" aria-hidden="true">24.31° N / 54.52° E</div>
      <div className="atlas-coordinate atlas-coordinate-bottom" aria-hidden="true">REGULATORY NETWORK / 04 REGIONS</div>

      <svg className="atlas-map" viewBox="0 0 900 500" aria-hidden="true">
        <g className="atlas-longitudes">
          <ellipse cx="450" cy="250" rx="430" ry="174" />
          <ellipse cx="450" cy="250" rx="308" ry="214" />
          <ellipse cx="450" cy="250" rx="170" ry="230" />
        </g>

        <g className="atlas-geography">
          {countryRenderData.filter((country) => !country.region).map((country) => (
            <path key={country.key} d={country.path} className="atlas-country" />
          ))}
          {regionLabels.map((region) => (
            <g className={`atlas-region atlas-region-${region.id}`} key={region.id}>
              {countryRenderData.filter((country) => country.region === region.id).map((country) => (
                <path key={country.key} d={country.path} className="atlas-country atlas-country-active" />
              ))}
              <text className="atlas-region-label" x={region.x} y={region.y}>{region.label}</text>
            </g>
          ))}
        </g>

        {origin ? (
          <g className="atlas-routes">
            {networkPoints.slice(1).map((point) => point.projected ? (
              <g key={point.id}>
                <path className="atlas-route-base" d={routeTo(point.projected)} />
                <path className="atlas-route-draw" d={routeTo(point.projected)} pathLength={1} />
              </g>
            ) : null)}
          </g>
        ) : null}

        <g className="atlas-nodes">
          {networkPoints.map((point, index) =>
            point.projected ? (
              <g
                className={`atlas-node atlas-node-${point.region}`}
                key={point.id}
                style={{
                  "--atlas-node-enter-delay": `${index * 85}ms`,
                  "--atlas-node-pulse-delay": `${index * 560}ms`
                } as CSSProperties}
                transform={`translate(${point.projected[0]} ${point.projected[1]})`}
              >
                <circle className="atlas-node-ring" r="12" />
                <circle className="atlas-node-pulse" r="12" />
                <circle className="atlas-node-core" r="3.5" />
              </g>
            ) : null
          )}
        </g>
      </svg>

      <div className="atlas-capability atlas-capability-ra">
        <span><FileText aria-hidden="true" /></span>
        <div><small>01</small><strong>Regulatory Affairs</strong></div>
      </div>
      <div className="atlas-capability atlas-capability-pv">
        <span><ShieldCheck aria-hidden="true" /></span>
        <div><small>02</small><strong>Pharmacovigilance</strong></div>
      </div>
      <div className="atlas-capability atlas-capability-mah">
        <span><Building2 aria-hidden="true" /></span>
        <div><small>03</small><strong>MAH & Local Representation</strong></div>
      </div>

      <div className="atlas-signal" aria-hidden="true">
        <div><span>Operating signal</span><strong>Active regional coverage</strong></div>
        <dl>
          <div><dt>Regions</dt><dd>04</dd></div>
          <div><dt>Markets</dt><dd>30+</dd></div>
          <div><dt>Model</dt><dd>Local</dd></div>
        </dl>
      </div>
    </figure>
  );
}

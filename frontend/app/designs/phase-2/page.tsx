import type { Metadata } from "next";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import worldData from "world-atlas/countries-110m.json";
import { ConceptStudio } from "./studio";

export const metadata: Metadata = {
  title: "Phase 2 · Three homepage directions",
  description: "Three original GeneDrift homepage hero concepts for design selection.",
  robots: { index: false, follow: false },
};

export default function ConceptPage() {
  const topology = worldData as unknown as Topology<{ countries: GeometryCollection }>;
  const countries = feature(topology, topology.objects.countries);
  const projection = geoEqualEarth().fitExtent([[15, 15], [785, 405]], countries);
  const path = geoPath(projection);
  const map = countries.features.filter(country => String(country.id) !== "010").map((country, index) => ({
    id: String(country.id ?? index).padStart(3, "0"), d: path(country) ?? "",
  }));
  return <ConceptStudio map={map} />;
}

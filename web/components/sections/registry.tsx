import type { ComponentType } from "react";
import type { Section, SectionType } from "@/lib/schema/section";
import { Statement } from "./statement";
import { CapabilityPanels } from "./capability-panels";

/**
 * type -> component. This map is the renderer. A page is a loop over an
 * ordered array of sections; each one is looked up here and rendered.
 */
const REGISTRY: { [K in SectionType]: ComponentType<Extract<Section, { type: K }>> } = {
  statement: Statement,
  "capability-panels": CapabilityPanels,
};

export function RenderSections({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, i) => {
        const Component = REGISTRY[section.type] as ComponentType<Section>;
        if (!Component) {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`[sections] no component registered for "${section.type}"`);
          }
          return null;
        }
        return <Component key={`${section.type}-${i}`} {...section} />;
      })}
    </>
  );
}

export const REGISTERED_TYPES = Object.keys(REGISTRY) as SectionType[];

import { z } from "zod";
import { statementSchema } from "@/components/sections/statement/schema";
import { capabilityPanelsSchema } from "@/components/sections/capability-panels/schema";

/**
 * Every section type the site can render. Adding one means: create the folder
 * under components/sections/, add its schema here, add it to the registry.
 * Nothing else changes — templates pick sections up automatically.
 */
export const sectionSchema = z.discriminatedUnion("type", [
  statementSchema,
  capabilityPanelsSchema,
]);

export type Section = z.infer<typeof sectionSchema>;
export type SectionType = Section["type"];

/** A published page as it arrives from Catalyst. */
export const pageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  seo: z.object({ title: z.string(), description: z.string() }).optional(),
  sections: z.array(sectionSchema),
});

export type Page = z.infer<typeof pageSchema>;

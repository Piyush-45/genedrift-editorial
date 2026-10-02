import { z } from "zod";

/**
 * Expertise — two panels. A short intro on the left, capability blocks on the
 * right. The client asked for three capabilities on the homepage, edge borders
 * rather than full ones, no icons, and a hover state that lifts the block.
 *
 * `emphasis` picks the top-edge colour. `wide` spans both columns — the design
 * puts MAH & Local Representation full width beneath the other two.
 */
export const capabilityPanelsSchema = z.object({
  type: z.literal("capability-panels"),
  eyebrow: z.string().min(1),
  heading: z.string().min(1),
  intro: z.string().optional(),
  linkLabel: z.string().optional(),
  linkHref: z.string().optional(),
  items: z
    .array(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        tags: z.array(z.string()).default([]),
        emphasis: z.enum(["primary", "secondary", "deep"]).default("primary"),
        wide: z.boolean().default(false),
      }),
    )
    .min(1),
});

export type CapabilityPanelsProps = z.infer<typeof capabilityPanelsSchema>;

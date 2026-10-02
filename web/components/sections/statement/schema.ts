import { z } from "zod";

/**
 * The "Where regulatory clarity becomes market access" block.
 * Two-tone heading: `lead` in ink, `tail` in a lighter tone.
 */
export const statementSchema = z.object({
  type: z.literal("statement"),
  eyebrow: z.string().min(1),
  lead: z.string().min(1),
  tail: z.string().optional(),
  actions: z
    .array(z.object({ label: z.string().min(1), href: z.string().min(1), variant: z.enum(["solid", "outline"]) }))
    .max(2)
    .default([]),
});

export type StatementProps = z.infer<typeof statementSchema>;

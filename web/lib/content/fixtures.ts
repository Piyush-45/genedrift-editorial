import { pageSchema, type Page } from "@/lib/schema/section";
import { statementFixture } from "@/components/sections/statement/fixture";
import { capabilityPanelsFixture } from "@/components/sections/capability-panels/fixture";

/**
 * Stand-in for Catalyst while the CMS is being built. Same shape, same
 * validation path — swapping the source later touches one function.
 */
const HOME = {
  slug: "home",
  title: "Genedrift — Global Regulatory Affairs & Pharmacovigilance",
  sections: [statementFixture, capabilityPanelsFixture],
};

export function getPage(slug: string): Page | null {
  const raw = slug === "home" ? HOME : null;
  if (!raw) return null;

  const parsed = pageSchema.safeParse(raw);
  if (!parsed.success) {
    // In production this is where we log and fall back rather than crash.
    throw new Error(`Invalid page "${slug}": ${parsed.error.message}`);
  }
  return parsed.data;
}

export const ALL_FIXTURES = [statementFixture, capabilityPanelsFixture];

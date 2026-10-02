import type { Metadata } from "next";
import { ALL_FIXTURES } from "@/lib/content/fixtures";
import { RenderSections } from "@/components/sections/registry";
import { REGISTERED_TYPES } from "@/components/sections/registry";

/**
 * Component gallery. Every section rendered with its fixture, in one place.
 * Playwright snapshots this, so a CSS change that breaks one section fails CI.
 * Also the page to send the client when they want a component in isolation.
 */
export const metadata: Metadata = {
  title: "Section gallery",
  robots: { index: false, follow: false },
};

export default function SectionGallery() {
  return (
    <main className="pb-section">
      <header className="border-b border-line px-gutter py-12">
        <p className="label text-accent">Internal · section gallery</p>
        <h1 className="mt-4 text-h1">
          {REGISTERED_TYPES.length} section{REGISTERED_TYPES.length === 1 ? "" : "s"} registered
        </h1>
        <p className="mt-3 max-w-[70ch] text-body text-muted">
          Each section below is rendered from its own fixture. Not linked from the site and
          excluded from search.
        </p>
      </header>

      {ALL_FIXTURES.map((fixture, i) => (
        <section key={`${fixture.type}-${i}`} className="border-b border-line pb-section">
          <p className="label px-gutter pt-10 text-faint">{fixture.type}</p>
          <RenderSections sections={[fixture]} />
        </section>
      ))}
    </main>
  );
}

import { notFound } from "next/navigation";
import { getPage } from "@/lib/content/fixtures";
import { RenderSections } from "@/components/sections/registry";

export default function HomePage() {
  const page = getPage("home");
  if (!page) notFound();

  return (
    <main className="pb-section">
      <RenderSections sections={page.sections} />
    </main>
  );
}

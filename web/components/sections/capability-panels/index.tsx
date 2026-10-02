import Link from "next/link";
import { cn } from "@/lib/cn";
import type { CapabilityPanelsProps } from "./schema";

const EDGE = {
  primary: "border-t-accent",
  secondary: "border-t-accent-soft",
  deep: "border-t-deep",
} as const;

export function CapabilityPanels({
  eyebrow,
  heading,
  intro,
  linkLabel,
  linkHref,
  items,
}: CapabilityPanelsProps) {
  return (
    <section className="px-gutter pt-section">
      <div className="mx-auto grid max-w-body gap-16 lg:grid-cols-[340px_1fr] lg:items-start">
        <div>
          <p className="label text-accent">{eyebrow}</p>
          <h2 className="mt-4 text-h1 leading-[1.14]">{heading}</h2>
          {intro && <p className="mt-5 text-lead text-muted">{intro}</p>}
          {linkLabel && linkHref && (
            <Link href={linkHref} className="mt-6 inline-block text-sm font-semibold text-accent">
              {linkLabel}
            </Link>
          )}
        </div>

        <div className="grid gap-4.5 sm:grid-cols-2">
          {items.map((item) => (
            <article
              key={item.title}
              className={cn(
                "group border-t-[3px] bg-surface px-7.5 pt-7.5 pb-7",
                "transition-[transform,background-color,box-shadow] duration-200 ease-[var(--ease-out-soft)]",
                "hover:-translate-y-1.5 hover:bg-canvas hover:shadow-card",
                EDGE[item.emphasis],
                item.wide && "sm:col-span-2",
              )}
            >
              <h3 className="text-h3">{item.title}</h3>
              <p className="mt-3 max-w-[62ch] text-body text-muted">{item.body}</p>
              {item.tags.length > 0 && (
                <p className="label mt-4 text-faint">{item.tags.join(" · ")}</p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

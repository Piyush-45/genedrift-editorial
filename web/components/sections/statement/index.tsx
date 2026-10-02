import Link from "next/link";
import type { StatementProps } from "./schema";

export function Statement({ eyebrow, lead, tail, actions }: StatementProps) {
  return (
    <section className="px-gutter pt-section">
      <div className="mx-auto max-w-body">
        <p className="label flex items-center gap-2.5 text-accent">
          <span aria-hidden className="block size-1.5 bg-accent" />
          {eyebrow}
        </p>

        <h2 className="mt-7 max-w-[73ch] text-h1 leading-[1.24] font-semibold">
          {lead} {tail ? <span className="text-ghost">{tail}</span> : null}
        </h2>

        {actions.length > 0 && (
          <div className="mt-9 flex flex-wrap gap-3.5">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={
                  a.variant === "solid"
                    ? "rounded-control bg-deep px-7 py-4 text-body font-semibold text-on-deep transition-colors hover:bg-accent"
                    : "rounded-control border border-line px-7 py-4 text-body font-medium transition-colors hover:border-accent hover:text-accent"
                }
              >
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

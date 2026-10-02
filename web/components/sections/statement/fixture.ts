import type { StatementProps } from "./schema";

export const statementFixture: StatementProps = {
  type: "statement",
  eyebrow: "Where regulatory clarity becomes market access",
  lead: "We do not sell hours. We take responsibility for an outcome — a licence granted, a QPPV on record, a market opened",
  tail: "— and we stay accountable for it long after the approval letter arrives, across every renewal, variation and inspection that follows.",
  actions: [
    { label: "Speak to an Expert", href: "/contact", variant: "solid" },
    { label: "Our operating model", href: "/company/operating-model", variant: "outline" },
  ],
};

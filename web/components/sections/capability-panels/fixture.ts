import type { CapabilityPanelsProps } from "./schema";

export const capabilityPanelsFixture: CapabilityPanelsProps = {
  type: "capability-panels",
  eyebrow: "Service overview",
  heading: "Three core capabilities.",
  intro:
    "Engage a single capability or hand over the whole lifecycle. One regional team, one commercial relationship, whichever you choose.",
  linkLabel: "All expertise",
  linkHref: "/expertise",
  items: [
    {
      title: "Regulatory Affairs",
      body: "Strategy and intelligence, dossier preparation, eCTD publishing, submission management, approvals and lifecycle change.",
      tags: ["Dossier", "eCTD", "Variations", "Renewals"],
      emphasis: "primary",
      wide: false,
    },
    {
      title: "Pharmacovigilance",
      body: "Local QPPV and deputy cover, ICSR intake, literature monitoring, aggregate reporting and inspection readiness.",
      tags: ["QPPV", "PSUR / PBRER", "PSMF", "Inspections"],
      emphasis: "secondary",
      wide: false,
    },
    {
      title: "MAH & Local Representation",
      body: "Licence holding and local representation in markets where you have no legal entity — obligations, authority correspondence and lifecycle duties managed on your behalf, by people on record with the authority.",
      tags: ["Licence holding", "Authority communication", "Lifecycle support"],
      emphasis: "deep",
      wide: true,
    },
  ],
};

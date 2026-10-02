import {
  Activity,
  Building2,
  FileText,
  Layers3,
  Radar,
  UsersRound
} from "lucide-react";

export const expertiseItems = [
  {
    number: "01",
    icon: FileText,
    title: "Regulatory Affairs",
    text: "Market-entry strategy, classification, dossier preparation, submission coordination and lifecycle support across complex regulated categories."
  },
  {
    number: "02",
    icon: Activity,
    title: "Pharmacovigilance",
    text: "Integrated safety operations, compliant oversight and market-specific pharmacovigilance support across active product portfolios."
  },
  {
    number: "03",
    icon: Building2,
    title: "MAH & Local Representation",
    text: "Accountable in-country representation, governance and lifecycle ownership."
  },
  {
    number: "04",
    icon: Radar,
    title: "Regulatory Intelligence",
    text: "Structured monitoring translated into decision-ready market insight."
  },
  {
    number: "05",
    icon: Layers3,
    title: "Managed Regulatory Services",
    text: "Scalable, governed support across submissions and portfolio operations."
  },
  {
    number: "06",
    icon: UsersRound,
    title: "Dedicated Regulatory Teams",
    text: "Experienced capacity that works within your operating model and standards."
  }
] as const;

export type NavigationLink = {
  label: string;
  href: string;
};

export type NavigationSection = {
  label?: string;
  priority: "primary" | "secondary";
  links: readonly NavigationLink[];
};

export type NavigationGroup = {
  id: "explore" | "expertise" | "markets" | "knowledge";
  label: string;
  description: string;
  sections: readonly NavigationSection[];
  footerLink?: NavigationLink;
};

export const navigationGroups: readonly NavigationGroup[] = [
  {
    id: "explore",
    label: "Explore",
    description: "Start with the regulatory or commercial decision Genedrift can help you navigate.",
    sections: [
      {
        priority: "primary",
        links: [
          { label: "Enter a New Market", href: "/#business-needs" },
          { label: "Register or Commercialize a Product", href: "/#business-needs" },
          { label: "Establish Local Representation / MAH", href: "/#business-needs" },
          { label: "Build Pharmacovigilance Compliance", href: "/#business-needs" },
          { label: "Prepare for a Regulatory Submission", href: "/#business-needs" },
          { label: "Resolve a Regulatory Challenge", href: "/#business-needs" }
        ]
      }
    ],
    footerLink: { label: "View all business needs", href: "/#business-needs" }
  },
  {
    id: "expertise",
    label: "Expertise",
    description: "Integrated regulatory capabilities for complex global and local programs.",
    sections: [
      {
        priority: "primary",
        links: [
          { label: "Regulatory Affairs", href: "/#expertise" },
          { label: "Pharmacovigilance", href: "/#expertise" },
          { label: "MAH & Local Representation", href: "/#expertise" },
          { label: "Regulatory Intelligence", href: "/#intelligence" },
          { label: "Managed Regulatory Services", href: "/#expertise" },
          { label: "Dedicated Regulatory Teams", href: "/#expertise" }
        ]
      }
    ],
    footerLink: { label: "View all expertise", href: "/#expertise" }
  },
  {
    id: "markets",
    label: "Markets",
    description: "Explore regulatory capabilities and intelligence across Genedrift’s operating regions.",
    sections: [
      {
        label: "Operating regions",
        priority: "primary",
        links: [
          { label: "Asia Pacific", href: "/#markets" },
          { label: "Middle East", href: "/#markets" },
          { label: "Africa", href: "/#markets" },
          { label: "CIS", href: "/#markets" }
        ]
      },
      {
        label: "Market tools",
        priority: "secondary",
        links: [
          { label: "Compare Markets", href: "/#markets" },
          { label: "Interactive Coverage Map", href: "/#markets" },
          { label: "Regional Regulatory Guides", href: "/insights" }
        ]
      }
    ]
  },
  {
    id: "knowledge",
    label: "Knowledge Hub",
    description: "Decision-ready regulatory intelligence, market insight and professional analysis.",
    sections: [
      {
        label: "Insights & Intelligence",
        priority: "primary",
        links: [
          { label: "Featured Insights", href: "/#insights" },
          { label: "Regulatory Updates", href: "/#intelligence" },
          { label: "Authority News", href: "/#intelligence" }
        ]
      },
      {
        label: "Market Knowledge",
        priority: "primary",
        links: [
          { label: "Country Intelligence", href: "/insights" },
          { label: "Market Entry Guides", href: "/insights" },
          { label: "Regulatory Roadmaps", href: "/insights" }
        ]
      },
      {
        label: "Resources",
        priority: "primary",
        links: [
          { label: "Whitepapers & Downloads", href: "/insights" },
          { label: "Webinars & Videos", href: "/insights" },
          { label: "Regulatory Calendar", href: "/insights" }
        ]
      }
    ],
    footerLink: { label: "Explore all insights", href: "/insights" }
  }
] as const;

export const utilityNavigationLinks = [
  { label: "Client Success", href: "/#client-success" },
  { label: "Company", href: "/#why-genedrift" },
  { label: "Careers", href: "mailto:cs@genedrift.com?subject=Careers%20at%20Genedrift" }
] as const;

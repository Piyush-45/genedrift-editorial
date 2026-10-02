import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  FileCheck2,
  Globe2,
  Handshake,
  Layers3,
  MapPinned,
  Network,
  ShieldCheck,
} from "lucide-react";
import { BusinessNeeds } from "@/components/home/business-needs";
import { FeaturedExpertise } from "@/components/home/featured-expertise";
import { Hero } from "@/components/home/hero";
import { MarketExplorer } from "@/components/home/market-explorer";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Separator } from "@/components/ui/separator";

const intelligence = [
  { type: "Regulatory update", market: "Saudi Arabia", date: "28 Aug 2026", title: "Saudi Arabia updates requirements for pharmaceutical submissions" },
  { type: "Market intelligence", market: "India", date: "22 Aug 2026", title: "Preparing for an evolving digital submission environment in India" },
  { type: "PV briefing", market: "Africa", date: "14 Aug 2026", title: "Designing pharmacovigilance oversight across multi-country portfolios" },
  { type: "Operational note", market: "CIS", date: "07 Aug 2026", title: "Local representation considerations for expanding into CIS markets" }
];

const insights = [
  {
    title: "Navigating multi-country regulatory submissions in emerging markets",
    category: "Regulatory strategy",
    excerpt: "A practical framework for aligning evidence, sequencing and local execution across diverse authority environments."
  },
  {
    title: "Building scalable pharmacovigilance across diverse regulatory environments",
    category: "Pharmacovigilance",
    excerpt: "How to create consistent safety governance without losing essential local market accountability."
  },
  {
    title: "MAH and local representation: choosing the right market-entry structure",
    category: "Market entry",
    excerpt: "Key operating questions for organizations establishing regulated product presence in a new jurisdiction."
  }
];

const caseStudies = [
  {
    client: "Leading Consumer Healthcare Company",
    context: "A growing portfolio required coordinated regulatory and pharmacovigilance support across several emerging markets.",
    engagement: "Genedrift established regional governance, local market ownership and a consistent delivery rhythm.",
    outcome: "The client gained one accountable operating view across regulatory and safety activities."
  },
  {
    client: "Leading US Regulatory Consulting Organization",
    context: "A trusted advisory partner needed dependable in-market execution without expanding permanent regional infrastructure.",
    engagement: "Genedrift provided dedicated local expertise, submission coordination and controlled client communication.",
    outcome: "Regional work moved through a clearer, scalable and fully governed delivery model."
  },
  {
    client: "Multinational Regulatory Intelligence Program",
    context: "Decision-makers needed relevant regulatory changes from multiple markets in one usable format.",
    engagement: "Genedrift designed a monitoring, interpretation and reporting process aligned to portfolio priorities.",
    outcome: "Market signals became a consistent input to regulatory planning and leadership decisions."
  }
];

const productCategories = [
  { title: "Pharmaceuticals", detail: "Prescription, OTC and complex portfolios" },
  { title: "Medical Devices", detail: "Classification, registration and lifecycle" },
  { title: "Food Supplements", detail: "Market pathway and compliance support" },
  { title: "Cosmetics", detail: "Notification, claims and local requirements" },
  { title: "Veterinary Products", detail: "Regulatory planning and market support" }
];

const reasons = [
  [ShieldCheck, "Fully In-House Delivery"],
  [MapPinned, "Local Expertise & Zero Subcontractors"],
  [Network, "Regional Project Management"],
  [BriefcaseBusiness, "Flexible Engagement Models"],
  [Activity, "Integrated Regulatory & PV"],
  [Layers3, "Scalable Delivery"],
  [FileCheck2, "Quality-Driven Execution"],
  [Handshake, "Long-Term Partnership Approach"]
] as const;

const operatingStages = [
  { name: "Strategy", items: ["01 Regulatory Strategy", "02 Regulatory Intelligence"] },
  { name: "Preparation", items: ["03 Classification & Gap Analysis", "04 Dossier Preparation", "05 Publishing"] },
  { name: "Submission", items: ["06 Submission Management", "07 Authority Interaction", "08 Approval"] },
  { name: "Ongoing", items: ["09 Lifecycle Management", "10 MAH / Local Representation", "11 Pharmacovigilance", "12 Dedicated Resource Augmentation"] }
];

export default function HomePage() {
  return (
    <main className="corporate-home">
      <Hero />
      <FeaturedExpertise />

      <section id="business-needs" className="enterprise-section business-needs-section">
        <div className="site-shell">
          <SectionHeading eyebrow="Explore Business Needs" title="Start with the regulatory problem, not the service catalogue." copy="Choose the business situation closest to yours. The pathway connects the decision to the regulatory capabilities needed to move forward." />
          <BusinessNeeds />
        </div>
      </section>

      <section id="markets" className="enterprise-section markets-section">
        <div className="site-shell">
          <div className="section-heading-row">
            <SectionHeading eyebrow="Explore Markets" title="Local intelligence. Regional control. Global consistency." />
            <p>Explore active and upcoming Genedrift markets across Asia Pacific, the Middle East, Africa and CIS.</p>
          </div>
          <MarketExplorer />
        </div>
      </section>

      <section id="intelligence" className="enterprise-section intelligence-section">
        <div className="site-shell">
          <div className="section-heading-row intelligence-heading">
            <SectionHeading eyebrow="Latest Regulatory Intelligence" title="Market change, interpreted for action." />
            <Link className="section-link" href="/insights">View all intelligence <ArrowRight aria-hidden="true" size={17} /></Link>
          </div>
          <div className="intelligence-feed">
            {intelligence.map((item) => (
              <Link href="/insights" key={item.title} className="intelligence-row">
                <div><span>{item.type}</span><small>{item.market}</small></div>
                <h3>{item.title}</h3>
                <time>{item.date}</time>
                <ArrowRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="insights" className="enterprise-section insights-showcase">
        <div className="site-shell">
          <div className="section-heading-row">
            <SectionHeading light eyebrow="Featured Insights" title="Perspectives for confident regulatory decisions." />
            <Link className="section-link section-link-light" href="/insights">Explore the Knowledge Hub <ArrowRight aria-hidden="true" size={17} /></Link>
          </div>
          <div className="editorial-layout">
            <Link href="/insights" className="dominant-insight">
              <div className="insight-visual" aria-hidden="true"><Globe2 /><span>01</span></div>
              <div><span>{insights[0].category}</span><h3>{insights[0].title}</h3><p>{insights[0].excerpt}</p><strong>Read insight <ArrowRight aria-hidden="true" size={17} /></strong></div>
            </Link>
            <div className="supporting-insights">
              {insights.slice(1).map((insight, index) => (
                <Link href="/insights" key={insight.title}>
                  <span>{insight.category}</span><small>0{index + 2}</small><h3>{insight.title}</h3><p>{insight.excerpt}</p><ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="client-success" className="enterprise-section client-success-section">
        <div className="site-shell">
          <SectionHeading eyebrow="Client Success Highlights" title="Complex engagements. Clear operating outcomes." copy="Representative engagement patterns are presented without exposing client-sensitive details or unsupported claims." />
          <div className="case-study-grid">
            {caseStudies.map((item, index) => (
              <article key={item.client}>
                <span>0{index + 1}</span><h3>{item.client}</h3>
                <dl>
                  <div><dt>Context</dt><dd>{item.context}</dd></div>
                  <div><dt>Engagement</dt><dd>{item.engagement}</dd></div>
                  <div><dt>Outcome</dt><dd>{item.outcome}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="enterprise-section product-expertise-section">
        <div className="site-shell product-expertise-layout">
          <SectionHeading eyebrow="Industry / Product Expertise" title="Specialist support across regulated product categories." copy="Category knowledge remains connected to local market requirements, submission pathways and lifecycle obligations." />
          <div className="product-category-list">
            {productCategories.map((item, index) => <article key={item.title}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.detail}</p></div><ArrowRight aria-hidden="true" /></article>)}
            <p className="supporting-types">Supporting experience: Biologics · Biosimilars · Vaccines</p>
          </div>
        </div>
      </section>

      <section id="why-genedrift" className="enterprise-section why-genedrift-section">
        <div className="site-shell">
          <SectionHeading light eyebrow="Why Genedrift" title="A delivery model designed for trust, control and continuity." />
          <div className="proof-matrix">
            {reasons.map(([Icon, title], index) => <article key={title}><span>0{index + 1}</span><Icon aria-hidden="true" /><h3>{title}</h3></article>)}
          </div>
        </div>
      </section>

      <section id="operating-model" className="enterprise-section operating-model-section">
        <div className="site-shell">
          <div className="section-heading-row">
            <SectionHeading eyebrow="Delivery / Operating Model" title="One connected architecture from strategy to ongoing compliance." />
            <p>Genedrift’s operating model keeps regulatory thinking, document preparation, submission management and post-approval activity in one governed pathway.</p>
          </div>
          <div className="operating-architecture">
            {operatingStages.map((stage, index) => (
              <article key={stage.name}>
                <header><span>0{index + 1}</span><h3>{stage.name}</h3></header>
                <ul>{stage.items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="enterprise-section global-presence-section">
        <div className="site-shell global-presence-layout">
          <div>
            <SectionHeading eyebrow="Global Presence" title="Global expertise. Local execution." copy="Regional project management brings market-specific work into one coherent delivery view while preserving local regulatory accountability." />
            <div className="presence-metrics"><div><strong>4</strong><span>Operating regions</span></div><div><strong>30+</strong><span>Priority markets</span></div></div>
          </div>
          <div className="presence-regions">
            {[['APAC', 'India · Singapore · Malaysia · Thailand · Vietnam'], ['Middle East', 'Saudi Arabia · UAE · Qatar · Oman · Kuwait'], ['Africa', 'Nigeria · Kenya · Tanzania · South Africa · Ghana'], ['CIS', 'Kazakhstan · Uzbekistan · Azerbaijan · Kyrgyzstan']].map(([region, countries], index) => <article key={region}><span>0{index + 1}</span><div><h3>{region}</h3><p>{countries}</p></div></article>)}
          </div>
        </div>
      </section>

      <section id="contact" className="expert-cta-section">
        <div className="site-shell expert-cta-layout">
          <div><span className="section-eyebrow">Speak to an Expert</span><h2>Navigate your next regulatory challenge with confidence.</h2></div>
          <div><p>Tell us the market, product category or operating challenge you are planning around. We will help clarify the right path forward.</p><div><Button asChild variant="secondary" size="lg"><a href="mailto:cs@genedrift.com">Speak to an Expert <ArrowRight aria-hidden="true" size={18} /></a></Button><Button asChild variant="dark" size="lg"><a href="mailto:cs@genedrift.com?subject=Request%20a%20Proposal">Request a Proposal</a></Button></div></div>
        </div>
        <Separator className="cta-separator" />
        <div className="site-shell cta-proof-line"><span><Check aria-hidden="true" size={16} /> Direct specialist response</span><span><Check aria-hidden="true" size={16} /> Confidential initial discussion</span><span><Check aria-hidden="true" size={16} /> Market-specific guidance</span></div>
      </section>
    </main>
  );
}

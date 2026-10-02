import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const footerGroups = [
  { title: "Explore", links: [["Business Needs", "/#business-needs"], ["Operating Model", "/#operating-model"]] },
  { title: "Expertise", links: [["Regulatory Affairs", "/#expertise"], ["Pharmacovigilance", "/#expertise"], ["Regulatory Intelligence", "/#intelligence"]] },
  { title: "Markets", links: [["Asia Pacific", "/#markets"], ["Middle East", "/#markets"], ["Africa", "/#markets"], ["CIS", "/#markets"]] },
  { title: "Knowledge Hub", links: [["Regulatory Intelligence", "/#intelligence"], ["Insights", "/insights"], ["Client Success", "/#client-success"]] },
  { title: "Company", links: [["Why Genedrift", "/#why-genedrift"], ["Careers", "mailto:cs@genedrift.com?subject=Careers%20at%20Genedrift"], ["Contact", "/#contact"]] }
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-top">
        <div className="footer-brand-block">
          <Link className="footer-wordmark" href="/">GENEDRIFT</Link>
          <p>Global Expertise.<br />Local Execution.<br />Trusted Delivery.</p>
          <a className="footer-email" href="mailto:cs@genedrift.com">cs@genedrift.com <ArrowUpRight aria-hidden="true" size={16} /></a>
        </div>
        <div className="footer-navigation">
          {footerGroups.map((group) => (
            <div key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(([label, href]) => <Link href={href} key={label}>{label}</Link>)}
            </div>
          ))}
        </div>
      </div>
      <div className="site-shell footer-bottom">
        <p>© 2026 Genedrift. All rights reserved.</p>
        <div>
          <Link href="#">Privacy</Link>
          <Link href="#">Terms</Link>
          <Link href="#">Accessibility</Link>
        </div>
      </div>
    </footer>
  );
}

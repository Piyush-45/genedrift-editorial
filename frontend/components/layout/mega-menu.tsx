import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { NavigationGroup } from "@/data/navigation";

export function MegaMenu({ group, onNavigate }: { group: NavigationGroup; onNavigate: () => void }) {
  return (
    <div className="mega-menu" data-menu={group.id}>
      <div className="mega-menu-intro">
        <span>{group.label}</span>
        <p>{group.description}</p>
      </div>

      <div className="mega-menu-body">
        <div className="mega-menu-sections">
          {group.sections.map((section, index) => (
            <section
              className="mega-menu-section"
              data-priority={section.priority}
              key={section.label ?? `${group.id}-${index}`}
              aria-label={section.label}
            >
              {section.label ? <h2>{section.label}</h2> : null}
              <div className="mega-menu-link-list">
                {section.links.map((link) => (
                  <Link href={link.href} key={link.label} onClick={onNavigate}>
                    <span>{link.label}</span>
                    <ArrowUpRight aria-hidden="true" size={15} />
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {group.footerLink ? (
          <Link className="mega-menu-footer-link" href={group.footerLink.href} onClick={onNavigate}>
            {group.footerLink.label}<ArrowRight aria-hidden="true" size={16} />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

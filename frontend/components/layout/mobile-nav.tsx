import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";
import { navigationGroups, utilityNavigationLinks } from "@/data/navigation";

export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <div className="mobile-nav-groups">
        {navigationGroups.map((group, index) => (
          <details key={group.id} name="mobile-navigation">
            <summary>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {group.label}
              <ChevronDown aria-hidden="true" size={18} />
            </summary>
            <div className="mobile-nav-panel">
              <p>{group.description}</p>
              {group.sections.map((section, sectionIndex) => (
                <div className="mobile-nav-section" key={section.label ?? `${group.id}-${sectionIndex}`}>
                  {section.label ? <strong>{section.label}</strong> : null}
                  {section.links.map((link) => (
                    <SheetClose asChild key={link.label}>
                      <Link href={link.href}>{link.label}</Link>
                    </SheetClose>
                  ))}
                </div>
              ))}
              {group.footerLink ? (
                <SheetClose asChild>
                  <Link className="mobile-nav-footer-link" href={group.footerLink.href}>{group.footerLink.label}</Link>
                </SheetClose>
              ) : null}
            </div>
          </details>
        ))}
      </div>

      <div className="mobile-nav-utility">
        {utilityNavigationLinks.map((link) => (
          <SheetClose asChild key={link.label}>
            <Link href={link.href}>{link.label}</Link>
          </SheetClose>
        ))}
      </div>
    </nav>
  );
}

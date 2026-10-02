"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { DesktopNav } from "@/components/layout/desktop-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { utilityNavigationLinks } from "@/data/navigation";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <div className="header-primary">
          <Link className="wordmark" href="/" aria-label="Genedrift home">GENEDRIFT</Link>
          <DesktopNav />
        </div>

        <div className="header-actions">
          <nav className="header-utilities" aria-label="Utility navigation">
            {utilityNavigationLinks.map((link) => <Link href={link.href} key={link.label}>{link.label}</Link>)}
          </nav>
          <Button asChild size="sm" className="header-cta">
            <Link href="/#contact">Speak to an Expert</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button className="mobile-menu-button" variant="ghost" size="icon" aria-label="Open navigation">
                <Menu aria-hidden="true" size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetTitle>GENEDRIFT</SheetTitle>
              <MobileNav />
              <div className="mobile-nav-footer">
                <p>Global expertise.<br />Local execution.<br />Trusted delivery.</p>
                <SheetClose asChild>
                  <Button asChild><Link href="/#contact">Speak to an Expert</Link></Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const menuGroups = [
  {
    label: "Explore",
    description: "Start with the decision GeneDrift can help you make.",
    links: [
      ["Business needs", "/#business-needs"],
      ["Markets", "/#markets"],
      ["Operating model", "/#operating-model"]
    ]
  },
  {
    label: "Expertise",
    description: "Integrated regulatory and safety capability across the product lifecycle.",
    links: [
      ["Regulatory Affairs", "/#expertise"],
      ["Pharmacovigilance", "/#expertise"],
      ["MAH & Local Representation", "/#expertise"],
      ["Regulatory Intelligence", "/#intelligence"]
    ]
  },
  {
    label: "Markets",
    description: "Local execution across GeneDrift’s priority operating regions.",
    links: [
      ["Asia Pacific", "/#markets"],
      ["Middle East", "/#markets"],
      ["Africa", "/#markets"],
      ["CIS", "/#markets"]
    ]
  },
  {
    label: "Knowledge Hub",
    description: "Decision-ready regulatory intelligence and professional analysis.",
    links: [
      ["Latest intelligence", "/#intelligence"],
      ["Featured insights", "/#insights"],
      ["Insights archive", "/insights"]
    ]
  }
] as const;

const mobileLinks = [
  ["Explore", "/#business-needs"],
  ["Expertise", "/#expertise"],
  ["Markets", "/#markets"],
  ["Knowledge Hub", "/insights"],
  ["Client Success", "/#client-success"],
  ["Company", "/#why-genedrift"],
  ["Careers", "mailto:cs@genedrift.com?subject=Careers%20at%20GeneDrift"]
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link className="wordmark" href="/" aria-label="GeneDrift home">GENEDRIFT</Link>

        <div className="desktop-navigation">
          <NavigationMenu>
            <NavigationMenuList>
              {menuGroups.map((group) => (
                <NavigationMenuItem key={group.label}>
                  <NavigationMenuTrigger>{group.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="mega-menu">
                      <div className="mega-menu-intro">
                        <span>{group.label}</span>
                        <p>{group.description}</p>
                      </div>
                      <div className="mega-menu-links">
                        {group.links.map(([label, href]) => (
                          <NavigationMenuLink asChild key={label}>
                            <Link href={href}>{label}<ArrowUpRight aria-hidden="true" size={16} /></Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link className="nav-direct-link" href="/#client-success">Client Success</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="header-actions">
          <div className="header-utilities" aria-label="Utility navigation">
            <Link href="/#why-genedrift">Company</Link>
            <a href="mailto:cs@genedrift.com?subject=Careers%20at%20GeneDrift">Careers</a>
            <Link className="header-search" href="/insights" aria-label="Search GeneDrift insights"><Search aria-hidden="true" size={18} /></Link>
          </div>
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
              <nav className="mobile-nav" aria-label="Mobile navigation">
                {mobileLinks.map(([label, href], index) => (
                  <SheetClose asChild key={label}>
                    <Link href={href}><span>{String(index + 1).padStart(2, "0")}</span>{label}</Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mobile-nav-footer">
                <p>Global Expertise.<br />Local Execution.<br />Trusted Delivery.</p>
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

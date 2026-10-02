import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
  variable: "--font-instrument-sans",
  fallback: ["Arial", "sans-serif"]
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Genedrift | Global Regulatory Consulting", template: "%s | Genedrift" },
  description:
    "Genedrift helps life-sciences and regulated-product organizations navigate global regulatory complexity with clarity, precision and trusted delivery.",
  openGraph: {
    type: "website",
    siteName: "Genedrift",
    title: "Genedrift | Global Regulatory Consulting",
    description:
      "Enterprise-grade regulatory consulting, intelligence and operating support for global regulated markets."
  },
  twitter: { card: "summary_large_image" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={instrumentSans.variable} data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <div id="main-content" tabIndex={-1}>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

/* Fonts are self-hosted, not fetched from Google at build or at runtime.
   Files come from the @fontsource packages (see package.json devDependencies)
   and are copied into app/fonts/. Nothing about the site depends on a third
   party font CDN — one less external request on a pharma client's site. */

const archivo = localFont({
  src: [{ path: "./fonts/archivo-variable.woff2", style: "normal" }],
  weight: "100 900",
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = localFont({
  src: [
    { path: "./fonts/plex-mono-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/plex-mono-500.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Genedrift",
  description: "Global Regulatory Affairs and Pharmacovigilance across forty-six markets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

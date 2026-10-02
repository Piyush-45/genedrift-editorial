import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RegulatoryAtlas } from "@/components/home/regulatory-atlas";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const heroMetrics = [
  ["1000+", "Regulatory submissions"],
  ["500+", "PV deliverables"],
  ["30+", "Markets supported"],
  ["20+", "MAH markets"]
] as const;

export function Hero() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <Container className="home-hero-inner">
        <div className="home-hero-copy">
          <span className="home-hero-eyebrow">Global regulatory consulting</span>
          <h1 id="home-hero-title">
            Global regulatory expertise.
            <span>Local execution where it matters.</span>
          </h1>
          <p>
            Genedrift helps pharmaceutical, biotechnology, medical-device and life-sciences organizations navigate complex regulatory markets through integrated Regulatory Affairs, Pharmacovigilance, MAH support and Regulatory Intelligence.
          </p>

          <div className="home-hero-actions">
            <Button asChild size="lg" variant="secondary">
              <Link href="#expertise">Explore Our Expertise <ArrowRight aria-hidden="true" size={18} /></Link>
            </Button>
            <Button asChild size="lg" variant="dark">
              <Link href="#markets">Explore Markets <ArrowRight aria-hidden="true" size={18} /></Link>
            </Button>
          </div>

          <Link className="home-hero-discovery" href="#business-needs">
            <span>Not sure where to start?</span>
            <strong>Explore by business need <ArrowRight aria-hidden="true" size={15} /></strong>
          </Link>
        </div>

        <div className="home-hero-visual">
          <RegulatoryAtlas />
        </div>
      </Container>

      <div className="home-hero-metrics">
        <Container>
          <dl>
            {heroMetrics.map(([value, label]) => (
              <div key={label}>
                <dd>{value}</dd>
                <dt>{label}</dt>
              </div>
            ))}
          </dl>
        </Container>
      </div>
    </section>
  );
}

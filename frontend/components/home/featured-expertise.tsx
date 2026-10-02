import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { expertiseItems } from "@/data/expertise";

export function FeaturedExpertise() {
  const [regulatoryAffairs, pharmacovigilance, ...supporting] = expertiseItems;

  return (
    <section id="expertise" className="featured-expertise" aria-labelledby="featured-expertise-title">
      <Container>
        <div className="featured-expertise-heading">
          <SectionHeading
            eyebrow="Featured Expertise"
            title="Integrated expertise across the regulatory lifecycle."
            titleId="featured-expertise-title"
            copy="Strategic interpretation and hands-on execution stay connected, so each market decision has a clear pathway and accountable owner."
            className="featured-expertise-intro"
          />
          <Link className="featured-expertise-all" href="#contact">
            Explore all expertise <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        <div className="expertise-editorial-grid">
          {[regulatoryAffairs, pharmacovigilance].map((item, index) => {
            const Icon = item.icon;
            return (
              <article className={index === 1 ? "expertise-lead expertise-lead-dark" : "expertise-lead"} key={item.title}>
                <header>
                  <span>{item.number}</span>
                  <Icon aria-hidden="true" />
                </header>
                <div>
                  <p>Core capability</p>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
                <Link href="#contact">Explore capability <ArrowRight aria-hidden="true" size={17} /></Link>
              </article>
            );
          })}
        </div>

        <div className="expertise-index">
          {supporting.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title}>
                <header><span>{item.number}</span><Icon aria-hidden="true" /></header>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <Link href="#contact" aria-label={`Explore ${item.title}`}><ArrowRight aria-hidden="true" size={17} /></Link>
              </article>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

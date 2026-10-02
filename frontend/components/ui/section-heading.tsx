import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  titleId,
  copy,
  light = false,
  className
}: {
  eyebrow: string;
  title: string;
  titleId?: string;
  copy?: string;
  light?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("section-intro", light && "section-intro-light", className)}>
      <span className="section-eyebrow">{eyebrow}</span>
      <h2 id={titleId}>{title}</h2>
      {copy ? <p>{copy}</p> : null}
    </div>
  );
}

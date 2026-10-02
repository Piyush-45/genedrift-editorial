"use client";

import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, X, Plus, Minus } from "lucide-react";
import s from "./studio.module.css";

const concepts = [
  { name: "LF20 Conservative Enterprise", short: "Enterprise", idea: "The regulatory atlas", description: "A composed, institutional introduction. A deep-purple canvas and a geographic atlas make international complexity feel organised and navigable.", type: "Precise neo-grotesque", colour: "Deep purple / white / lavender", mobile: "The headline leads; the atlas and region selector stack beneath it. Capabilities become a single-column list.", best: "Immediate corporate confidence", tradeoff: "The most familiar direction; the atlas must remain carefully edited." },
  { name: "LF20 Editorial Intelligence", short: "Editorial", idea: "The intelligence briefing", description: "A bright, authoritative front page. An editorial briefing turns regulatory information into a visible sequence: understand, interpret, act.", type: "Editorial sans / fine rules / compact labels", colour: "White / primary purple / soft lavender", mobile: "The positioning and calls to action come first, followed by a readable briefing. The framework keeps its labels without a wide table.", best: "Making expertise tangible", tradeoff: "Needs a strong editorial programme to keep the full website compelling." },
  { name: "Independent Premium Advisory", short: "Advisory", idea: "A clear path forward", description: "An expressive, spacious introduction for a specialist advisory firm. Oversized serif typography meets an architectural pathway from ambition to market presence.", type: "Refined serif / restrained sans", colour: "Lavender-white / aubergine / primary purple", mobile: "The large statement scales down naturally. The horizontal pathway becomes a vertical sequence, keeping every stage readable.", best: "A distinctive premium identity", tradeoff: "The serif typography is a deliberate departure from the LF20 sans-serif convention." },
];
const capabilities = [
  ["Regulatory Affairs", "From a clear strategy to a complete submission."],
  ["Pharmacovigilance", "Safety oversight throughout the product lifecycle."],
  ["MAH & Local Representation", "The local structure behind your market presence."],
];
const regions = [
  { name: "Asia Pacific", code: "APAC", countries: "India · Singapore · Thailand · Vietnam", ids: ["356", "702", "764", "704", "458", "360", "608", "158", "344", "116", "104", "144", "586", "096"] },
  { name: "Middle East", code: "ME", countries: "Saudi Arabia · UAE · Qatar · Oman", ids: ["682", "784", "634", "512", "414", "048"] },
  { name: "Africa", code: "AFR", countries: "Nigeria · Kenya · South Africa · Ghana", ids: ["566", "404", "710", "288", "834", "686", "384"] },
  { name: "CIS", code: "CIS", countries: "Kazakhstan · Uzbekistan · Azerbaijan", ids: ["398", "860", "031", "417"] },
];
const menuGroups = [
  { name: "Explore", intro: "Start with your business ambition.", items: [["Enter a new market", "/#business-needs"], ["Register a product", "/#business-needs"], ["Build regulatory capacity", "/#business-needs"]] },
  { name: "Expertise", intro: "Specialist thinking. Connected delivery.", items: [["Regulatory Affairs", "/#expertise"], ["Pharmacovigilance", "/#expertise"], ["MAH & Local Representation", "/#expertise"], ["Regulatory Intelligence", "/#intelligence"], ["Managed Regulatory Services", "/#expertise"], ["Dedicated Regulatory Teams", "/#expertise"]] },
  { name: "Markets", intro: "Understand the local context.", items: regions.map(r => [r.name, "/#markets"]) },
  { name: "Knowledge Hub", intro: "Perspective for your next decision.", items: [["Featured Insights", "/insights"], ["Regulatory Updates", "/insights"], ["Country Intelligence", "/insights"]] },
  { name: "Company", intro: "Get to know GeneDrift.", items: [["About GeneDrift", "/#why-genedrift"], ["Client Success", "/#client-success"], ["Global Presence", "/#markets"], ["Careers", "mailto:cs@genedrift.com?subject=Careers%20at%20GeneDrift"], ["Contact", "/#contact"]] },
];

function Actions({ primary = "Speak to an expert", secondary = "Explore our expertise" }: { primary?: string; secondary?: string }) {
  return <div className={s.actions}><a className={s.primary} href="/#contact">{primary}<ArrowUpRight size={18} aria-hidden /></a><a className={s.secondary} href="#concept-expertise">{secondary}<ArrowRight size={18} aria-hidden /></a></div>;
}

function Navigation({ variant }: { variant: number }) {
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileButton = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(null); setMobile(false); };
  return <header className={s.nav} onKeyDown={event => {
    if (event.key === "Escape") {
      if (open !== null) { buttons.current[open]?.focus(); setOpen(null); }
      else { setMobile(false); mobileButton.current?.focus(); }
    }
  }} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}>
    {variant === 1 && <div className={s.utility}><span>REGULATORY THINKING. REAL-WORLD DIRECTION.</span><a href="/#client-success">Client Success ↗</a><a href="mailto:cs@genedrift.com?subject=Careers%20at%20GeneDrift">Careers ↗</a></div>}
    <div className={s.navRow}>
      <a href="/" aria-label="GeneDrift home" className={s.brand}>GeneDrift<span className={s.brandDot}>®</span></a>
      <button ref={mobileButton} className={s.mobileToggle} aria-expanded={mobile} aria-controls="concept-navigation" onClick={() => { setMobile(!mobile); setOpen(null); }}>{mobile ? <X aria-hidden /> : <Menu aria-hidden />}<span>{mobile ? "Close" : "Menu"}</span></button>
      <nav id="concept-navigation" aria-label="Website navigation" className={`${s.navLinks} ${mobile ? s.mobileOpen : ""}`}>
        {menuGroups.map((group, index) => <div className={s.navItem} key={group.name}>
          <button ref={element => { buttons.current[index] = element; }} aria-expanded={open === index} aria-controls={`concept-menu-${index}`} onClick={() => setOpen(open === index ? null : index)}>{group.name}<ChevronDown size={12} aria-hidden /></button>
          {open === index && <div id={`concept-menu-${index}`} className={s.mega}><div><span className={s.eyebrow}>{group.name}</span><p>{group.intro}</p></div><div>{group.items.map(([label, href]) => <a key={label} href={href} onClick={close}>{label}<ArrowUpRight size={16} aria-hidden /></a>)}</div></div>}
        </div>)}
        <a href="/#contact" className={s.navContact}>Let’s talk <ArrowUpRight size={16} aria-hidden /></a>
      </nav>
    </div>
  </header>;
}

function Atlas({ map }: { map: { id: string; d: string }[] }) {
  const [region, setRegion] = useState(0);
  const selected = regions[region];
  return <figure className={s.atlas}>
    <div className={s.atlasHeading}><span>MARKET PERSPECTIVE</span><span>01 — 04</span></div>
    <svg viewBox="0 0 800 425" role="img" aria-label={`World map highlighting ${selected.name} markets listed in the design brief`}>
      <g fill="none" stroke="#8275a5" strokeWidth=".5" opacity=".3"><path d="M15 105H785M15 210H785M15 315H785M200 20V400M400 20V400M600 20V400" /></g>
      {map.map(country => <path key={country.id} d={country.d} fill={selected.ids.includes(country.id) ? "#c1b2ff" : "#443468"} stroke="#241653" strokeWidth=".65" />)}
    </svg>
    <figcaption className={s.atlasCaption} aria-live="polite"><span className={s.legendDot} /><div><strong>{selected.name}</strong><p>{selected.countries}</p></div><span className={s.atlasIndex}>0{region + 1}</span></figcaption>
    <div className={s.regionControls} aria-label="Choose map region">{regions.map((item, index) => <button key={item.code} aria-pressed={region === index} onClick={() => setRegion(index)}>{item.code}<span>{region === index ? "−" : "+"}</span></button>)}</div>
    <small className={s.atlasNote}>Highlighted: markets in the regional brief. Illustrative geography.</small>
  </figure>;
}

function Enterprise({ map }: { map: { id: string; d: string }[] }) {
  return <><section className={s.enterpriseHero} aria-labelledby="concept-title">
    <div className={s.enterpriseCopy}><span className={s.eyebrow}>GLOBAL REGULATORY & LIFE-SCIENCES CONSULTING</span><h1 id="concept-title">A world of complexity.<br /><em>One clear direction.</em></h1><p>Navigate new markets with regulatory strategy, local intelligence and specialist execution working together.</p><Actions /><a className={s.discovery} href="/#business-needs">Your ambition is the starting point <ArrowRight size={16} aria-hidden /></a></div>
    <Atlas map={map} />
    <div className={s.enterpriseBase}><span>GLOBAL PERSPECTIVE.<br /><b>LOCAL UNDERSTANDING.</b></span><p>Asia Pacific</p><p>Middle East</p><p>Africa</p><p>CIS</p></div>
  </section></>;
}

function Editorial() {
  const [expanded, setExpanded] = useState(0);
  const entries = [
    ["01", "Understand the landscape", "Map product classification, local requirements and the evidence you already hold."],
    ["02", "Interpret the implications", "Connect the market context to your portfolio, operating model and launch priorities."],
    ["03", "Shape the next move", "Turn those findings into a coordinated regulatory roadmap and delivery plan."],
  ];
  return <section className={s.editorialHero} aria-labelledby="concept-title">
    <div className={s.editorialTop}><span className={s.eyebrow}>THE VALUE OF A CLEARER PERSPECTIVE</span><span>GENEDRIFT / INTELLIGENCE INTO ACTION</span></div>
    <div className={s.editorialGrid}><div className={s.editorialCopy}><h1 id="concept-title">See the change.<br />Understand<br /><em>what comes next.</em></h1><p>Regulatory intelligence becomes valuable when it shapes a better decision. We connect market understanding with the expertise to act.</p><Actions primary="Discuss your next move" secondary="Discover our expertise" /><div className={s.editorialFoot}><span>Perspective → Strategy → Execution</span><a href="/insights">Visit the Knowledge Hub <ArrowUpRight size={15} aria-hidden /></a></div></div>
    <article className={s.briefing}><header><span>THE GENEDRIFT PERSPECTIVE</span><span>FIELDNOTES / 01</span></header><div className={s.briefingTitle}><span>MARKET ENTRY</span><h2>Before the first submission,<br />ask the right questions.</h2></div>
      <div className={s.matrix} role="img" aria-label="A planning framework connecting evidence, market context and delivery. These are planning dimensions, not scored market data."><div className={s.matrixAxis}>MARKET CONTEXT</div><div className={s.matrixCells}><span>Product<br /><b>classification</b></span><span>Local<br /><b>requirements</b></span><span>Evidence<br /><b>readiness</b></span><span>Delivery<br /><b>pathway</b></span></div><div className={s.matrixBottom}>EVIDENCE → DECISION</div></div>
      <div className={s.briefingSteps}>{entries.map(([number, title, copy], index) => <div key={number}><button aria-expanded={expanded === index} aria-controls={`briefing-${index}`} onClick={() => setExpanded(expanded === index ? -1 : index)}><span>{number}</span>{title}{expanded === index ? <Minus size={16} aria-hidden /> : <Plus size={16} aria-hidden />}</button>{expanded === index && <p id={`briefing-${index}`}>{copy}</p>}</div>)}</div>
      <footer>A framework for your next market conversation.</footer>
    </article></div>
  </section>;
}

function Advisory() {
  return <section className={s.advisoryHero} aria-labelledby="concept-title"><div className={s.advisoryLead}><span className={s.eyebrow}>INDEPENDENT THINKING.<br />CONNECTED EXPERTISE.</span><span className={s.advisoryCorner}>LIFE SCIENCES<br />WITHOUT LIMITING YOUR AMBITION.</span></div>
    <h1 id="concept-title">The ambition is yours.<br /><em>The way forward,</em><span className={s.advisoryLast}> together.<ArrowUpRight strokeWidth={.65} aria-hidden /></span></h1>
    <div className={s.advisoryBottom}><div className={s.advisoryCopy}><p>From a new-market ambition to a lasting local presence. GeneDrift brings the regulatory judgement and specialist execution to help you move forward.</p><Actions primary="Start a conversation" secondary="Our expertise" /></div><div className={s.pathway}><span className={s.eyebrow}>A CONNECTED PATH TO MARKET</span><ol><li><span>01</span><b>Understand</b><small>Market & evidence</small></li><li><span>02</span><b>Navigate</b><small>Strategy & submission</small></li><li><span>03</span><b>Sustain</b><small>Presence & compliance</small></li></ol></div></div>
  </section>;
}

function Continuation({ variant }: { variant: number }) {
  return <section id="concept-expertise" className={s.continuation}><div className={s.continuationHeading}><span className={s.eyebrow}>01 / FEATURED EXPERTISE</span><h2>{variant === 0 ? "Specialist expertise. One connected team." : variant === 1 ? "Intelligence is only the beginning." : "Deep expertise. A wider perspective."}</h2><a href="/#expertise">Explore all expertise <ArrowUpRight size={17} aria-hidden /></a></div><div className={s.capabilities}>{capabilities.map(([title, copy], index) => <a href="/#expertise" key={title}><span>0{index + 1}<ArrowUpRight size={20} aria-hidden /></span><h3>{title}</h3><p>{copy}</p></a>)}</div></section>;
}

export function ConceptStudio({ map }: { map: { id: string; d: string }[] }) {
  const [variant, setVariant] = useState(0);
  const [notes, setNotes] = useState(false);
  return <main className={s.studio} data-genedrift-concepts>
    <div className={s.studioBar}><a href="#comparison" className={s.studioLabel}>GENEDRIFT <span>DESIGN STUDY / PHASE 02</span></a><div className={s.switcher} aria-label="Choose hero concept">{concepts.map((concept, index) => <button key={concept.short} aria-pressed={variant === index} onClick={() => setVariant(index)}><span>0{index + 1}</span>{concept.short}</button>)}</div><button className={s.notesToggle} aria-expanded={notes} aria-controls="direction-notes" onClick={() => setNotes(!notes)}>{notes ? "Hide notes" : "Design notes"}<Plus size={14} aria-hidden /></button></div>
    {notes && <aside id="direction-notes" className={s.directionNotes}><strong>{concepts[variant].name}</strong><p>{concepts[variant].description}</p><span>Type: {concepts[variant].type} · {concepts[variant].colour}</span><p>{concepts[variant].mobile}</p></aside>}
    <div className={`${s.canvas} ${[s.enterprise, s.editorial, s.advisory][variant]}`} key={variant}>
      <Navigation variant={variant} />
      {variant === 0 ? <Enterprise map={map} /> : variant === 1 ? <Editorial /> : <Advisory />}
      <Continuation variant={variant} />
    </div>
    <section id="comparison" className={s.comparison}><div className={s.comparisonIntro}><span className={s.eyebrow}>THREE IDEAS. ONE GENEDRIFT.</span><h2>Choose the first impression.</h2><p>Each direction includes a working navigation treatment, responsive hero and the opening of Featured Expertise. The complete homepage follows after selection.</p></div><div className={s.comparisonGrid}>{concepts.map((concept, index) => <article key={concept.name}><span className={s.comparisonNumber}>0{index + 1}</span><h3>{concept.name}</h3><strong>{concept.idea}</strong><p>{concept.description}</p><dl><dt>Strongest at</dt><dd>{concept.best}</dd><dt>Consideration</dt><dd>{concept.tradeoff}</dd></dl><button onClick={() => { setVariant(index); window.scrollTo({ top: 0, behavior: "instant" }); }}>View this direction<ArrowUpRight size={17} aria-hidden /></button></article>)}</div><div className={s.recommendation}><span>OUR RECOMMENDATION / 02</span><p><strong>LF20 Editorial Intelligence.</strong> It shows how GeneDrift thinks, gives the Knowledge Hub a clear purpose, and feels distinctive while staying closest to the client’s typography and colour system.</p></div><p className={s.studyNote}>Design study · Proposed copy for review. Navigation uses existing website destinations while the full information architecture awaits implementation. No live regulatory feed or performance claims are represented.</p></section>
  </main>;
}

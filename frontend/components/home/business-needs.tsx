"use client";

import { ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const needs = [
  ["enter-market", "Enter a New Market", "Market-entry pathway", "Clarify classification, local representation, evidence and submission requirements before committing resources.", ["Regulatory strategy", "Market intelligence", "MAH / local representation"]],
  ["commercialize", "Register or Commercialize a Product", "Registration pathway", "Build a registration plan that coordinates dossier readiness, local requirements and authority engagement.", ["Classification & gap analysis", "Dossier preparation", "Submission management"]],
  ["representation", "Establish Local Representation / MAH", "Operating pathway", "Set up accountable in-country representation with clear governance, oversight and lifecycle responsibilities.", ["MAH assessment", "Local representation", "Governance model"]],
  ["pv", "Build Pharmacovigilance Compliance", "Safety pathway", "Design a scalable pharmacovigilance model aligned to the market, product portfolio and reporting obligations.", ["PV system design", "Case and signal readiness", "Local safety oversight"]],
  ["lifecycle", "Manage a Product Lifecycle Change", "Lifecycle pathway", "Coordinate variations, renewals and post-approval commitments across connected markets and stakeholders.", ["Change assessment", "Dossier updates", "Authority coordination"]],
  ["submission", "Prepare for a Regulatory Submission", "Submission pathway", "Move from evidence and document gaps to a controlled, publishing-ready submission package.", ["Gap analysis", "Dossier preparation", "Publishing readiness"]],
  ["challenge", "Resolve a Regulatory Challenge", "Recovery pathway", "Diagnose the issue, establish regulatory options and bring the right local expertise into the response.", ["Issue assessment", "Authority interaction", "Remediation plan"]],
  ["evaluate", "Evaluate a New Market, Partnership or Acquisition", "Decision pathway", "Translate regulatory exposure into decision-ready commercial and operating insight.", ["Regulatory due diligence", "Market feasibility", "Risk and pathway mapping"]]
] as const;

function PathwayPanel({ need }: { need: (typeof needs)[number] }) {
  return (
    <div className="need-pathway-panel">
      <span>{need[2]}</span>
      <h3>{need[1]}</h3>
      <p>{need[3]}</p>
      <ul>{need[4].map((item) => <li key={item}>{item}</li>)}</ul>
      <a href="#contact">Discuss this need <ArrowRight aria-hidden="true" size={17} /></a>
    </div>
  );
}

export function BusinessNeeds() {
  return (
    <>
      <Tabs className="business-needs-desktop" defaultValue={needs[0][0]} orientation="vertical">
        <TabsList aria-label="Business needs">
          {needs.map((need, index) => (
            <TabsTrigger value={need[0]} key={need[0]}><span>{String(index + 1).padStart(2, "0")}</span>{need[1]}</TabsTrigger>
          ))}
        </TabsList>
        <div className="business-needs-content">
          {needs.map((need) => <TabsContent value={need[0]} key={need[0]}><PathwayPanel need={need} /></TabsContent>)}
        </div>
      </Tabs>
      <Accordion className="business-needs-mobile" type="single" defaultValue={needs[0][0]} collapsible>
        {needs.map((need, index) => (
          <AccordionItem value={need[0]} key={need[0]}>
            <AccordionTrigger><span>{String(index + 1).padStart(2, "0")}</span>{need[1]}</AccordionTrigger>
            <AccordionContent><PathwayPanel need={need} /></AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}

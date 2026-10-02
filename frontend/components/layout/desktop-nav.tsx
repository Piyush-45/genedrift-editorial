"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { MegaMenu } from "@/components/layout/mega-menu";
import { navigationGroups } from "@/data/navigation";

const panelId = "genedrift-mega-menu";

export function DesktopNav() {
  const [activeId, setActiveId] = React.useState<(typeof navigationGroups)[number]["id"]>("explore");
  const [isOpen, setIsOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const activeGroup = navigationGroups.find((group) => group.id === activeId) ?? navigationGroups[0];

  const closeMenu = React.useCallback(() => setIsOpen(false), []);

  React.useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) closeMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMenu();
      triggerRefs.current[navigationGroups.findIndex((group) => group.id === activeId)]?.focus();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeId, closeMenu, isOpen]);

  function openGroup(groupId: (typeof navigationGroups)[number]["id"]) {
    if (isOpen && activeId === groupId) {
      closeMenu();
      return;
    }
    setActiveId(groupId);
    setIsOpen(true);
  }

  function moveTrigger(currentIndex: number, offset: number) {
    const nextIndex = (currentIndex + offset + navigationGroups.length) % navigationGroups.length;
    triggerRefs.current[nextIndex]?.focus();
    if (isOpen) setActiveId(navigationGroups[nextIndex].id);
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTrigger(index, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTrigger(index, -1);
    } else if (event.key === "Home") {
      event.preventDefault();
      triggerRefs.current[0]?.focus();
      if (isOpen) setActiveId(navigationGroups[0].id);
    } else if (event.key === "End") {
      event.preventDefault();
      triggerRefs.current[navigationGroups.length - 1]?.focus();
      if (isOpen) setActiveId(navigationGroups[navigationGroups.length - 1].id);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveId(navigationGroups[index].id);
      setIsOpen(true);
      window.requestAnimationFrame(() => panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus());
    }
  }

  return (
    <div className="desktop-nav" ref={rootRef}>
      <nav aria-label="Primary navigation">
        <ul className="desktop-nav-list">
          {navigationGroups.map((group, index) => {
            const expanded = isOpen && activeId === group.id;
            return (
              <li key={group.id}>
                <button
                  aria-controls={panelId}
                  aria-expanded={expanded}
                  className="desktop-nav-trigger"
                  data-state={expanded ? "open" : "closed"}
                  onClick={() => openGroup(group.id)}
                  onKeyDown={(event) => handleTriggerKeyDown(event, index)}
                  ref={(node) => { triggerRefs.current[index] = node; }}
                  type="button"
                >
                  {group.label}<ChevronDown aria-hidden="true" size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div
        aria-hidden={!isOpen}
        className="desktop-mega-menu-position"
        data-open={isOpen}
        id={panelId}
        ref={panelRef}
      >
        <div className="desktop-mega-menu-surface" key={activeGroup.id}>
          <MegaMenu group={activeGroup} onNavigate={closeMenu} />
        </div>
      </div>
    </div>
  );
}

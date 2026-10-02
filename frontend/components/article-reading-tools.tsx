"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy, Mail, Share2 } from "lucide-react";

export type ArticleHeading = {
  id: string;
  label: string;
  level: 2 | 3;
};

export function ArticleProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const article = document.querySelector<HTMLElement>("[data-article-body]");
      if (!article) return;
      const start = article.offsetTop;
      const distance = Math.max(article.offsetHeight - window.innerHeight, 1);
      const next = Math.min(100, Math.max(0, ((window.scrollY - start) / distance) * 100));
      setProgress(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="article-progress" aria-hidden="true">
      <span style={{ width: `${progress}%` }} />
    </div>
  );
}

export function ArticleToc({ headings }: { headings: ArticleHeading[] }) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px", threshold: [0, 1] }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) return null;

  const links = headings.map((heading) => (
    <li key={heading.id} className={heading.level === 3 ? "article-toc-child" : undefined}>
      <a className={activeId === heading.id ? "is-active" : undefined} href={`#${heading.id}`}>
        {heading.label}
      </a>
    </li>
  ));

  return (
    <>
      <nav className="article-toc article-toc-desktop" aria-label="On this page">
        <p>In this insight</p>
        <ol>{links}</ol>
      </nav>
      <details className="article-toc-mobile">
        <summary>
          <span>In this insight</span>
          <small>{headings.length} {headings.length === 1 ? "section" : "sections"}</small>
          <ChevronDown aria-hidden="true" size={18} />
        </summary>
        <nav aria-label="On this page"><ol>{links}</ol></nav>
      </details>
    </>
  );
}

export function ArticleShare({ title }: { title: string }) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">("idle");
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function share() {
    if (navigator.share) {
      await navigator.share({ title, url: window.location.href }).catch(() => undefined);
      return;
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
    window.setTimeout(() => setCopyStatus("idle"), 1800);
  }

  return (
    <div className="article-share" aria-label="Share this insight">
      <span>Share</span>
      <button type="button" onClick={share} aria-label="Share this insight">
        <Share2 aria-hidden="true" size={17} />
      </button>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
      >
        <b className="linkedin-mark" aria-hidden="true">in</b>
      </a>
      <a href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`} aria-label="Share by email">
        <Mail aria-hidden="true" size={17} />
      </a>
      <button type="button" onClick={copy} aria-label="Copy article link">
        {copyStatus === "copied" ? <Check aria-hidden="true" size={17} /> : <Copy aria-hidden="true" size={17} />}
      </button>
      <small aria-live="polite">
        {copyStatus === "copied" ? "Link copied" : copyStatus === "error" ? "Copy failed" : ""}
      </small>
    </div>
  );
}

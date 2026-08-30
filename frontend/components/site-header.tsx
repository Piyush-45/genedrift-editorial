import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="GeneDrift home">
          <span className="brand-mark" aria-hidden="true">G</span>
          <span>GeneDrift</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          <Link href="/insights">Insights</Link>
          <a href="#about">About</a>
        </nav>
      </div>
    </header>
  );
}

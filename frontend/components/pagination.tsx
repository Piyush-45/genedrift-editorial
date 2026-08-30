import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  query: string;
  category: string;
  tag: string;
};

function pageUrl(page: number, query: string, category: string, tag: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  const suffix = params.toString();
  return `/insights${suffix ? `?${suffix}` : ""}`;
}

export function Pagination({ page, totalPages, query, category, tag }: Props) {
  if (totalPages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Article pages">
      {page > 1 ? <Link className="button button-quiet" href={pageUrl(page - 1, query, category, tag)}>← Newer</Link> : <span />}
      <span>Page {page} of {totalPages}</span>
      {page < totalPages ? <Link className="button button-quiet" href={pageUrl(page + 1, query, category, tag)}>Older →</Link> : <span />}
    </nav>
  );
}

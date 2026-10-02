import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";

type Props = {
  query: string;
  category: string;
  tag: string;
  categories: string[];
};

export function ArticleFilters({ query, category, tag, categories }: Props) {
  return (
    <form className="filters" action="/insights" role="search">
      <label className="search-field">
        <span>Search the archive</span>
        <div className="filter-control">
          <Search aria-hidden="true" size={17} />
          <input name="q" type="search" defaultValue={query} placeholder="Markets, authorities, regulations…" />
        </div>
      </label>
      <label className="select-field">
        <span>Filter by subject</span>
        <div className="filter-control">
          <SlidersHorizontal aria-hidden="true" size={16} />
          <select name="category" defaultValue={category}>
            <option value="">All subjects</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </label>
      {tag ? <input type="hidden" name="tag" value={tag} /> : null}
      <div className="filter-actions">
        <button className="button button-primary" type="submit">Show insights</button>
        {(query || category || tag) ? (
          <Link className="button button-quiet" href="/insights"><X aria-hidden="true" size={15} /> Clear</Link>
        ) : null}
      </div>
    </form>
  );
}

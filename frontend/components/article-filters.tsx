import Link from "next/link";

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
        <span className="sr-only">Search insights</span>
        <input name="q" type="search" defaultValue={query} placeholder="Search regulatory intelligence" />
      </label>
      <label className="select-field">
        <span className="sr-only">Filter by category</span>
        <select name="category" defaultValue={category}>
          <option value="">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      {tag ? <input type="hidden" name="tag" value={tag} /> : null}
      <button className="button button-primary" type="submit">Apply</button>
      {(query || category || tag) ? <Link className="button button-quiet" href="/insights">Clear</Link> : null}
    </form>
  );
}

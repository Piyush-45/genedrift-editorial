export function formatPublishedDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

export function categoryPath(category: string): string {
  return `/insights?category=${encodeURIComponent(category)}`;
}

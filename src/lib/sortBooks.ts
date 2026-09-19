import type { Book } from "@/hooks/useBooks";

// How the main (category-grouped) list is ordered. A user preference chosen in
// Settings and kept in localStorage. The timed views (Upcoming / Published)
// always sort by publish date and ignore this.

export type SortValue =
  | "added-desc"
  | "added-asc"
  | "pub-desc"
  | "pub-asc"
  | "author-asc"
  | "author-desc"
  | "title-asc"
  | "title-desc";

export const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "added-desc", label: "Date added (newest first)" },
  { value: "added-asc", label: "Date added (oldest first)" },
  { value: "pub-desc", label: "Publish date (newest first)" },
  { value: "pub-asc", label: "Publish date (oldest first)" },
  { value: "author-asc", label: "Author (A–Z)" },
  { value: "author-desc", label: "Author (Z–A)" },
  { value: "title-asc", label: "Title (A–Z)" },
  { value: "title-desc", label: "Title (Z–A)" },
];

const KEY = "books-sort";
export const DEFAULT_SORT: SortValue = "added-desc";

export function getSort(): SortValue {
  const raw = localStorage.getItem(KEY) as SortValue | null;
  return SORT_OPTIONS.some((o) => o.value === raw) ? (raw as SortValue) : DEFAULT_SORT;
}

export function setSort(sort: SortValue) {
  localStorage.setItem(KEY, sort);
  window.dispatchEvent(new Event("books-sort-changed"));
}

// Case-insensitive text compare; empty/null values always sort last.
function textCmp(a: string | null, b: string | null, dir: 1 | -1): number {
  const av = a?.trim() ?? "";
  const bv = b?.trim() ?? "";
  if (!av && !bv) return 0;
  if (!av) return 1;
  if (!bv) return -1;
  return dir * av.localeCompare(bv, undefined, { sensitivity: "base" });
}

// Same idea for dates (ISO strings sort lexicographically); missing dates last.
function dateCmp(a: string | null, b: string | null, dir: 1 | -1): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return dir * a.localeCompare(b);
}

export function sortBooks(books: Book[], sort: SortValue): Book[] {
  const arr = [...books];
  switch (sort) {
    case "added-asc":
      return arr.sort((a, b) => dateCmp(a.created_at, b.created_at, 1));
    case "added-desc":
      return arr.sort((a, b) => dateCmp(a.created_at, b.created_at, -1));
    case "pub-asc":
      return arr.sort((a, b) => dateCmp(a.pub_date, b.pub_date, 1));
    case "pub-desc":
      return arr.sort((a, b) => dateCmp(a.pub_date, b.pub_date, -1));
    case "author-asc":
      return arr.sort((a, b) => textCmp(a.author, b.author, 1));
    case "author-desc":
      return arr.sort((a, b) => textCmp(a.author, b.author, -1));
    case "title-asc":
      return arr.sort((a, b) => textCmp(a.title, b.title, 1));
    case "title-desc":
      return arr.sort((a, b) => textCmp(a.title, b.title, -1));
    default:
      return arr;
  }
}

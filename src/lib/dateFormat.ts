import { format, parseISO } from "date-fns";

// pub_date is stored as a real date (ISO "yyyy-MM-dd"). How it *displays* is a
// user preference, chosen in Settings and kept in localStorage.

export const DATE_FORMATS: { value: string; label: string; example: string }[] = [
  { value: "MMM yyyy", label: "Month + Year (short)", example: "Sep 2026" },
  { value: "MMMM yyyy", label: "Month + Year (long)", example: "September 2026" },
  { value: "yyyy", label: "Year only", example: "2026" },
  { value: "MMM d, yyyy", label: "Full date (short)", example: "Sep 18, 2026" },
  { value: "MMMM d, yyyy", label: "Full date (long)", example: "September 18, 2026" },
  { value: "M/d/yyyy", label: "Numeric", example: "9/18/2026" },
];

const KEY = "books-date-format";
export const DEFAULT_DATE_FORMAT = "MMM yyyy";

export function getDateFormat(): string {
  return localStorage.getItem(KEY) || DEFAULT_DATE_FORMAT;
}

export function setDateFormat(fmt: string) {
  localStorage.setItem(KEY, fmt);
  // Let open views re-render (e.g. Settings + list in different tabs/panes).
  window.dispatchEvent(new Event("books-date-format-changed"));
}

export function formatPubDate(value?: string | null, fmt?: string): string {
  if (!value) return "";
  try {
    const d = value.length <= 10 ? parseISO(value) : new Date(value);
    return format(d, fmt || getDateFormat());
  } catch {
    return value; // fall back to raw string if it isn't a parseable date
  }
}

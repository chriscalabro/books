// How many book cards sit in a row on desktop (grid view). A user preference,
// chosen in Settings and kept in localStorage. Only applies at the `lg`
// breakpoint and up; smaller screens use fixed responsive columns.

const KEY = "books-grid-cols";
export const MIN_GRID_COLS = 3;
export const MAX_GRID_COLS = 9;
export const DEFAULT_GRID_COLS = 6;

export function getGridCols(): number {
  const raw = Number(localStorage.getItem(KEY));
  if (!Number.isFinite(raw) || raw < MIN_GRID_COLS || raw > MAX_GRID_COLS) {
    return DEFAULT_GRID_COLS;
  }
  return Math.round(raw);
}

export function setGridCols(n: number) {
  localStorage.setItem(KEY, String(n));
  // Let open views re-render (Settings + list, possibly in different panes).
  window.dispatchEvent(new Event("books-grid-cols-changed"));
}

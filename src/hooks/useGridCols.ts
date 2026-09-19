import { useEffect, useState } from "react";
import { getGridCols } from "@/lib/gridCols";

// Re-renders consumers whenever the chosen desktop column count changes.
export function useGridCols() {
  const [cols, setCols] = useState(getGridCols());
  useEffect(() => {
    const update = () => setCols(getGridCols());
    window.addEventListener("books-grid-cols-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("books-grid-cols-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return cols;
}

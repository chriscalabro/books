import { useEffect, useState } from "react";
import { getSort } from "@/lib/sortBooks";

// Re-renders consumers whenever the chosen sort order changes.
export function useSort() {
  const [sort, setSort] = useState(getSort());
  useEffect(() => {
    const update = () => setSort(getSort());
    window.addEventListener("books-sort-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("books-sort-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return sort;
}

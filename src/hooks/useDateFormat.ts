import { useEffect, useState } from "react";
import { getDateFormat } from "@/lib/dateFormat";

// Re-renders consumers whenever the chosen date format changes.
export function useDateFormat() {
  const [fmt, setFmt] = useState(getDateFormat());
  useEffect(() => {
    const update = () => setFmt(getDateFormat());
    window.addEventListener("books-date-format-changed", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("books-date-format-changed", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return fmt;
}

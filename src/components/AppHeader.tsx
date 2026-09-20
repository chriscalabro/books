import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookMarked, Settings as SettingsIcon } from "lucide-react";

export default function AppHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <BookMarked className="h-5 w-5 text-primary" />
          Books
        </Link>
        <div className="flex items-center gap-1">
          {location.pathname !== "/settings" ? (
            <Button variant="ghost" size="icon" asChild aria-label="Settings">
              <Link to="/settings">
                <SettingsIcon className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">Done</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

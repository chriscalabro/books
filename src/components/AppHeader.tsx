import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { BookMarked, Moon, Sun, Settings as SettingsIcon, LogOut } from "lucide-react";

export default function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <BookMarked className="h-5 w-5 text-primary" />
          Books
        </Link>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
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
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Lock">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

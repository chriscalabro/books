import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import BookCard from "@/components/BookCard";
import BookForm from "@/components/BookForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBooks, useDeleteBook, useTogglePin, type Book } from "@/hooks/useBooks";
import { useLists } from "@/hooks/useLists";
import { useOnline } from "@/hooks/useOnline";
import { cn } from "@/lib/utils";
import { Plus, LayoutGrid, List as ListIcon, Search, WifiOff, Filter, Pin } from "lucide-react";
import { toast } from "sonner";

const UNCATEGORIZED = "Uncategorized";

export default function Books() {
  const { data: books = [], isLoading } = useBooks();
  const categories = useLists("category");
  const acquisitions = useLists("acquisition");
  const del = useDeleteBook();
  const pin = useTogglePin();
  const online = useOnline();

  const [view, setView] = useState<"list" | "grid">(
    (localStorage.getItem("books-view") as "list" | "grid") || "list"
  );
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [acqFilter, setAcqFilter] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<"all" | "available" | "future">("all");
  const [showFilters, setShowFilters] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState<Book | null>(null);

  const setViewPersist = (v: "list" | "grid") => {
    setView(v);
    localStorage.setItem("books-view", v);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return books.filter((b) => {
      if (catFilter && (b.category ?? UNCATEGORIZED) !== catFilter) return false;
      if (acqFilter && b.acquisition !== acqFilter) return false;
      if (q) {
        const hay = `${b.title} ${b.author ?? ""} ${b.notes ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [books, search, catFilter, acqFilter]);

  // Date-based views. (yyyy-MM-dd sorts lexicographically.)
  const today = new Date().toISOString().slice(0, 10);
  // Not-yet-published, soonest first.
  const futureBooks = useMemo(
    () =>
      filtered
        .filter((b) => b.pub_date && b.pub_date > today)
        .sort((a, b) => (a.pub_date as string).localeCompare(b.pub_date as string)),
    [filtered, today]
  );
  // Already published, most recent first.
  const availableBooks = useMemo(
    () =>
      filtered
        .filter((b) => b.pub_date && b.pub_date <= today)
        .sort((a, b) => (b.pub_date as string).localeCompare(a.pub_date as string)),
    [filtered, today]
  );

  const timedList = timeFilter === "future" ? futureBooks : availableBooks;
  const timedLabel = timeFilter === "future" ? "Upcoming" : "Published";

  // Pinned books float to the top in their own section, out of the category groups.
  const pinnedBooks = useMemo(() => filtered.filter((b) => b.pinned), [filtered]);

  // Group the rest by category, ordered by the user's category order.
  const groups = useMemo(() => {
    const order = [...(categories.data?.map((c) => c.name) ?? []), UNCATEGORIZED];
    const map = new Map<string, Book[]>();
    for (const b of filtered) {
      if (b.pinned) continue;
      const key = b.category ?? UNCATEGORIZED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return order
      .filter((name) => map.has(name))
      .map((name) => ({ name, items: map.get(name)! }));
  }, [filtered, categories.data]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (b: Book) => {
    setEditing(b);
    setFormOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await del.mutateAsync(deleting.id);
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message ?? "Could not delete");
    }
    setDeleting(null);
  };
  const togglePin = (b: Book) => pin.mutate({ id: b.id, pinned: !b.pinned });

  // Keyboard shortcuts. "a" opens Add; "/" focuses search. Ignored while typing
  // in a field or when a dialog is already open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (formOpen || deleting) return;
      if (e.key === "a") {
        e.preventDefault();
        openAdd();
      } else if (e.key === "/") {
        e.preventDefault();
        (document.getElementById("book-search") as HTMLInputElement | null)?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formOpen, deleting]);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {!online && (
        <div className="flex items-center justify-center gap-2 bg-muted py-1.5 text-xs text-muted-foreground">
          <WifiOff className="h-3.5 w-3.5" /> Offline — showing your saved list
        </div>
      )}

      <main className="container px-4 py-4">
        {/* Toolbar */}
        <div className="mb-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="book-search"
              placeholder="Search title, author, notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant={catFilter || acqFilter ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters((s) => !s)}
            aria-label="Filters"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <div className="flex overflow-hidden rounded-md border">
            <button
              className={cn("px-2.5 py-2", view === "list" && "bg-muted")}
              onClick={() => setViewPersist("list")}
              aria-label="List view"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              className={cn("px-2.5 py-2", view === "grid" && "bg-muted")}
              onClick={() => setViewPersist("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={openAdd} className="gap-1">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add</span>
          </Button>
        </div>

        {/* Time pills */}
        <div className="mb-4 flex items-center gap-1.5">
          <Pill active={timeFilter === "all"} onClick={() => setTimeFilter("all")}>
            All
          </Pill>
          <Pill active={timeFilter === "available"} onClick={() => setTimeFilter("available")}>
            Published{availableBooks.length > 0 && ` (${availableBooks.length})`}
          </Pill>
          <Pill active={timeFilter === "future"} onClick={() => setTimeFilter("future")}>
            Future{futureBooks.length > 0 && ` (${futureBooks.length})`}
          </Pill>
        </div>

        {/* Filter pills */}
        {showFilters && (
          <div className="mb-4 space-y-2">
            {(categories.data?.length ?? 0) > 0 && (
              <FilterRow
                label="Category"
                value={catFilter}
                options={[...(categories.data?.map((c) => c.name) ?? []), UNCATEGORIZED]}
                onChange={setCatFilter}
              />
            )}
            {(acquisitions.data?.length ?? 0) > 0 && (
              <FilterRow
                label="Acquisition"
                value={acqFilter}
                options={acquisitions.data?.map((a) => a.name) ?? []}
                onChange={setAcqFilter}
              />
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <p className="py-16 text-center text-muted-foreground">Loading…</p>
        ) : timeFilter !== "all" ? (
          timedList.length === 0 ? (
            <p className="py-16 text-center text-muted-foreground">
              {timeFilter === "future"
                ? "No upcoming releases with a future date."
                : "No published books with a date yet."}
            </p>
          ) : (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                {timedLabel} <span className="font-normal">({timedList.length})</span>
              </h2>
              <BookGroup books={timedList} view={view} onEdit={openEdit} onDelete={setDeleting} onTogglePin={togglePin} showDate />
            </section>
          )
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            {books.length === 0 ? (
              <>
                <p>No books yet.</p>
                <Button variant="link" onClick={openAdd}>Add your first one</Button>
              </>
            ) : (
              <p>Nothing matches those filters.</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {pinnedBooks.length > 0 && (
              <section>
                <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                  <Pin className="h-3.5 w-3.5 fill-primary text-primary" /> Pinned{" "}
                  <span className="font-normal">({pinnedBooks.length})</span>
                </h2>
                <BookGroup books={pinnedBooks} view={view} onEdit={openEdit} onDelete={setDeleting} onTogglePin={togglePin} />
              </section>
            )}
            {groups.map((group) => (
              <section key={group.name}>
                <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                  {group.name}{" "}
                  <span className="font-normal">({group.items.length})</span>
                </h2>
                <BookGroup books={group.items} view={view} onEdit={openEdit} onDelete={setDeleting} onTogglePin={togglePin} />
              </section>
            ))}
          </div>
        )}
      </main>

      <BookForm open={formOpen} onOpenChange={setFormOpen} book={editing} />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this book?</AlertDialogTitle>
            <AlertDialogDescription>
              “{deleting?.title}” will be removed. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BookGroup({
  books,
  view,
  onEdit,
  onDelete,
  onTogglePin,
  showDate,
}: {
  books: Book[];
  view: "list" | "grid";
  onEdit: (b: Book) => void;
  onDelete: (b: Book) => void;
  onTogglePin: (b: Book) => void;
  showDate?: boolean;
}) {
  if (view === "grid") {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {books.map((b) => (
          <BookCard key={b.id} book={b} view="grid" onEdit={onEdit} onDelete={onDelete} onTogglePin={onTogglePin} showDate={showDate} />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {books.map((b) => (
        <BookCard key={b.id} book={b} view="list" onEdit={onEdit} onDelete={onDelete} onTogglePin={onTogglePin} />
      ))}
    </div>
  );
}

function FilterRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs font-medium text-muted-foreground">{label}:</span>
      <Pill active={!value} onClick={() => onChange(null)}>All</Pill>
      {options.map((opt) => (
        <Pill key={opt} active={value === opt} onClick={() => onChange(opt)}>
          {opt}
        </Pill>
      ))}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

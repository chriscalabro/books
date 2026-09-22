import React from "react";
import { Book } from "@/hooks/useBooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Copy,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPubDate } from "@/lib/dateFormat";
import { useDateFormat } from "@/hooks/useDateFormat";
import { toast } from "sonner";

interface Props {
  book: Book;
  view: "list" | "grid";
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onTogglePin: (book: Book) => void;
  /** Show the published date on the grid card (used in the Future view). */
  showDate?: boolean;
}

async function copyText(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${label}`);
  } catch {
    toast.error("Couldn't copy");
  }
}

// Silver Unicorn carries the term in the URL *path* and reads it literally, so
// it wants only the truly path-unsafe characters encoded (spaces, slashes, …).
// Colons/commas/dashes must stay literal or the search finds nothing.
function encodePathTerm(q: string): string {
  return encodeURIComponent(q)
    .replace(/%3A/gi, ":")
    .replace(/%2C/gi, ",")
    .replace(/%E2%80%94/g, "—");
}

// Sites we can deep-link straight to a search results page. Each `url` receives
// the raw query and encodes it as that site expects. Kept as data so the
// submenu stays trivial to extend.
const SEARCH_SITES: { label: string; url: (q: string) => string }[] = [
  {
    label: "MVLC",
    url: (q) =>
      `https://mvlc.ent.sirsi.net/client/en_US/mvlc/search/results?qu=${encodeURIComponent(q)}`,
  },
  {
    label: "Minuteman (MLN)",
    url: (q) =>
      `https://catalog.minlib.net/Union/Search?searchSource=local&basicType=Keyword&lookfor=${encodeURIComponent(q)}`,
  },
  {
    label: "Libby",
    url: (q) =>
      `https://libbyapp.com/search/bpl/search/scope-deep/query-${encodeURIComponent(q)}/page-1`,
  },
  {
    label: "Silver Unicorn",
    url: (q) =>
      `https://www.silverunicornbooks.com/browse/filter/t/${encodePathTerm(q)}/k/keyword`,
  },
  {
    label: "Barnes & Noble",
    url: (q) => `https://www.barnesandnoble.com/search?q=${encodeURIComponent(q)}`,
  },
];

function openSearch(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

// The Commonwealth Catalog generates a per-session searchId server-side, so its
// query can't live in a URL. Copy the query and open the catalog so a paste is
// all that's left — mirroring the clipboard-based flow it replaces.
async function commonwealthSearch(query: string) {
  await copyText(query, "search — paste it into Commonwealth Catalog");
  openSearch("https://www.commonwealthcatalog.org/");
}

// The overflow menu: copy, open link, edit, pin, delete. Used by both views so
// the row/card stays uncluttered (esp. on mobile).
function BookMenu({
  book,
  onEdit,
  onDelete,
  onTogglePin,
  className,
}: {
  book: Book;
  onEdit: (b: Book) => void;
  onDelete: (b: Book) => void;
  onTogglePin: (b: Book) => void;
  className?: string;
}) {
  const titleAndAuthor = book.author ? `${book.title} — ${book.author}` : book.title;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={className} aria-label="More actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => copyText(titleAndAuthor, "title & author")}>
          <Copy className="mr-2 h-4 w-4" /> Copy title &amp; author
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyText(book.title, "title")}>
          <Copy className="mr-2 h-4 w-4" /> Copy title
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Search className="mr-2 h-4 w-4" /> Search via…
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {SEARCH_SITES.map((site) => (
              <DropdownMenuItem
                key={site.label}
                // Keep the menu open so you can fire off several searches in a
                // row; press Esc or click away when you're done.
                onSelect={(e) => e.preventDefault()}
                onClick={() => openSearch(site.url(titleAndAuthor))}
              >
                {site.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={() => commonwealthSearch(titleAndAuthor)}
            >
              Commonwealth Catalog
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          onClick={() =>
            openSearch(`https://www.goodreads.com/search?q=${encodeURIComponent(titleAndAuthor)}`)
          }
        >
          <Search className="mr-2 h-4 w-4" /> Search Goodreads
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(book)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onTogglePin(book)}>
          {book.pinned ? (
            <>
              <PinOff className="mr-2 h-4 w-4" /> Unpin
            </>
          ) : (
            <>
              <Pin className="mr-2 h-4 w-4" /> Pin
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(book)}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Some publishers hand back a wide Open Graph *banner* (the cover centered on a
// white field, e.g. 1200×630) instead of the cover itself. Strip the params that
// force that shape so we get the true cover aspect for object-contain.
function coverSrc(url: string): string {
  try {
    const u = new URL(url);
    ["h", "fit", "fill", "fill-color", "ar", "crop", "rect"].forEach((p) =>
      u.searchParams.delete(p)
    );
    return u.toString();
  } catch {
    return url;
  }
}

function CoverImg({ book, className }: { book: Book; className?: string }) {
  if (book.cover_url) {
    return (
      <img
        src={coverSrc(book.cover_url)}
        alt={book.title}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={className}
      />
    );
  }
  return (
    <div className={`flex items-center justify-center bg-muted ${className ?? ""}`}>
      <BookOpen className="h-6 w-6 text-muted-foreground/50" />
    </div>
  );
}

// The main tap target (cover + title/author). Opens the book's link when it has
// one; otherwise it falls back to editing so a tap is never a dead end. Edit is
// always available from the overflow menu.
function Primary({
  book,
  onEdit,
  className,
  children,
}: {
  book: Book;
  onEdit: (b: Book) => void;
  className?: string;
  children: React.ReactNode;
}) {
  if (book.link) {
    return (
      <a
        href={book.link}
        target="_blank"
        rel="noreferrer"
        className={className}
        aria-label={`Open link for ${book.title}`}
      >
        {children}
      </a>
    );
  }
  return (
    <button
      onClick={() => onEdit(book)}
      className={className}
      aria-label={`Edit ${book.title}`}
    >
      {children}
    </button>
  );
}

// The Future view shows the exact day; elsewhere we use the user's chosen format.
const FUTURE_DATE_FORMAT = "MMM d, yyyy";

function Meta({ book, dateFormat }: { book: Book; dateFormat?: string }) {
  const fmt = useDateFormat();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {book.pub_date && (
        <span className="text-xs text-muted-foreground">
          {formatPubDate(book.pub_date, dateFormat ?? fmt)}
        </span>
      )}
      {book.acquisition && (
        <Badge variant="secondary" className="text-[10px]">{book.acquisition}</Badge>
      )}
    </div>
  );
}

export default function BookCard({ book, view, onEdit, onDelete, onTogglePin, showDate: futureView }: Props) {
  // Upcoming books always show their exact date, not just in the Future view.
  // Same comparison as the Future filter in Books.tsx.
  const isFuture = !!book.pub_date && book.pub_date > new Date().toISOString().slice(0, 10);
  const showDate = futureView || isFuture;
  if (view === "grid") {
    return (
      <Card className="group relative overflow-hidden">
        <BookMenu
          book={book}
          onEdit={onEdit}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          className="absolute right-0.5 top-0.5 z-10 h-7 w-7 rounded-full bg-background/70 backdrop-blur hover:bg-background sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 sm:data-[state=open]:opacity-100"
        />
        {book.pinned && (
          <Pin className="absolute left-1.5 top-1.5 z-10 h-3.5 w-3.5 fill-primary text-primary" />
        )}
        <Primary book={book} onEdit={onEdit} className="block w-full text-left">
          <div className="relative">
            <CoverImg book={book} className="aspect-[2/3] w-full bg-muted object-contain" />
            {book.acquisition && (
              <span className="absolute bottom-1.5 left-1.5 line-clamp-2 max-w-[calc(100%-0.75rem)] rounded-[2px] bg-[#fde047]/90 px-1.5 py-0.5 text-[11px] font-medium leading-tight text-neutral-900 backdrop-blur-sm">
                {book.acquisition}
              </span>
            )}
          </div>
          <div className="space-y-1 p-2">
            <p className="line-clamp-2 text-sm font-medium leading-tight">{book.title}</p>
            {book.author && (
              <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
            )}
            {book.pub_date && (
              <p className="text-xs font-medium text-muted-foreground">
                {formatPubDate(book.pub_date, showDate ? FUTURE_DATE_FORMAT : "yyyy")}
              </p>
            )}
          </div>
        </Primary>
      </Card>
    );
  }

  return (
    <Card className="group flex items-start gap-3 p-3">
      {book.pinned && <Pin className="mt-1 h-4 w-4 shrink-0 fill-primary text-primary" />}
      <Primary
        book={book}
        onEdit={onEdit}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <CoverImg book={book} className="h-16 w-11 shrink-0 rounded object-cover" />
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">{book.title}</p>
          {book.author && <p className="text-sm text-muted-foreground">{book.author}</p>}
          <div className="mt-1">
            <Meta book={book} dateFormat={showDate ? FUTURE_DATE_FORMAT : undefined} />
          </div>
          {book.notes && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{book.notes}</p>
          )}
        </div>
      </Primary>
      <BookMenu
        book={book}
        onEdit={onEdit}
        onDelete={onDelete}
        onTogglePin={onTogglePin}
        className="-mr-1 shrink-0"
      />
    </Card>
  );
}

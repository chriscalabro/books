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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Copy,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
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

export default function BookCard({ book, view, onEdit, onDelete, onTogglePin, showDate }: Props) {
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
          <CoverImg book={book} className="aspect-[2/3] w-full bg-muted object-contain" />
          <div className="space-y-1 p-2">
            <p className="line-clamp-2 text-sm font-medium leading-tight">{book.title}</p>
            {book.author && (
              <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
            )}
            {showDate && book.pub_date && (
              <p className="text-xs font-medium text-muted-foreground">
                {formatPubDate(book.pub_date, FUTURE_DATE_FORMAT)}
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

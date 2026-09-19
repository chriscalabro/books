import { Book } from "@/hooks/useBooks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BookOpen, ExternalLink, Pencil, Pin, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPubDate } from "@/lib/dateFormat";
import { useDateFormat } from "@/hooks/useDateFormat";

interface Props {
  book: Book;
  view: "list" | "grid";
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onTogglePin: (book: Book) => void;
  /** Show the published date on the grid card (used in the Future view). */
  showDate?: boolean;
}

function PinButton({
  book,
  onTogglePin,
  className,
}: {
  book: Book;
  onTogglePin: (book: Book) => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={book.pinned ? "Unpin" : "Pin"}
      aria-pressed={book.pinned}
      onClick={(e) => {
        e.stopPropagation();
        onTogglePin(book);
      }}
    >
      <Pin
        className={cn(
          "h-4 w-4",
          book.pinned ? "fill-primary text-primary" : "text-muted-foreground"
        )}
      />
    </Button>
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

function Cover({ book, className }: { book: Book; className?: string }) {
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
        {/* Pin overlays the card so it isn't a button nested in a button. */}
        <PinButton
          book={book}
          onTogglePin={onTogglePin}
          className={cn(
            "absolute right-0.5 top-0.5 z-10 h-6 w-6 rounded-full bg-background/70 backdrop-blur hover:bg-background",
            !book.pinned && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          )}
        />
        <button onClick={() => onEdit(book)} className="block w-full text-left">
          <Cover book={book} className="aspect-[2/3] w-full bg-muted object-contain" />
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
        </button>
      </Card>
    );
  }

  return (
    <Card className="group flex items-start gap-3 p-3">
      <PinButton book={book} onTogglePin={onTogglePin} className="-ml-1 mt-0.5 h-8 w-8 shrink-0" />
      <button onClick={() => onEdit(book)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
        <Cover book={book} className="h-16 w-11 flex-shrink-0 rounded object-cover" />
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
      </button>
      {/* Always tappable on touch (no hover); reveal on hover on desktop. */}
      <div className="flex flex-shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        {book.link && (
          <Button variant="ghost" size="icon" asChild aria-label="Open link">
            <a href={book.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => onEdit(book)} aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(book)} aria-label="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

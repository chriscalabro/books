import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpsertBook, type Book } from "@/hooks/useBooks";
import { useLists } from "@/hooks/useLists";
import { fetchBookFromUrl } from "@/lib/lookup";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

const NONE = "__none__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null;
  /** Ask the parent to delete this book (parent shows the confirm dialog). */
  onRequestDelete?: (book: Book) => void;
}

export default function BookForm({ open, onOpenChange, book, onRequestDelete }: Props) {
  const upsert = useUpsertBook();
  const categories = useLists("category");
  const acquisitions = useLists("acquisition");
  const lookupRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    author: "",
    category: NONE,
    acquisition: NONE,
    pub_date: "",
    cover_url: "",
    link: "",
    notes: "",
  });
  const [lookupUrl, setLookupUrl] = useState("");
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        title: book?.title ?? "",
        author: book?.author ?? "",
        category: book?.category ?? NONE,
        acquisition: book?.acquisition ?? NONE,
        pub_date: book?.pub_date ?? "",
        cover_url: book?.cover_url ?? "",
        link: book?.link ?? "",
        notes: book?.notes ?? "",
      });
      setLookupUrl(book?.link ?? "");
    }
  }, [open, book]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Autofill from a publisher URL. Only fills fields that are still empty, so it
  // never clobbers something you've already typed. Always sets the link.
  const autofill = async () => {
    setFetching(true);
    try {
      const meta = await fetchBookFromUrl(lookupUrl);
      setForm((f) => ({
        ...f,
        title: f.title || meta.title || "",
        author: f.author || meta.author || "",
        pub_date: f.pub_date || meta.pub_date || "",
        cover_url: f.cover_url || meta.cover_url || "",
        link: f.link || meta.link,
      }));
      toast.success("Autofilled — review and save");
    } catch (e: any) {
      toast.error(e.message ?? "Lookup failed");
    } finally {
      setFetching(false);
    }
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await upsert.mutateAsync({
        ...(book?.id ? { id: book.id } : {}),
        title: form.title.trim(),
        author: form.author.trim() || null,
        category: form.category === NONE ? null : form.category,
        acquisition: form.acquisition === NONE ? null : form.acquisition,
        pub_date: form.pub_date.trim() || null,
        cover_url: form.cover_url.trim() || null,
        link: form.link.trim() || null,
        notes: form.notes.trim() || null,
      });
      toast.success(book ? "Updated" : "Added");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-md"
        onKeyDown={(e) => {
          // Cmd/Ctrl+Enter saves from anywhere in the form.
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            if (!upsert.isPending) save();
          }
        }}
        onOpenAutoFocus={(e) => {
          // For a new book, land in the URL bar so paste + Enter fetches.
          if (!book) {
            e.preventDefault();
            lookupRef.current?.focus();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{book ? "Edit book" : "Add book"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Autofill from a publisher URL */}
          <div className="rounded-lg border bg-muted/40 p-3">
            <Label htmlFor="lookup" className="flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" /> Autofill from a publisher URL
            </Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="lookup"
                ref={lookupRef}
                placeholder="https://…"
                value={lookupUrl}
                onChange={(e) => setLookupUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (lookupUrl.trim() && !fetching) autofill();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={autofill}
                disabled={fetching || !lookupUrl.trim()}
                className="shrink-0"
              >
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fetch"}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input id="author" value={form.author} onChange={(e) => set("author", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {categories.data?.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Acquisition</Label>
              <Select value={form.acquisition} onValueChange={(v) => set("acquisition", v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {acquisitions.data?.map((a) => (
                    <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="pub_date">Published</Label>
            <Input id="pub_date" type="date" value={form.pub_date} onChange={(e) => set("pub_date", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cover_url">Cover image URL</Label>
            <div className="flex gap-2">
              {form.cover_url && (
                <img
                  src={form.cover_url}
                  alt="Cover preview"
                  referrerPolicy="no-referrer"
                  className="h-16 w-11 shrink-0 rounded border object-cover"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}
              <Input id="cover_url" value={form.cover_url} onChange={(e) => set("cover_url", e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="link">Link</Label>
            <Input id="link" value={form.link} onChange={(e) => set("link", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {book && onRequestDelete ? (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onOpenChange(false);
                onRequestDelete(book);
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending} title="⌘↵ / Ctrl+↵">
              {upsert.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

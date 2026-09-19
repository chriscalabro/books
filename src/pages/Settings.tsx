import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLists, type ListKind } from "@/hooks/useLists";
import { DATE_FORMATS, setDateFormat } from "@/lib/dateFormat";
import { useDateFormat } from "@/hooks/useDateFormat";
import { Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-lg space-y-6 px-4 py-6">
        <h1 className="text-lg font-semibold">Settings</h1>
        <DateFormatSetting />
        <ListManager
          kind="category"
          title="Categories"
          hint="Renaming re-tags matching books. Deleting clears the tag but keeps the books."
        />
        <ListManager
          kind="acquisition"
          title="Acquisition methods"
          hint="e.g. Libby, MVLC, Buy — whatever you use. Starts empty."
        />
      </main>
    </div>
  );
}

function DateFormatSetting() {
  const current = useDateFormat();
  return (
    <Card className="p-4">
      <h2 className="font-medium">Published date display</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Dates are stored precisely; this only changes how they show on your list.
      </p>
      <Select value={current} onValueChange={setDateFormat}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DATE_FORMATS.map((f) => (
            <SelectItem key={f.value} value={f.value}>
              {f.label} — {f.example}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Card>
  );
}

function ListManager({
  kind,
  title,
  hint,
}: {
  kind: ListKind;
  title: string;
  hint: string;
}) {
  const { data = [], add, rename, remove } = useLists(kind);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const doAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    if (data.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      toast.error("Already exists");
      return;
    }
    await add.mutateAsync(name);
    setNewName("");
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const saveEdit = async (id: string, oldName: string) => {
    const newVal = editValue.trim();
    if (newVal && newVal !== oldName) {
      await rename.mutateAsync({ id, oldName, newName: newVal });
    }
    setEditingId(null);
  };

  return (
    <Card className="p-4">
      <h2 className="font-medium">{title}</h2>
      <p className="mb-3 text-xs text-muted-foreground">{hint}</p>

      <div className="space-y-1.5">
        {data.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            {editingId === item.id ? (
              <>
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(item.id, item.name)}
                  autoFocus
                  className="h-8"
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => saveEdit(item.id, item.name)}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <button
                  className="flex-1 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
                  onClick={() => startEdit(item.id, item.name)}
                >
                  {item.name}
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => remove.mutate({ id: item.id, name: item.name })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
        {data.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">None yet.</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          placeholder={`Add ${title.toLowerCase().replace(/s$/, "")}`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doAdd()}
          className="h-9"
        />
        <Button size="icon" className="h-9 w-9" onClick={doAdd} disabled={add.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}

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
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useLists, type ListKind } from "@/hooks/useLists";
import { DATE_FORMATS, setDateFormat } from "@/lib/dateFormat";
import { useDateFormat } from "@/hooks/useDateFormat";
import {
  MIN_GRID_COLS,
  MAX_GRID_COLS,
  setGridCols,
} from "@/lib/gridCols";
import { useGridCols } from "@/hooks/useGridCols";
import { SORT_OPTIONS, setSort } from "@/lib/sortBooks";
import { useSort } from "@/hooks/useSort";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Moon, LogOut } from "lucide-react";
import { Check, GripVertical, Plus, Trash2, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ListItem } from "@/hooks/useLists";
import { toast } from "sonner";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container max-w-lg space-y-6 px-4 py-6">
        <h1 className="text-lg font-semibold">Settings</h1>
        <ThemeSetting />
        <SortSetting />
        <GridColsSetting />
        <DateFormatSetting />
        <ListManager
          kind="category"
          title="Categories"
          singular="category"
          hint="Renaming re-tags matching books. Deleting clears the tag but keeps the books."
        />
        <ListManager
          kind="acquisition"
          title="Acquisition methods"
          singular="acquisition method"
          hint="e.g. Libby, MVLC, Buy — whatever you use. Starts empty."
        />
        <LogOutSetting />
      </main>
    </div>
  );
}

function LogOutSetting() {
  const { signOut } = useAuth();
  return (
    <Button variant="outline" className="w-full" onClick={signOut}>
      <LogOut className="mr-2 h-4 w-4" /> Log out
    </Button>
  );
}

function ThemeSetting() {
  const { theme, setTheme } = useTheme();
  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <Moon className="h-4 w-4 text-muted-foreground" />
        <div>
          <h2 className="font-medium">Dark mode</h2>
          <p className="text-xs text-muted-foreground">Use the dark color theme.</p>
        </div>
      </div>
      <Switch
        checked={theme === "dark"}
        onCheckedChange={(on) => setTheme(on ? "dark" : "light")}
        aria-label="Dark mode"
      />
    </Card>
  );
}

function SortSetting() {
  const current = useSort();
  return (
    <Card className="p-4">
      <h2 className="font-medium">Sort order</h2>
      <p className="mb-3 text-xs text-muted-foreground">
        How your books are ordered within each category. The Upcoming and
        Published views always sort by publish date.
      </p>
      <Select value={current} onValueChange={(v) => setSort(v as any)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Card>
  );
}

function GridColsSetting() {
  const cols = useGridCols();
  return (
    <Card className="p-4">
      <div className="mb-1 flex items-baseline justify-between">
        <h2 className="font-medium">Books per row</h2>
        <span className="text-sm tabular-nums text-muted-foreground">{cols}</span>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        How many cards fit in a row on desktop, in grid view. Phones and tablets
        adjust automatically.
      </p>
      <Slider
        min={MIN_GRID_COLS}
        max={MAX_GRID_COLS}
        step={1}
        value={[cols]}
        onValueChange={(v) => setGridCols(v[0])}
        aria-label="Books per row"
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        <span>Bigger</span>
        <span>Smaller</span>
      </div>
    </Card>
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

function SortableRow({
  item,
  editing,
  editValue,
  onEditValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  item: ListItem;
  editing: boolean;
  editValue: string;
  onEditValue: (v: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (editing) {
    return (
      <div ref={setNodeRef} style={style} className="flex items-center gap-2">
        <Input
          value={editValue}
          onChange={(e) => onEditValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSaveEdit()}
          autoFocus
          className="h-8"
        />
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onSaveEdit}>
          <Check className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onCancelEdit}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1 rounded",
        isDragging && "bg-muted shadow-sm"
      )}
    >
      <button
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
        aria-label={`Drag to reorder ${item.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        className="flex-1 rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
        onClick={onStartEdit}
      >
        {item.name}
      </button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-muted-foreground"
        aria-label={`Delete ${item.name}`}
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function ListManager({
  kind,
  title,
  singular,
  hint,
}: {
  kind: ListKind;
  title: string;
  singular: string;
  hint: string;
}) {
  const { data = [], add, rename, remove, reorder } = useLists(kind);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const sensors = useSensors(
    // A small distance so a tap that ends up as edit/delete isn't read as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = data.findIndex((d) => d.id === active.id);
    const newIndex = data.findIndex((d) => d.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const ids = arrayMove(data, oldIndex, newIndex).map((d) => d.id);
    reorder.mutate(ids);
  };

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

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={data.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {data.map((item) => (
              <SortableRow
                key={item.id}
                item={item}
                editing={editingId === item.id}
                editValue={editValue}
                onEditValue={setEditValue}
                onStartEdit={() => startEdit(item.id, item.name)}
                onSaveEdit={() => saveEdit(item.id, item.name)}
                onCancelEdit={() => setEditingId(null)}
                onDelete={() => remove.mutate({ id: item.id, name: item.name })}
              />
            ))}
            {data.length === 0 && (
              <p className="py-2 text-sm text-muted-foreground">None yet.</p>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-3 flex gap-2">
        <Input
          placeholder={`Add ${singular}`}
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

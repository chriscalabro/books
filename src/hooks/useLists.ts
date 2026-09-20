import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { DEFAULT_CATEGORIES } from "@/lib/config";

export type ListKind = "category" | "acquisition";
export type ListItem = Database["public"]["Tables"]["lists"]["Row"];

export function useLists(kind: ListKind) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["lists", kind],
    queryFn: async (): Promise<ListItem[]> => {
      const { data, error } = await supabase
        .from("lists")
        .select("*")
        .eq("kind", kind)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;

      // One-time seed: give categories sensible defaults on an empty account.
      if (kind === "category" && (data?.length ?? 0) === 0) {
        const rows = DEFAULT_CATEGORIES.map((name, i) => ({
          kind,
          name,
          sort_order: i,
        }));
        const { data: seeded } = await supabase
          .from("lists")
          .insert(rows)
          .select();
        return seeded ?? [];
      }
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async (name: string) => {
      const sort_order = query.data?.length ?? 0;
      const { error } = await supabase
        .from("lists")
        .insert({ kind, name: name.trim(), sort_order });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists", kind] }),
  });

  const rename = useMutation({
    // Renaming a list option also re-tags any books using the old name.
    mutationFn: async ({ id, oldName, newName }: { id: string; oldName: string; newName: string }) => {
      const { error } = await supabase
        .from("lists")
        .update({ name: newName.trim() })
        .eq("id", id);
      if (error) throw error;
      const column = kind === "category" ? "category" : "acquisition";
      await supabase
        .from("books")
        .update({ [column]: newName.trim() })
        .eq(column, oldName);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lists", kind] });
      qc.invalidateQueries({ queryKey: ["books"] });
    },
  });

  const reorder = useMutation({
    // Persist a new ordering. `orderedIds` is the full list in its new order;
    // each row's sort_order becomes its index.
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, i) =>
          supabase.from("lists").update({ sort_order: i }).eq("id", id)
        )
      );
    },
    // Optimistic: reflect the new order immediately so the arrows feel instant.
    onMutate: async (orderedIds: string[]) => {
      await qc.cancelQueries({ queryKey: ["lists", kind] });
      const prev = qc.getQueryData<ListItem[]>(["lists", kind]);
      if (prev) {
        const byId = new Map(prev.map((it) => [it.id, it]));
        const next = orderedIds
          .map((id, i) => {
            const it = byId.get(id);
            return it ? { ...it, sort_order: i } : null;
          })
          .filter(Boolean) as ListItem[];
        qc.setQueryData<ListItem[]>(["lists", kind], next);
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["lists", kind], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["lists", kind] }),
  });

  const remove = useMutation({
    // Deleting an option clears it from books (does not delete the books).
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("lists").delete().eq("id", id);
      if (error) throw error;
      const column = kind === "category" ? "category" : "acquisition";
      await supabase.from("books").update({ [column]: null }).eq(column, name);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lists", kind] });
      qc.invalidateQueries({ queryKey: ["books"] });
    },
  });

  return { ...query, add, rename, remove, reorder };
}

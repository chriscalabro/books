import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Book = Database["public"]["Tables"]["books"]["Row"];
export type BookInput = Database["public"]["Tables"]["books"]["Insert"];

export function useBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: async (): Promise<Book[]> => {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUpsertBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (book: Partial<Book> & { title: string }) => {
      const payload = { ...book };
      if (payload.id) {
        const { data, error } = await supabase
          .from("books")
          .update(payload)
          .eq("id", payload.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
      const { data, error } = await supabase
        .from("books")
        .insert(payload as BookInput)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useTogglePin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("books").update({ pinned }).eq("id", id);
      if (error) throw error;
    },
    // Optimistic: flip immediately so pinning feels instant.
    onMutate: async ({ id, pinned }) => {
      await qc.cancelQueries({ queryKey: ["books"] });
      const prev = qc.getQueryData<Book[]>(["books"]);
      qc.setQueryData<Book[]>(["books"], (old) =>
        (old ?? []).map((b) => (b.id === id ? { ...b, pinned } : b))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["books"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

export function useDeleteBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["books"] }),
  });
}

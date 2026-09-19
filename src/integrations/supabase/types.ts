export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      books: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          author: string | null;
          category: string | null;
          acquisition: string | null;
          pub_date: string | null;
          cover_url: string | null;
          link: string | null;
          notes: string | null;
          source: string;
          pinned: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          title: string;
          author?: string | null;
          category?: string | null;
          acquisition?: string | null;
          pub_date?: string | null;
          cover_url?: string | null;
          link?: string | null;
          notes?: string | null;
          source?: string;
          pinned?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          author?: string | null;
          category?: string | null;
          acquisition?: string | null;
          pub_date?: string | null;
          cover_url?: string | null;
          link?: string | null;
          notes?: string | null;
          source?: string;
          pinned?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      lists: {
        Row: {
          id: string;
          user_id: string;
          kind: string; // 'category' | 'acquisition'
          name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          kind: string;
          name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          name?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

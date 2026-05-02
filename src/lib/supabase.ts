import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  username: string;
  created_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  category: string;
  created_at: string;
  profiles?: Profile;
};

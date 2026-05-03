import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

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
  subcategory: string | null;
  image_url?: string | null;
  created_at: string;
  parent_id: string | null;
  profiles?: Profile;
  replies?: Post[];
};

export const SUBCATEGORIES: Record<string, string[]> = {
  rideshare: ['To SLO', 'From SLO'],
  lost: ['On-Campus', 'Off-Campus'],
  social: ['Events', 'Discussions', 'Questions'],
  opportunities: ['Jobs', 'Internships', 'Events'],
};

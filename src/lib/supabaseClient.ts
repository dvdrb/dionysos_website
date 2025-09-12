import { createClient } from "@supabase/supabase-js";

// Ia variabilele de mediu
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Verifică dacă variabilele au fost setate
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in .env.local");
}

// Creează și exportă clientul Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

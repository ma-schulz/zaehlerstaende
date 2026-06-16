import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Sichtbarer Hinweis im Dev-Betrieb, statt kryptischer Laufzeitfehler.
  console.error(
    'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY fehlen. .env aus .env.example anlegen.',
  );
}

// Platzhalter-URL, damit die App auch ohne .env lädt (Auth-Aufrufe schlagen dann fehl).
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

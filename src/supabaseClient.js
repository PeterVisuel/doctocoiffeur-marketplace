import { createClient } from '@supabase/supabase-js';

// Adresse et clé publique du projet Supabase (variables d'environnement Vercel).
// La clé « anon » est faite pour être publique : la sécurité repose sur les règles RLS de la base.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Type de lien e-mail ouvert (« signup » = confirmation d'adresse, « recovery » = mot de passe oublié),
// lu avant que Supabase ne nettoie l'adresse de la page
export const INITIAL_AUTH_LINK_TYPE = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type')
  : null;

// Flux « implicit » : les liens reçus par e-mail (confirmation, mot de passe oublié) fonctionnent même
// s'ils sont ouverts sur un autre appareil ou navigateur que celui de la demande
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' }
    })
  : null;

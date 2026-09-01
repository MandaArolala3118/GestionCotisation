import { createClient } from '@supabase/supabase-js';

let client = null;

/**
 * Client Supabase côté serveur uniquement, avec la clé service_role.
 * Ne jamais importer ce fichier depuis un composant client ('use client').
 * L'initialisation est faite au premier appel (et non au chargement du
 * module) pour ne pas faire échouer `next build` quand les variables
 * d'environnement ne sont pas encore définies.
 */
export function getSupabaseAdmin() {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Variables d'environnement manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises."
    );
  }

  client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  return client;
}

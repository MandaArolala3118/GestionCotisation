// Crée le tout premier utilisateur, à exécuter en local une seule fois.
// (La création d'utilisateur via l'application exige déjà d'être connecté :
// ce script sert donc uniquement à amorcer le tout premier compte.)
//
// Utilisation :
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-admin.mjs <nom_utilisateur> <mot_de_passe>

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const [, , username, password] = process.argv;

if (!username || !password) {
  console.error('Utilisation : node scripts/create-admin.mjs <nom_utilisateur> <mot_de_passe>');
  process.exit(1);
}

if (password.length < 8) {
  console.error('Le mot de passe doit contenir au moins 8 caractères.');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Variables SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises dans l\'environnement.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

const password_hash = await bcrypt.hash(password, 10);

const { data, error } = await supabase
  .from('app_users')
  .insert({ username, password_hash })
  .select('id, username, created_at')
  .single();

if (error) {
  console.error('Erreur lors de la création :', error.message);
  process.exit(1);
}

console.log('Utilisateur créé avec succès :', data);

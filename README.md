# Registre des cotisations

Application Next.js (déployable sur Vercel) pour suivre les cotisations
d'une association : nom, montant et date de paiement.

- **Page d'accueil publique** : rapport des cotisations par année + liste des
  personnes ayant payé au cours des 3 derniers mois.
- **Connexion requise** pour : ajouter une cotisation, créer un nouvel
  utilisateur autorisé à se connecter.
- Les mots de passe sont **hachés avec bcrypt**, jamais stockés en clair.

## Stack

- Next.js 14 (App Router), déployé sur Vercel
- Supabase (PostgreSQL) comme base de données
- `bcryptjs` pour le hachage des mots de passe
- `jose` pour signer une session (cookie httpOnly) — pas de dépendance à
  Supabase Auth, l'authentification est gérée par l'application elle-même via
  la table `app_users`

## 1. Créer le projet Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Va dans **SQL Editor** et exécute le contenu de `supabase/schema.sql`
   (crée les tables `app_users` et `cotisations`).
3. Récupère, dans **Project Settings > API** :
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (secrète, jamais côté client) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Configurer les variables d'environnement

Copie `.env.local.example` en `.env.local` et remplis les 3 valeurs :

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...   # génère une valeur avec : openssl rand -base64 48
```

## 3. Installer et lancer en local

```bash
npm install
npm run dev
```

L'application est disponible sur http://localhost:3000.

## 4. Créer le premier utilisateur

Comme la création d'un utilisateur passe par le tableau de bord (donc exige
déjà d'être connecté), il faut créer le tout premier compte via un petit
script exécuté en local :

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/create-admin.mjs admin "mot-de-passe-solide"
```

Utilise ensuite ce compte pour te connecter sur `/connexion`. Une fois
connecté, tu peux créer d'autres utilisateurs directement depuis le tableau
de bord (`/dashboard`).

## 5. Déployer sur Vercel

1. Pousse le projet sur un dépôt Git (GitHub, GitLab...).
2. Sur [vercel.com](https://vercel.com), importe le dépôt.
3. Dans **Settings > Environment Variables**, ajoute les 3 mêmes variables
   que dans `.env.local` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SESSION_SECRET`).
4. Déploie. Le script `create-admin.mjs` peut être relancé en local (il pointe
   directement sur la base Supabase, peu importe où l'app est hébergée).

## Structure du projet

```
app/
  page.jsx                  Page d'accueil (rapport public)
  connexion/page.jsx         Formulaire de connexion
  dashboard/page.jsx         Ajout de cotisation + création d'utilisateur
  api/auth/login/route.js    Connexion (vérifie le mot de passe, pose le cookie de session)
  api/auth/logout/route.js   Déconnexion
  api/cotisations/route.js   GET (public) / POST (protégé)
  api/users/route.js         POST (protégé) — création d'utilisateur, mot de passe haché
lib/
  supabaseAdmin.js           Client Supabase (clé service_role, serveur uniquement)
  auth.js                    Hachage bcrypt + création/vérification du token de session
middleware.js                 Protège /dashboard : redirige vers /connexion si non connecté
supabase/schema.sql            Script SQL de création des tables
scripts/create-admin.mjs      Script d'amorçage du tout premier utilisateur
```

## Notes

- La devise affichée est l'Ariary (Ar) — modifiable dans `formaterMontant`
  (`app/page.jsx`) et dans les libellés des formulaires.
- Le Row Level Security de Supabase est activé sur les deux tables par
  précaution, mais l'application utilise uniquement la clé `service_role`
  côté serveur, qui contourne le RLS — aucune policy n'est donc nécessaire
  pour que l'app fonctionne.
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` dans du code côté client :
  elle n'est utilisée que dans `lib/supabaseAdmin.js`, importé uniquement par
  des fichiers serveur (routes API et pages serveur).
"# GestionCotisation" 

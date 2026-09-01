# Registre des cotisations

Application Next.js (déployable sur Vercel) pour suivre les cotisations
d'une association : nom, montant et date de paiement.

## Fonctionnalités

- **Page d'accueil publique** : rapport des cotisations par année + liste des
  personnes ayant payé au cours des 3 derniers mois.
- **Tableau de bord admin** :
  - Ajouter des cotisations (versements et dépenses)
  - Gérer les utilisateurs autorisés
  - Gérer la communauté (membres avec emails)
  - Modifier les paramètres du compte
- **Notifications automatiques** : envoi d'emails à tous les membres de la communauté
  lors de l'ajout d'une cotisation (versement ou dépense)
- **Design responsive** : interface adaptée aux mobiles, tablettes et ordinateurs
- **Toasts** : notifications visuelles pour les succès et erreurs
- **Connexion sécurisée** : mots de passe hachés avec bcrypt, sessions httpOnly

## Stack

- Next.js 16 (App Router), déployé sur Vercel
- Supabase (PostgreSQL) comme base de données
- `bcryptjs` pour le hachage des mots de passe
- `jose` pour signer une session (cookie httpOnly)
- `googleapis` pour l'envoi d'emails via l'API Gmail
- `react-hot-toast` pour les notifications
- Authentification gérée par l'application via la table `app_users`

## 1. Créer le projet Supabase

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Va dans **SQL Editor** et exécute le contenu de `supabase/schema.sql`
   (crée les tables `app_users`, `cotisations` et `communaute`).
3. Récupère, dans **Project Settings > API** :
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (secrète, jamais côté client) → `SUPABASE_SERVICE_ROLE_KEY`

## 2. Configurer les variables d'environnement

Copie `.env.local.example` en `.env.local` et remplis les valeurs :

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SESSION_SECRET=...   # génère une valeur avec : openssl rand -base64 48
GMAIL_CLIENT_ID=...   # Client ID Google OAuth2
GMAIL_CLIENT_SECRET=... # Client Secret Google OAuth2
GMAIL_REFRESH_TOKEN=... # Refresh Token Google OAuth2
GMAIL_EMAIL=...       # Votre adresse Gmail
```

### Configuration Gmail OAuth2

Pour obtenir les identifiants Gmail :

1. **Créer un projet Google Cloud**
   - Allez sur https://console.cloud.google.com/
   - Créez un nouveau projet
   - Activez l'API Gmail (APIs & Services > Library > Gmail API)

2. **Créer des identifiants OAuth2**
   - Allez dans APIs & Services > Credentials
   - Cliquez sur "Create Credentials" > "OAuth client ID"
   - Sélectionnez "Web application"
   - Ajoutez l'URI de redirection : `https://developers.google.com/oauthplayground`
   - Notez le **Client ID** et **Client Secret**

3. **Obtenir le Refresh Token**
   - Allez sur https://developers.google.com/oauthplayground/
   - Cliquez sur l'icône engrenage > "Use your own OAuth credentials"
   - Entrez votre Client ID et Client Secret
   - Sélectionnez : Gmail API > `https://www.googleapis.com/auth/gmail.send`
   - Cliquez sur "Authorize APIs"
   - Connectez-vous avec votre compte Gmail
   - Cliquez sur "Exchange authorization code for tokens"
   - Copiez le **Refresh Token**

4. **Ajouter votre email comme testeur**
   - Dans Google Cloud Console > APIs & Services > OAuth consent screen
   - Ajoutez votre email dans la section "Test users"

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
3. Dans **Settings > Environment Variables**, ajoute les variables
   que dans `.env.local` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SESSION_SECRET`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
   `GMAIL_REFRESH_TOKEN`, `GMAIL_EMAIL`).
4. Déploie. Le script `create-admin.mjs` peut être relancé en local (il pointe
   directement sur la base Supabase, peu importe où l'app est hébergée).

## Structure du projet

```
app/
  page.jsx                  Page d'accueil (rapport public)
  connexion/page.jsx         Formulaire de connexion
  dashboard/
    layout.jsx              Layout du dashboard avec navigation
    page.jsx                Redirection vers cotisation
    cotisation/page.jsx     Ajout de cotisation
    utilisateur/page.jsx    Gestion des utilisateurs
    communaute/page.jsx     Gestion de la communauté
    parametres/page.jsx     Paramètres du compte
  api/
    auth/
      login/route.js        Connexion
      logout/route.js       Déconnexion
      change-password/route.js Changement de mot de passe
    cotisations/route.js    GET (public) / POST (protégé)
    users/route.js          POST (protégé) — création d'utilisateur
    communaute/
      route.js              GET/POST (protégé) — gestion communauté
      [id]/route.js         PUT/DELETE (protégé) — édition/suppression
lib/
  supabaseAdmin.js          Client Supabase (clé service_role)
  password.js              Hachage bcrypt
  session.js               Gestion des sessions JWT
  email.js                 Service d'envoi d'emails (API Gmail)
middleware.js              Protège /dashboard
supabase/schema.sql        Script SQL de création des tables
scripts/create-admin.mjs   Script d'amorçage du premier utilisateur
```

## Notes

- La devise affichée est l'Ariary (Ar) — modifiable dans `formaterMontant`
  (`app/page.jsx`) et dans les libellés des formulaires.
- Le Row Level Security de Supabase est activé sur les tables par
  précaution, mais l'application utilise uniquement la clé `service_role`
  côté serveur, qui contourne le RLS.
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` dans du code côté client :
  elle n'est utilisée que dans `lib/supabaseAdmin.js`, importé uniquement par
  des fichiers serveur.
- Les emails sont envoyés via l'API Gmail OAuth2 pour contourner les blocages
  SMTP réseau. Le refresh token permet une authentification persistante.
- L'interface est entièrement responsive et utilise des toasts pour les
  notifications utilisateur. 

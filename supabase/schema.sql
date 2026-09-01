-- Schéma pour l'application de gestion des cotisations
-- À exécuter dans Supabase : Project > SQL Editor > New query

create extension if not exists pgcrypto;

-- Utilisateurs autorisés à se connecter (accès à l'ajout de cotisations et d'utilisateurs)
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Cotisations payées par les membres
create table if not exists cotisations (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  montant numeric(12, 2) not null check (montant >= 0),
  date_paiement date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_cotisations_date on cotisations (date_paiement);
create index if not exists idx_cotisations_nom on cotisations (nom);

-- Row Level Security : activée par précaution. L'application n'utilise que la
-- clé "service_role" côté serveur (jamais exposée au navigateur), qui contourne
-- automatiquement le RLS. Aucune policy n'est donc nécessaire pour que
-- l'application fonctionne, mais l'activer empêche tout accès via une clé
-- publique (anon) qui serait ajoutée par erreur plus tard.
alter table app_users enable row level security;
alter table cotisations enable row level security;

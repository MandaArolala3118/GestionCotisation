'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConnexionPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErreur('');
    setChargement(true);

    try {
      const reponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!reponse.ok) {
        const donnees = await reponse.json().catch(() => ({}));
        setErreur(donnees.error || 'Connexion impossible.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } finally {
      setChargement(false);
    }
  }

  return (
    <main className="container container-narrow">
      <h1>Connexion</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Réservée aux personnes autorisées à gérer le registre.
      </p>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Nom d&apos;utilisateur
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {erreur && <p className="erreur">{erreur}</p>}

        <button type="submit" className="btn btn-primary" disabled={chargement}>
          {chargement ? 'Connexion en cours…' : 'Se connecter'}
        </button>
      </form>

      <a href="/" className="lien-retour">
        ← Retour au registre
      </a>
    </main>
  );
}

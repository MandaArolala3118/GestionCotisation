'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [datePaiement, setDatePaiement] = useState('');
  const [messageCotisation, setMessageCotisation] = useState('');
  const [erreurCotisation, setErreurCotisation] = useState('');

  const [nouvelUsername, setNouvelUsername] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [messageUtilisateur, setMessageUtilisateur] = useState('');
  const [erreurUtilisateur, setErreurUtilisateur] = useState('');

  async function ajouterCotisation(e) {
    e.preventDefault();
    setMessageCotisation('');
    setErreurCotisation('');

    const reponse = await fetch('/api/cotisations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom,
        montant: Number(montant),
        date_paiement: datePaiement || undefined,
      }),
    });

    const donnees = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      setErreurCotisation(donnees.error || "Erreur lors de l'ajout de la cotisation.");
      return;
    }

    setMessageCotisation(`Cotisation ajoutée pour ${nom}.`);
    setNom('');
    setMontant('');
    setDatePaiement('');
  }

  async function ajouterUtilisateur(e) {
    e.preventDefault();
    setMessageUtilisateur('');
    setErreurUtilisateur('');

    const reponse = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: nouvelUsername, password: nouveauMotDePasse }),
    });

    const donnees = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      setErreurUtilisateur(donnees.error || "Erreur lors de la création de l'utilisateur.");
      return;
    }

    setMessageUtilisateur(`Utilisateur « ${nouvelUsername} » créé.`);
    setNouvelUsername('');
    setNouveauMotDePasse('');
  }

  async function seDeconnecter() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <main className="container">
      <div className="header">
        <h1>Tableau de bord</h1>
        <button onClick={seDeconnecter} className="btn btn-secondary">
          Se déconnecter
        </button>
      </div>

      <section className="section">
        <h2>Ajouter une cotisation</h2>
        <form onSubmit={ajouterCotisation} className="form">
          <label>
            Nom
            <input value={nom} onChange={(e) => setNom(e.target.value)} required />
          </label>
          <label>
            Montant (Ar)
            <input
              type="number"
              min="0"
              step="0.01"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
            />
          </label>
          <label>
            Date de paiement
            <input
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
            />
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              Laisser vide pour utiliser la date du jour.
            </span>
          </label>

          {erreurCotisation && <p className="erreur">{erreurCotisation}</p>}
          {messageCotisation && <p className="info">{messageCotisation}</p>}

          <button type="submit" className="btn btn-primary">
            Ajouter la cotisation
          </button>
        </form>
      </section>

      <section className="section">
        <h2>Créer un utilisateur</h2>
        <form onSubmit={ajouterUtilisateur} className="form">
          <label>
            Nom d&apos;utilisateur
            <input
              value={nouvelUsername}
              onChange={(e) => setNouvelUsername(e.target.value)}
              required
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              minLength={8}
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
              required
            />
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              8 caractères minimum. Stocké sous forme hachée (bcrypt).
            </span>
          </label>

          {erreurUtilisateur && <p className="erreur">{erreurUtilisateur}</p>}
          {messageUtilisateur && <p className="info">{messageUtilisateur}</p>}

          <button type="submit" className="btn btn-primary">
            Créer l&apos;utilisateur
          </button>
        </form>
      </section>

      <a href="/" className="lien-retour">
        ← Retour au registre
      </a>
    </main>
  );
}

'use client';

import { useState } from 'react';

export default function ParametresPage() {
  const [motDePasseActuel, setMotDePasseActuel] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  async function changerMotDePasse(e) {
    e.preventDefault();
    setMessage('');
    setErreur('');

    if (nouveauMotDePasse !== confirmationMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas.');
      return;
    }

    if (nouveauMotDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const reponse = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: motDePasseActuel,
        newPassword: nouveauMotDePasse,
      }),
    });

    const donnees = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      setErreur(donnees.error || "Erreur lors du changement de mot de passe.");
      return;
    }

    setMessage('Mot de passe changé avec succès.');
    setMotDePasseActuel('');
    setNouveauMotDePasse('');
    setConfirmationMotDePasse('');
  }

  return (
    <section className="section">
      <h2>Paramètres du compte</h2>
      <form onSubmit={changerMotDePasse} className="form">
        <label>
          Mot de passe actuel
          <input
            type="password"
            value={motDePasseActuel}
            onChange={(e) => setMotDePasseActuel(e.target.value)}
            required
          />
        </label>
        <label>
          Nouveau mot de passe
          <input
            type="password"
            minLength={8}
            value={nouveauMotDePasse}
            onChange={(e) => setNouveauMotDePasse(e.target.value)}
            required
          />
          <span className="muted" style={{ fontSize: '0.8rem' }}>
            8 caractères minimum.
          </span>
        </label>
        <label>
          Confirmer le nouveau mot de passe
          <input
            type="password"
            minLength={8}
            value={confirmationMotDePasse}
            onChange={(e) => setConfirmationMotDePasse(e.target.value)}
            required
          />
        </label>

        {erreur && <p className="erreur">{erreur}</p>}
        {message && <p className="info">{message}</p>}

        <button type="submit" className="btn btn-primary">
          Changer le mot de passe
        </button>
      </form>
    </section>
  );
}
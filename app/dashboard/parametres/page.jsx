'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ParametresPage() {
  const [motDePasseActuel, setMotDePasseActuel] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [chargementMotDePasse, setChargementMotDePasse] = useState(false);
  const [chargementReset, setChargementReset] = useState(false);

  async function changerMotDePasse(e) {
    e.preventDefault();
    
    if (chargementMotDePasse) return;
    setChargementMotDePasse(true);

    if (nouveauMotDePasse !== confirmationMotDePasse) {
      toast.error('Les mots de passe ne correspondent pas.');
      setChargementMotDePasse(false);
      return;
    }

    if (nouveauMotDePasse.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères.');
      setChargementMotDePasse(false);
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
      toast.error(donnees.error || "Erreur lors du changement de mot de passe.");
      setChargementMotDePasse(false);
      return;
    }

    toast.success('Mot de passe changé avec succès.');
    setMotDePasseActuel('');
    setNouveauMotDePasse('');
    setConfirmationMotDePasse('');
    setChargementMotDePasse(false);
  }

  async function resetDatabase() {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser la base de données ?\n\nCette action va supprimer :\n- Toutes les cotisations\n- Tous les membres de la communauté\n\nLes utilisateurs seront conservés.\n\nCette action est irréversible !')) {
      return;
    }
    
    if (chargementReset) return;
    setChargementReset(true);

    const reponse = await fetch('/api/reset-database', {
      method: 'POST',
    });

    const donnees = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      toast.error(donnees.error || "Erreur lors de la réinitialisation de la base de données.");
      setChargementReset(false);
      return;
    }

    toast.success('Base de données réinitialisée avec succès.');
    setChargementReset(false);
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

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={chargementMotDePasse}
        >
          {chargementMotDePasse ? 'Changement en cours...' : 'Changer le mot de passe'}
        </button>
      </form>

      <div className="section" style={{ marginTop: '3rem', borderTop: '2px solid var(--color-border)', paddingTop: '2rem' }}>
        <h2 style={{ color: 'var(--color-danger)' }}>Zone de danger</h2>
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Actions irréversibles sur la base de données
        </p>
        <button
          onClick={resetDatabase}
          className="btn btn-secondary"
          disabled={chargementReset}
          style={{ 
            color: 'var(--color-danger)', 
            borderColor: 'var(--color-danger)',
            width: '100%'
          }}
        >
          {chargementReset ? 'Réinitialisation en cours...' : 'Réinitialiser la base de données'}
        </button>
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Supprime toutes les cotisations et tous les membres de la communauté. Les utilisateurs sont conservés.
        </p>
      </div>
    </section>
  );
}
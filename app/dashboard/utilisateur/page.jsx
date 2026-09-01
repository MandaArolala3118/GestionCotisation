'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function UtilisateurPage() {
  const [nouvelUsername, setNouvelUsername] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(false);

  async function chargerUtilisateurs() {
    setChargement(true);
    try {
      const reponse = await fetch('/api/users');
      const donnees = await reponse.json();
      if (reponse.ok) {
        setUtilisateurs(donnees.utilisateurs || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerUtilisateurs();
  }, []);

  async function ajouterUtilisateur(e) {
    e.preventDefault();

    const reponse = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: nouvelUsername, password: nouveauMotDePasse }),
    });

    const donnees = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      toast.error(donnees.error || "Erreur lors de la création de l'utilisateur.");
      return;
    }

    toast.success(`Utilisateur « ${nouvelUsername} » créé.`);
    setNouvelUsername('');
    setNouveauMotDePasse('');
    chargerUtilisateurs();
  }

  return (
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

        <button type="submit" className="btn btn-primary">
          Créer l&apos;utilisateur
        </button>
      </form>

      <div className="section">
        <h3>Utilisateurs existants</h3>
        {chargement ? (
          <p className="muted">Chargement des utilisateurs...</p>
        ) : utilisateurs.length === 0 ? (
          <p className="muted">Aucun utilisateur existant.</p>
        ) : (
          <div className="utilisateurs-list">
            {utilisateurs.map((utilisateur) => (
              <div key={utilisateur.id} className="utilisateur-item">
                <div className="utilisateur-info">
                  <span className="utilisateur-username">{utilisateur.username}</span>
                  <span className="muted">
                    Créé le {new Date(utilisateur.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
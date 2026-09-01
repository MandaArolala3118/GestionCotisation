'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [ongletActif, setOngletActif] = useState('cotisation');

  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [datePaiement, setDatePaiement] = useState('');
  const [messageCotisation, setMessageCotisation] = useState('');
  const [erreurCotisation, setErreurCotisation] = useState('');

  const [nouvelUsername, setNouvelUsername] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [messageUtilisateur, setMessageUtilisateur] = useState('');
  const [erreurUtilisateur, setErreurUtilisateur] = useState('');
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargementUtilisateurs, setChargementUtilisateurs] = useState(false);

  // Communauté
  const [nomCommunaute, setNomCommunaute] = useState('');
  const [emailCommunaute, setEmailCommunaute] = useState('');
  const [messageCommunaute, setMessageCommunaute] = useState('');
  const [erreurCommunaute, setErreurCommunaute] = useState('');
  const [membresCommunaute, setMembresCommunaute] = useState([]);
  const [chargementCommunaute, setChargementCommunaute] = useState(false);
  const [pageCommunaute, setPageCommunaute] = useState(1);
  const [totalCommunaute, setTotalCommunaute] = useState(0);
  const itemsPerPageCommunaute = 10;

  // Paramètres - changement de mot de passe
  const [motDePasseActuel, setMotDePasseActuel] = useState('');
  const [nouveauMotDePassePerso, setNouveauMotDePassePerso] = useState('');
  const [confirmationMotDePasse, setConfirmationMotDePasse] = useState('');
  const [messageParametres, setMessageParametres] = useState('');
  const [erreurParametres, setErreurParametres] = useState('');

  async function chargerUtilisateurs() {
    setChargementUtilisateurs(true);
    try {
      const reponse = await fetch('/api/users');
      const donnees = await reponse.json();
      if (reponse.ok) {
        setUtilisateurs(donnees.utilisateurs || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setChargementUtilisateurs(false);
    }
  }

  useEffect(() => {
    if (ongletActif === 'utilisateur') {
      chargerUtilisateurs();
    }
  }, [ongletActif]);

  useEffect(() => {
    if (ongletActif === 'communaute') {
      chargerCommunaute();
    }
  }, [ongletActif, pageCommunaute]);

  async function chargerCommunaute() {
    setChargementCommunaute(true);
    try {
      const params = new URLSearchParams({
        page: pageCommunaute.toString(),
        limit: itemsPerPageCommunaute.toString(),
      });
      
      const reponse = await fetch(`/api/communaute?${params}`);
      const donnees = await reponse.json();
      if (reponse.ok) {
        setMembresCommunaute(donnees.membres || []);
        setTotalCommunaute(donnees.total || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la communauté:', error);
    } finally {
      setChargementCommunaute(false);
    }
  }

  async function ajouterMembreCommunaute(e) {
    e.preventDefault();
    setMessageCommunaute('');
    setErreurCommunaute('');

    const reponse = await fetch('/api/communaute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: nomCommunaute,
        email: emailCommunaute,
      }),
    });

    const donnees = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      setErreurCommunaute(donnees.error || "Erreur lors de l'ajout du membre.");
      return;
    }

    setMessageCommunaute(`Membre ${nomCommunaute} ajouté à la communauté.`);
    setNomCommunaute('');
    setEmailCommunaute('');
    chargerCommunaute();
  }

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
    chargerUtilisateurs();
  }

  async function changerMotDePasse(e) {
    e.preventDefault();
    setMessageParametres('');
    setErreurParametres('');

    if (nouveauMotDePassePerso !== confirmationMotDePasse) {
      setErreurParametres('Les mots de passe ne correspondent pas.');
      return;
    }

    if (nouveauMotDePassePerso.length < 8) {
      setErreurParametres('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    const reponse = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword: motDePasseActuel,
        newPassword: nouveauMotDePassePerso,
      }),
    });

    const donnees = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      setErreurParametres(donnees.error || "Erreur lors du changement de mot de passe.");
      return;
    }

    setMessageParametres('Mot de passe changé avec succès.');
    setMotDePasseActuel('');
    setNouveauMotDePassePerso('');
    setConfirmationMotDePasse('');
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

      {/* Onglets */}
      <div className="tabs-container">
        <button
          className={`tab ${ongletActif === 'cotisation' ? 'tab-active' : ''}`}
          onClick={() => setOngletActif('cotisation')}
        >
          Ajouter une cotisation
        </button>
        <button
          className={`tab ${ongletActif === 'utilisateur' ? 'tab-active' : ''}`}
          onClick={() => setOngletActif('utilisateur')}
        >
          Créer un utilisateur
        </button>
        <button
          className={`tab ${ongletActif === 'communaute' ? 'tab-active' : ''}`}
          onClick={() => setOngletActif('communaute')}
        >
          Communauté
        </button>
        <button
          className={`tab ${ongletActif === 'parametres' ? 'tab-active' : ''}`}
          onClick={() => setOngletActif('parametres')}
        >
          Paramètres
        </button>
      </div>

      {ongletActif === 'cotisation' && (
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
      )}

      {ongletActif === 'utilisateur' && (
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

          <div className="section">
            <h3>Utilisateurs existants</h3>
            {chargementUtilisateurs ? (
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
      )}

      {ongletActif === 'communaute' && (
        <section className="section">
          <h2>Gestion de la communauté</h2>
          
          {/* Formulaire d'ajout */}
          <form onSubmit={ajouterMembreCommunaute} className="form" style={{ marginBottom: '2rem' }}>
            <label>
              Nom
              <input
                value={nomCommunaute}
                onChange={(e) => setNomCommunaute(e.target.value)}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={emailCommunaute}
                onChange={(e) => setEmailCommunaute(e.target.value)}
                required
              />
            </label>

            {erreurCommunaute && <p className="erreur">{erreurCommunaute}</p>}
            {messageCommunaute && <p className="info">{messageCommunaute}</p>}

            <button type="submit" className="btn btn-primary">
              Ajouter à la communauté
            </button>
          </form>

          {/* Liste des membres avec pagination */}
          <div className="section">
            <h3>Membres de la communauté</h3>
            {chargementCommunaute ? (
              <p className="muted">Chargement des membres...</p>
            ) : membresCommunaute.length === 0 ? (
              <p className="muted">Aucun membre dans la communauté.</p>
            ) : (
              <>
                <div className="results-info">
                  <span className="muted">
                    {totalCommunaute} membre{totalCommunaute !== 1 ? 's' : ''} trouvé{totalCommunaute !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="utilisateurs-list">
                  {membresCommunaute.map((membre) => (
                    <div key={membre.id} className="utilisateur-item">
                      <div className="utilisateur-info">
                        <span className="utilisateur-username">{membre.nom}</span>
                        <span className="muted">{membre.email}</span>
                        <span className="muted">
                          Ajouté le {new Date(membre.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {Math.ceil(totalCommunaute / itemsPerPageCommunaute) > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setPageCommunaute(Math.max(1, pageCommunaute - 1))}
                      disabled={pageCommunaute === 1}
                      className="btn btn-secondary btn-sm"
                    >
                      ← Précédent
                    </button>
                    
                    <span className="pagination-info">
                      Page {pageCommunaute} sur {Math.ceil(totalCommunaute / itemsPerPageCommunaute)}
                    </span>
                    
                    <button
                      onClick={() => setPageCommunaute(Math.min(Math.ceil(totalCommunaute / itemsPerPageCommunaute), pageCommunaute + 1))}
                      disabled={pageCommunaute === Math.ceil(totalCommunaute / itemsPerPageCommunaute)}
                      className="btn btn-secondary btn-sm"
                    >
                      Suivant →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {ongletActif === 'parametres' && (
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
                value={nouveauMotDePassePerso}
                onChange={(e) => setNouveauMotDePassePerso(e.target.value)}
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

            {erreurParametres && <p className="erreur">{erreurParametres}</p>}
            {messageParametres && <p className="info">{messageParametres}</p>}

            <button type="submit" className="btn btn-primary">
              Changer le mot de passe
            </button>
          </form>
        </section>
      )}

      <a href="/" className="lien-retour">
        ← Retour au registre
      </a>
    </main>
  );
}

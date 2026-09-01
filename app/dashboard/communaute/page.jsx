'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function CommunautePage() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [membres, setMembres] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;
  
  // État pour l'édition
  const [membreEnEdition, setMembreEnEdition] = useState(null);
  const [nomEdition, setNomEdition] = useState('');
  const [emailEdition, setEmailEdition] = useState('');

  const chargerMembres = async () => {
    setChargement(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });
      
      const reponse = await fetch(`/api/communaute?${params}`);
      const donnees = await reponse.json();
      if (reponse.ok) {
        setMembres(donnees.membres || []);
        setTotal(donnees.total || 0);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des membres:', error);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerMembres();
  }, [page]);

  async function ajouterMembre(e) {
    e.preventDefault();

    const reponse = await fetch('/api/communaute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom,
        email,
      }),
    });

    const donnees = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      toast.error(donnees.error || "Erreur lors de l'ajout du membre.");
      return;
    }

    toast.success(`Membre ${nom} ajouté à la communauté.`);
    setNom('');
    setEmail('');
    chargerMembres();
  }

  async function supprimerMembre(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      return;
    }

    const reponse = await fetch(`/api/communaute/${id}`, {
      method: 'DELETE',
    });

    if (!reponse.ok) {
      const donnees = await reponse.json().catch(() => ({}));
      toast.error(donnees.error || "Erreur lors de la suppression du membre.");
      return;
    }

    toast.success('Membre supprimé avec succès.');
    chargerMembres();
  }

  function demarrerEdition(membre) {
    setMembreEnEdition(membre.id);
    setNomEdition(membre.nom);
    setEmailEdition(membre.email);
  }

  function annulerEdition() {
    setMembreEnEdition(null);
    setNomEdition('');
    setEmailEdition('');
  }

  async function mettreAJourMembre(e) {
    e.preventDefault();

    const reponse = await fetch(`/api/communaute/${membreEnEdition}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: nomEdition,
        email: emailEdition,
      }),
    });

    const donnees = await reponse.json().catch(() => ({}));

    if (!reponse.ok) {
      toast.error(donnees.error || "Erreur lors de la mise à jour du membre.");
      return;
    }

    toast.success('Membre mis à jour avec succès.');
    annulerEdition();
    chargerMembres();
  }

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <section className="section">
      <h2>Gestion de la communauté</h2>
      
      {/* Formulaire d'ajout */}
      <form onSubmit={ajouterMembre} className="form" style={{ marginBottom: '2rem' }}>
        <label>
          Nom
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="btn btn-primary">
          Ajouter à la communauté
        </button>
      </form>

      {/* Liste des membres avec pagination */}
      <div className="section">
        <h3>Membres de la communauté</h3>
        {chargement ? (
          <p className="muted">Chargement des membres...</p>
        ) : membres.length === 0 ? (
          <p className="muted">Aucun membre dans la communauté.</p>
        ) : (
          <>
            <div className="results-info">
              <span className="muted">
                {total} membre{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="utilisateurs-list">
              {membres.map((membre) => (
                <div key={membre.id} className="utilisateur-item">
                  {membreEnEdition === membre.id ? (
                    <form onSubmit={mettreAJourMembre} className="form" style={{ width: '100%' }}>
                      <label>
                        Nom
                        <input
                          value={nomEdition}
                          onChange={(e) => setNomEdition(e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Email
                        <input
                          type="email"
                          value={emailEdition}
                          onChange={(e) => setEmailEdition(e.target.value)}
                          required
                        />
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="submit" className="btn btn-primary btn-sm">
                          Enregistrer
                        </button>
                        <button 
                          type="button" 
                          onClick={annulerEdition}
                          className="btn btn-secondary btn-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
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
                      <div className="utilisateur-actions">
                        <button
                          onClick={() => demarrerEdition(membre)}
                          className="btn btn-secondary btn-sm"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => supprimerMembre(membre.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        >
                          Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary btn-sm"
                >
                  ← Précédent
                </button>
                
                <span className="pagination-info">
                  Page {page} sur {totalPages}
                </span>
                
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
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
  );
}
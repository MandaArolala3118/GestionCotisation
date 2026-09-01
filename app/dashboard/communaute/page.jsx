'use client';

import { useState, useEffect } from 'react';

export default function CommunautePage() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');
  const [membres, setMembres] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

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
    setMessage('');
    setErreur('');

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
      setErreur(donnees.error || "Erreur lors de l'ajout du membre.");
      return;
    }

    setMessage(`Membre ${nom} ajouté à la communauté.`);
    setNom('');
    setEmail('');
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

        {erreur && <p className="erreur">{erreur}</p>}
        {message && <p className="info">{message}</p>}

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
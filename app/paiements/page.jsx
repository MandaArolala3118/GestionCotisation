'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

function formaterMontant(valeur) {
  return `${Number(valeur).toLocaleString('fr-FR')} Ar`;
}

function formaterDate(dateIso) {
  return new Date(dateIso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtres
  const [filtreNom, setFiltreNom] = useState('');
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 20;

  const chargerPaiements = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (filtreNom) params.append('nom', filtreNom);
      if (filtreDateDebut) params.append('date_debut', filtreDateDebut);
      if (filtreDateFin) params.append('date_fin', filtreDateFin);
      
      const reponse = await fetch(`/api/paiements?${params}`);
      const donnees = await reponse.json();
      
      if (!reponse.ok) {
        setError(donnees.error || 'Erreur lors du chargement des paiements');
        return;
      }
      
      setPaiements(donnees.paiements || []);
      setTotal(donnees.total || 0);
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerPaiements();
  }, [page, filtreNom, filtreDateDebut, filtreDateFin]);

  const totalPages = Math.ceil(total / itemsPerPage);

  const reinitialiserFiltres = () => {
    setFiltreNom('');
    setFiltreDateDebut('');
    setFiltreDateFin('');
    setPage(1);
  };

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Tous les paiements</h1>
          <p className="muted" style={{ margin: 0 }}>
            Historique complet des cotisations
          </p>
        </div>
        <Link href="/" className="btn btn-secondary">
          ← Retour
        </Link>
      </div>

      {/* Filtres */}
      <section className="section">
        <div className="filtres-container">
          <div className="filtre-item">
            <label htmlFor="filtre-nom">Filtrer par nom</label>
            <input
              id="filtre-nom"
              type="text"
              value={filtreNom}
              onChange={(e) => {
                setFiltreNom(e.target.value);
                setPage(1);
              }}
              placeholder="Nom du payeur"
              className="filtre-input"
            />
          </div>
          
          <div className="filtre-item">
            <label htmlFor="filtre-date-debut">Date de début</label>
            <input
              id="filtre-date-debut"
              type="date"
              value={filtreDateDebut}
              onChange={(e) => {
                setFiltreDateDebut(e.target.value);
                setPage(1);
              }}
              className="filtre-input"
            />
          </div>
          
          <div className="filtre-item">
            <label htmlFor="filtre-date-fin">Date de fin</label>
            <input
              id="filtre-date-fin"
              type="date"
              value={filtreDateFin}
              onChange={(e) => {
                setFiltreDateFin(e.target.value);
                setPage(1);
              }}
              className="filtre-input"
            />
          </div>
          
          <button 
            onClick={reinitialiserFiltres}
            className="btn btn-secondary"
            disabled={!filtreNom && !filtreDateDebut && !filtreDateFin}
          >
            Réinitialiser
          </button>
        </div>
      </section>

      {error && <p className="erreur">{error}</p>}

      {loading ? (
        <p className="muted">Chargement des paiements...</p>
      ) : (
        <>
          <section className="section">
            <div className="results-info">
              <span className="muted">
                {total} paiement{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
              </span>
            </div>
            
            {paiements.length === 0 ? (
              <p className="muted">Aucun paiement trouvé avec ces filtres.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Montant</th>
                      <th>Date de paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiements.map((paiement) => (
                      <tr key={paiement.id}>
                        <td>{paiement.nom}</td>
                        <td>{formaterMontant(paiement.montant)}</td>
                        <td>{formaterDate(paiement.date_paiement)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Pagination */}
          {totalPages > 1 && (
            <section className="section">
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
            </section>
          )}
        </>
      )}
    </main>
  );
}

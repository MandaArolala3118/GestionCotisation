'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

function formaterMontant(valeur) {
  return `${Number(valeur).toLocaleString('fr-FR')} Ar`;
}

export default function RapportsPage() {
  const [rapports, setRapports] = useState([]);
  const [annee, setAnnee] = useState(null);
  const [anneesDisponibles, setAnneesDisponibles] = useState([]);
  const [totalAnnuel, setTotalAnnuel] = useState(0);
  const [totalPaiements, setTotalPaiements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const initialLoadRef = useRef(true);

  const chargerRapports = async (selectedAnnee) => {
    setLoading(true);
    setError('');
    
    try {
      const reponse = await fetch(`/api/rapports?annee=${selectedAnnee}`);
      const donnees = await reponse.json();
      
      if (!reponse.ok) {
        setError(donnees.error || 'Erreur lors du chargement des rapports');
        return;
      }
      
      setRapports(donnees.rapports || []);
      setAnneesDisponibles(donnees.anneesDisponibles || []);
      setTotalAnnuel(donnees.totalAnnuel || 0);
      setTotalPaiements(donnees.totalPaiements || 0);
      
      // Premier chargement : utiliser l'année la plus récente disponible
      if (initialLoadRef.current && donnees.anneesDisponibles && donnees.anneesDisponibles.length > 0) {
        setAnnee(donnees.anneesDisponibles[0]);
        initialLoadRef.current = false;
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  // Premier chargement pour récupérer les années disponibles
  useEffect(() => {
    chargerRapports(new Date().getFullYear());
  }, []);

  // Recharger quand l'année change (après initialisation)
  useEffect(() => {
    if (!initialLoadRef.current && annee !== null) {
      chargerRapports(annee);
    }
  }, [annee]);

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Rapports mensuels</h1>
          <p className="muted" style={{ margin: 0 }}>
            Détail des cotisations par mois
          </p>
        </div>
        <Link href="/" className="btn btn-secondary">
          ← Retour
        </Link>
      </div>

      {/* Sélecteur d'année */}
      <section className="section">
        <div className="annee-selector">
          <label htmlFor="annee-select">Année :</label>
          <select
            id="annee-select"
            value={annee || ''}
            onChange={(e) => setAnnee(parseInt(e.target.value))}
            className="annee-select"
            disabled={anneesDisponibles.length === 0}
          >
            {anneesDisponibles.length === 0 ? (
              <option value="">Chargement...</option>
            ) : (
              anneesDisponibles.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))
            )}
          </select>
        </div>
      </section>

      {error && <p className="erreur">{error}</p>}

      {loading ? (
        <p className="muted">Chargement des rapports...</p>
      ) : (
        <>
          {/* Résumé annuel */}
          <section className="section">
            <div className="resume-annuel">
              <div className="resume-card">
                <span className="resume-label">Total annuel</span>
                <span className="resume-value resume-value-primary">
                  {formaterMontant(totalAnnuel)}
                </span>
              </div>
              <div className="resume-card">
                <span className="resume-label">Total paiements</span>
                <span className="resume-value">
                  {totalPaiements}
                </span>
              </div>
            </div>
          </section>

          {/* Rapports mensuels */}
          <section className="section">
            <h2>Rapport {annee || '...'}</h2>
            {annee === null ? (
              <p className="muted">Chargement des données...</p>
            ) : rapports.length === 0 ? (
              <p className="muted">Aucune cotisation enregistrée pour cette année.</p>
            ) : (
              <div className="cards-grid">
                {rapports.map((rapport) => (
                  <div key={rapport.mois} className="card">
                    <div className="card-header">
                      <span className="card-year">{rapport.mois}</span>
                    </div>
                    <div className="card-body">
                      <div className="card-stat">
                        <span className="card-label">Paiements</span>
                        <span className="card-value">{rapport.nombre}</span>
                      </div>
                      <div className="card-stat">
                        <span className="card-label">Total</span>
                        <span className="card-value card-value-primary">
                          {formaterMontant(rapport.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

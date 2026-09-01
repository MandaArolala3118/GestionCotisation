'use client';

import { useState } from 'react';

export default function CotisationPage() {
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [datePaiement, setDatePaiement] = useState('');
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  async function ajouterCotisation(e) {
    e.preventDefault();
    setMessage('');
    setErreur('');

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
      setErreur(donnees.error || "Erreur lors de l'ajout de la cotisation.");
      return;
    }

    setMessage(`Cotisation ajoutée pour ${nom}.`);
    setNom('');
    setMontant('');
    setDatePaiement('');
  }

  return (
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

        {erreur && <p className="erreur">{erreur}</p>}
        {message && <p className="info">{message}</p>}

        <button type="submit" className="btn btn-primary">
          Ajouter la cotisation
        </button>
      </form>
    </section>
  );
}
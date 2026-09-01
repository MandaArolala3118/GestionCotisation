import Link from 'next/link';
import { getSupabaseAdmin } from '../lib/supabaseAdmin';

// La page affiche des données à jour à chaque visite : pas de mise en cache statique.
export const dynamic = 'force-dynamic';

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

async function getRapportAnnuel() {
  const { data, error } = await getSupabaseAdmin()
    .from('cotisations')
    .select('montant, date_paiement');

  if (error || !data) return [];

  const parAnnee = new Map();
  for (const cotisation of data) {
    const annee = new Date(cotisation.date_paiement).getFullYear();
    const entree = parAnnee.get(annee) || { annee, total: 0, nombre: 0 };
    entree.total += Number(cotisation.montant);
    entree.nombre += 1;
    parAnnee.set(annee, entree);
  }

  return Array.from(parAnnee.values()).sort((a, b) => b.annee - a.annee);
}

async function getPayeursRecents() {
  const dateLimite = new Date();
  dateLimite.setMonth(dateLimite.getMonth() - 3);
  const dateLimiteIso = dateLimite.toISOString().slice(0, 10);

  const { data, error } = await getSupabaseAdmin()
    .from('cotisations')
    .select('nom, montant, date_paiement')
    .gte('date_paiement', dateLimiteIso)
    .order('date_paiement', { ascending: false });

  if (error || !data) return [];

  // On garde tous les paiements, y compris les montants négatifs
  return data;
}

export default async function HomePage() {
  let rapport = [];
  let payeurs = [];
  let erreurChargement = false;

  try {
    [rapport, payeurs] = await Promise.all([getRapportAnnuel(), getPayeursRecents()]);
  } catch {
    erreurChargement = true;
  }

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1>Registre des cotisations</h1>
          <p className="muted" style={{ margin: 0 }}>
            Suivi des cotisations par année et par membre
          </p>
        </div>
        <Link href="/connexion" className="btn btn-primary">
          Connexion
        </Link>
      </div>

      {erreurChargement ? (
        <div className="section">
          <p className="erreur">
            Le registre est momentanément indisponible. Vérifie la configuration Supabase.
          </p>
        </div>
      ) : (
        <>
          <section className="section">
            <div className="section-header">
              <h2>Cotisations par année</h2>
              <Link href="/rapports" className="lien-section">
                Voir rapport
              </Link>
            </div>
            {rapport.length === 0 ? (
              <p className="muted">Aucune cotisation enregistrée pour le moment.</p>
            ) : (
              <div className="cards-grid">
                {rapport.map((ligne) => (
                  <div key={ligne.annee} className="card">
                    <div className="card-header">
                      <span className="card-year">{ligne.annee}</span>
                    </div>
                    <div className="card-body">
                      <div className="card-stat">
                        <span className="card-label">Paiements</span>
                        <span className="card-value">{ligne.nombre}</span>
                      </div>
                      <div className="card-stat">
                        <span className="card-label">Total</span>
                        <span className="card-value card-value-primary">{formaterMontant(ligne.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="section">
            <div className="section-header">
              <h2>Ont payé ces 3 derniers mois</h2>
              <Link href="/paiements" className="lien-section">
                Voir tous les paiements
              </Link>
            </div>
            {payeurs.length === 0 ? (
              <p className="muted">Personne n&apos;a encore payé ce trimestre.</p>
            ) : (
              <div className="payeurs-list">
                {payeurs.map((payeur, index) => (
                  <div 
                    key={`${payeur.nom}-${payeur.date_paiement}-${index}`}
                    className="payeur-item"
                    style={payeur.montant < 0 ? { backgroundColor: '#ffe5e5' } : {}}
                  >
                    <div className="payeur-info">
                      <span className="payeur-nom">{payeur.nom}</span>
                      <span className="muted">{formaterDate(payeur.date_paiement)}</span>
                    </div>
                    <span className={`payeur-montant ${payeur.montant < 0 ? 'payeur-montant-negative' : ''}`}>
                      {formaterMontant(payeur.montant)}
                    </span>
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

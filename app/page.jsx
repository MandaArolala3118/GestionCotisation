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
    .select('nom, date_paiement')
    .gte('date_paiement', dateLimiteIso)
    .order('date_paiement', { ascending: false });

  if (error || !data) return [];

  // Un même nom peut apparaître plusieurs fois : on ne garde que le paiement le plus récent.
  const dejaVus = new Set();
  const resultat = [];
  for (const cotisation of data) {
    if (!dejaVus.has(cotisation.nom)) {
      dejaVus.add(cotisation.nom);
      resultat.push(cotisation);
    }
  }
  return resultat;
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
        <p className="erreur">
          Le registre est momentanément indisponible. Vérifie la configuration Supabase.
        </p>
      ) : (
        <>
          <section className="section">
            <h2>Cotisations par année</h2>
            {rapport.length === 0 ? (
              <p className="muted">Aucune cotisation enregistrée pour le moment.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Année</th>
                    <th>Paiements</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rapport.map((ligne) => (
                    <tr key={ligne.annee}>
                      <td>{ligne.annee}</td>
                      <td>{ligne.nombre}</td>
                      <td>{formaterMontant(ligne.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="section">
            <h2>Ont payé ces 3 derniers mois</h2>
            {payeurs.length === 0 ? (
              <p className="muted">Personne n&apos;a encore payé ce trimestre.</p>
            ) : (
              <ul className="list">
                {payeurs.map((payeur) => (
                  <li key={payeur.nom}>
                    <span>{payeur.nom}</span>
                    <span className="muted">{formaterDate(payeur.date_paiement)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

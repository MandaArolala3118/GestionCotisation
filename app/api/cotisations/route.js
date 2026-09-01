import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { verifySessionToken, SESSION_COOKIE_NAME } from '../../../lib/session';
import { sendBulkEmail } from '../../../lib/email';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

// Liste des cotisations (lecture publique, utilisée pour le rapport de la page d'accueil)
export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('cotisations')
    .select('id, nom, montant, date_paiement')
    .order('date_paiement', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ cotisations: data });
}

// Ajout d'une cotisation (réservé aux personnes connectées)
export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const { nom, montant, date_paiement } = await request.json().catch(() => ({}));

  if (!nom || montant === undefined || montant === null || Number.isNaN(Number(montant))) {
    return NextResponse.json({ error: 'Nom et montant sont requis.' }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('cotisations')
    .insert({
      nom: String(nom).trim(),
      montant: Number(montant),
      date_paiement: date_paiement || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Récupérer les emails de la communauté
  const { data: membres, error: errorMembres } = await getSupabaseAdmin()
    .from('communaute')
    .select('email');

  if (!errorMembres && membres && membres.length > 0) {
    const emails = membres.map(m => m.email);
    const montantNumerique = Number(montant);
    const typeOperation = montantNumerique >= 0 ? 'versement' : 'dépense';
    const montantAbsolu = Math.abs(montantNumerique);
    const montantFormate = montantAbsolu.toLocaleString('fr-FR') + ' Ar';

    const subject = `Nouvelle ${typeOperation} : ${montantFormate} de ${nom}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${montantNumerique >= 0 ? '#28a745' : '#dc3545'};">
          Nouvelle ${typeOperation}
        </h2>
        <p>Bonjour,</p>
        <p>Une nouvelle ${typeOperation} a été enregistrée :</p>
        <ul>
          <li><strong>Nom :</strong> ${nom}</li>
          <li><strong>Montant :</strong> ${montantFormate}</li>
          <li><strong>Type :</strong> ${typeOperation.charAt(0).toUpperCase() + typeOperation.slice(1)}</li>
          <li><strong>Date :</strong> ${new Date(data.date_paiement).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}</li>
        </ul>
        <p style="margin-top: 2rem;">
          <a href="https://gestion-cotisation-virid.vercel.app/" 
             style="background-color: #8B7355; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Voir le registre des cotisations
          </a>
        </p>
        <p style="color: #666; font-size: 0.9em; margin-top: 1.5rem;">
          Ceci est un message automatique. Merci de ne pas répondre.
        </p>
      </div>
    `;

    // Envoyer les emails en arrière-plan (ne pas bloquer la réponse)
    sendBulkEmail(emails, subject, html).catch(err => {
      console.error('Erreur lors de l\'envoi des emails à la communauté:', err);
    });
  }

  return NextResponse.json({ cotisation: data }, { status: 201 });
}

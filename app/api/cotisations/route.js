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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle ${typeOperation}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
          <tr>
            <td align="center" style="padding: 20px;">
              <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #dddddd;">
                <tr>
                  <td style="padding: 30px;">
                    <h2 style="color: ${montantNumerique >= 0 ? '#28a745' : '#dc3545'}; margin: 0 0 20px 0; font-size: 24px;">
                      Nouvelle ${typeOperation}
                    </h2>
                    <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
                      Bonjour,
                    </p>
                    <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
                      Une nouvelle ${typeOperation} a été enregistrée :
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">
                          <strong>Nom :</strong> ${nom}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eeeeeee;">
                          <strong>Montant :</strong> ${montantFormate}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #eeeeeee;">
                          <strong>Type :</strong> ${typeOperation.charAt(0).toUpperCase() + typeOperation.slice(1)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0;">
                          <strong>Date :</strong> ${new Date(data.date_paiement).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td>
                          <a href="https://gestion-cotisation-virid.vercel.app/" 
                             style="background-color: #8B7355; color: #ffffff; padding: 12px 24px; text-decoration: none; display: inline-block; font-size: 14px;">
                            Voir le registre des cotisations
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 30px 0 0 0; font-size: 12px; color: #666666; line-height: 1.5;">
                      Ceci est un message automatique. Merci de ne pas répondre.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Attendre que tous les emails soient envoyés avant de retourner la réponse
    try {
      const results = await sendBulkEmail(emails, subject, html);
      const failedEmails = results.filter(r => !r.success);
      
      if (failedEmails.length > 0) {
        console.error('Erreurs lors de l\'envoi des emails:', failedEmails);
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi des emails à la communauté:', err);
    }
  }

  return NextResponse.json({ cotisation: data }, { status: 201 });
}

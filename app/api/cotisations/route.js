import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { verifySessionToken, SESSION_COOKIE_NAME } from '../../../lib/session';

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
  return NextResponse.json({ cotisation: data }, { status: 201 });
}

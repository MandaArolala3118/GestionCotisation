import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { verifySessionToken, SESSION_COOKIE_NAME } from '../../../../lib/session';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

// Mettre à jour un membre de la communauté (réservé aux personnes connectées)
export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const { id } = await params;
  const { nom, email } = await request.json().catch(() => ({}));

  if (!nom || !email) {
    return NextResponse.json(
      { error: 'Nom et email sont requis.' },
      { status: 400 }
    );
  }

  // Validation de l'email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Format d\'email invalide.' },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabaseAdmin()
    .from('communaute')
    .update({
      nom: String(nom).trim(),
      email: String(email).trim().toLowerCase(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cet email existe déjà dans la communauté.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!data) {
    return NextResponse.json({ error: 'Membre non trouvé.' }, { status: 404 });
  }
  
  return NextResponse.json({ membre: data }, { status: 200 });
}

// Supprimer un membre de la communauté (réservé aux personnes connectées)
export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await getSupabaseAdmin()
    .from('communaute')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Membre supprimé avec succès.' }, { status: 200 });
}
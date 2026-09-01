import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { verifySessionToken, SESSION_COOKIE_NAME } from '../../../lib/session';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

// Liste des membres de la communauté (réservé aux personnes connectées)
export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await getSupabaseAdmin()
      .from('communaute')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      membres: data || [],
      total: count || 0,
      page,
      limit,
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Ajouter un membre à la communauté (réservé aux personnes connectées)
export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

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
    .insert({
      nom: String(nom).trim(),
      email: String(email).trim().toLowerCase(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Cet email existe déjà dans la communauté.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ membre: data }, { status: 201 });
}
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { hashPassword } from '../../../lib/password';
import { verifySessionToken, SESSION_COOKIE_NAME } from '../../../lib/session';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

// Liste des utilisateurs (réservé aux personnes connectées)
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('app_users')
    .select('id, username, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ utilisateurs: data });
}

// Création d'un utilisateur autorisé à se connecter (réservé aux personnes déjà connectées)
export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const { username, password } = await request.json().catch(() => ({}));

  if (!username || !password) {
    return NextResponse.json(
      { error: "Nom d'utilisateur et mot de passe requis." },
      { status: 400 }
    );
  }
  if (String(password).length < 8) {
    return NextResponse.json(
      { error: 'Le mot de passe doit contenir au moins 8 caractères.' },
      { status: 400 }
    );
  }

  const password_hash = await hashPassword(password);

  const { data, error } = await getSupabaseAdmin()
    .from('app_users')
    .insert({ username: String(username).trim(), password_hash })
    .select('id, username, created_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: "Ce nom d'utilisateur existe déjà." }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ utilisateur: data }, { status: 201 });
}

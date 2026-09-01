import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { verifyPassword } from '../../../../lib/password';
import { createSessionToken, SESSION_COOKIE_NAME } from '../../../../lib/session';

export async function POST(request) {
  const { username, password } = await request.json().catch(() => ({}));

  if (!username || !password) {
    return NextResponse.json(
      { error: "Nom d'utilisateur et mot de passe requis." },
      { status: 400 }
    );
  }

  const { data: utilisateur, error } = await getSupabaseAdmin()
    .from('app_users')
    .select('id, username, password_hash')
    .eq('username', username)
    .maybeSingle();

  if (error) {
    console.error('[login] erreur Supabase :', error.message);
    return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
  }

  if (!utilisateur) {
    console.error(`[login] aucun utilisateur trouvé pour "${username}"`);
    return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
  }

  const motDePasseValide = await verifyPassword(password, utilisateur.password_hash);
  if (!motDePasseValide) {
    console.error(`[login] mot de passe incorrect pour "${username}"`);
    return NextResponse.json({ error: 'Identifiants invalides.' }, { status: 401 });
  }

  const token = await createSessionToken({ sub: utilisateur.id, username: utilisateur.username });

  const reponse = NextResponse.json({ success: true });
  reponse.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return reponse;
}
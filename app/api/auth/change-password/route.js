import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../../lib/supabaseAdmin';
import { hashPassword, verifyPassword } from '../../../../lib/password';
import { verifySessionToken, SESSION_COOKIE_NAME } from '../../../../lib/session';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json().catch(() => ({}));

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: 'Mot de passe actuel et nouveau mot de passe requis.' },
      { status: 400 }
    );
  }

  if (String(newPassword).length < 8) {
    return NextResponse.json(
      { error: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' },
      { status: 400 }
    );
  }

  // Récupérer l'utilisateur actuel
  const { data: user, error: userError } = await getSupabaseAdmin()
    .from('app_users')
    .select('id, password_hash')
    .eq('id', session.sub)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'Utilisateur non trouvé.' }, { status: 404 });
  }

  // Vérifier le mot de passe actuel
  const isPasswordValid = await verifyPassword(currentPassword, user.password_hash);
  if (!isPasswordValid) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });
  }

  // Hasher le nouveau mot de passe
  const newPasswordHash = await hashPassword(newPassword);

  // Mettre à jour le mot de passe
  const { error: updateError } = await getSupabaseAdmin()
    .from('app_users')
    .update({ password_hash: newPasswordHash })
    .eq('id', session.sub);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Mot de passe changé avec succès.' }, { status: 200 });
}
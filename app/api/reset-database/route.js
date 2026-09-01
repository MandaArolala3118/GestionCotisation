import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';
import { verifySessionToken, SESSION_COOKIE_NAME } from '../../../lib/session';

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return token ? verifySessionToken(token) : null;
}

// Réinitialiser la base de données (supprimer cotisations et communauté, garder utilisateurs)
export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Récupérer tous les IDs des cotisations
    const { data: cotisations, error: errorSelect } = await supabase
      .from('cotisations')
      .select('id');

    if (errorSelect) {
      return NextResponse.json({ error: errorSelect.message }, { status: 500 });
    }

    // Supprimer toutes les cotisations par leurs IDs
    if (cotisations && cotisations.length > 0) {
      const ids = cotisations.map(c => c.id);
      const { error: errorCotisations } = await supabase
        .from('cotisations')
        .delete()
        .in('id', ids);

      if (errorCotisations) {
        return NextResponse.json({ error: errorCotisations.message }, { status: 500 });
      }
    }

    // Récupérer tous les IDs de la communauté
    const { data: communaute, error: errorSelectCommunaute } = await supabase
      .from('communaute')
      .select('id');

    if (errorSelectCommunaute) {
      return NextResponse.json({ error: errorSelectCommunaute.message }, { status: 500 });
    }

    // Supprimer tous les membres de la communauté par leurs IDs
    if (communaute && communaute.length > 0) {
      const ids = communaute.map(c => c.id);
      const { error: errorCommunaute } = await supabase
        .from('communaute')
        .delete()
        .in('id', ids);

      if (errorCommunaute) {
        return NextResponse.json({ error: errorCommunaute.message }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: 'Base de données réinitialisée avec succès. Les utilisateurs ont été conservés.' 
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

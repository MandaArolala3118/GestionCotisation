import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const filtreNom = searchParams.get('nom') || '';
    const filtreDateDebut = searchParams.get('date_debut') || '';
    const filtreDateFin = searchParams.get('date_fin') || '';
    
    const offset = (page - 1) * limit;
    
    let query = getSupabaseAdmin()
      .from('cotisations')
      .select('*', { count: 'exact' });
    
    // Filtre par nom
    if (filtreNom) {
      query = query.ilike('nom', `%${filtreNom}%`);
    }
    
    // Filtre par date de début
    if (filtreDateDebut) {
      query = query.gte('date_paiement', filtreDateDebut);
    }
    
    // Filtre par date de fin
    if (filtreDateFin) {
      query = query.lte('date_paiement', filtreDateFin);
    }
    
    // Pagination
    query = query
      .order('date_paiement', { ascending: false })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    return Response.json({
      paiements: data || [],
      total: count || 0,
      page,
      limit,
    });
    
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

import { getSupabaseAdmin } from '../../../lib/supabaseAdmin';

const nomsMois = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const annee = parseInt(searchParams.get('annee')) || new Date().getFullYear();
    
    // Récupérer toutes les années disponibles
    const { data: anneesData, error: anneesError } = await getSupabaseAdmin()
      .from('cotisations')
      .select('date_paiement');
    
    if (anneesError) {
      return Response.json({ error: anneesError.message }, { status: 500 });
    }
    
    // Extraire les années uniques
    const anneesSet = new Set();
    for (const cotisation of anneesData || []) {
      const anneeDispo = new Date(cotisation.date_paiement).getFullYear();
      anneesSet.add(anneeDispo);
    }
    
    const anneesDisponibles = Array.from(anneesSet).sort((a, b) => b - a);
    
    const dateDebut = `${annee}-01-01`;
    const dateFin = `${annee}-12-31`;
    
    const { data, error } = await getSupabaseAdmin()
      .from('cotisations')
      .select('montant, date_paiement')
      .gte('date_paiement', dateDebut)
      .lte('date_paiement', dateFin)
      .order('date_paiement', { ascending: true });
    
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    
    // Grouper par mois
    const parMois = new Array(12).fill(null).map(() => ({
      mois: '',
      total: 0,
      nombre: 0
    }));
    
    for (const cotisation of data || []) {
      const date = new Date(cotisation.date_paiement);
      const moisIndex = date.getMonth();
      
      parMois[moisIndex].mois = nomsMois[moisIndex];
      parMois[moisIndex].total += Number(cotisation.montant);
      parMois[moisIndex].nombre += 1;
    }
    
    // Filtrer les mois sans données
    const rapports = parMois.filter(m => m.nombre > 0);
    
    // Calculer le total annuel
    const totalAnnuel = rapports.reduce((sum, m) => sum + m.total, 0);
    const totalPaiements = rapports.reduce((sum, m) => sum + m.nombre, 0);
    
    return Response.json({
      annee,
      anneesDisponibles,
      rapports,
      totalAnnuel,
      totalPaiements
    });
    
  } catch (error) {
    return Response.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

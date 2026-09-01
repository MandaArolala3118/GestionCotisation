'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ongletActif, setOngletActif] = useState('cotisation');

  // Déterminer l'onglet actif basé sur le pathname
  useEffect(() => {
    if (pathname === '/dashboard') {
      setOngletActif('cotisation');
    } else if (pathname.startsWith('/dashboard/')) {
      const segment = pathname.split('/')[2];
      setOngletActif(segment || 'cotisation');
    }
  }, [pathname]);

  async function seDeconnecter() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <main className="container">
      <div className="header">
        <h1>Tableau de bord</h1>
        <button onClick={seDeconnecter} className="btn btn-secondary">
          Se déconnecter
        </button>
      </div>

      {/* Onglets */}
      <div className="tabs-container">
        <Link 
          href="/dashboard/cotisation" 
          className={`tab ${ongletActif === 'cotisation' ? 'tab-active' : ''}`}
        >
          Ajouter une cotisation
        </Link>
        <Link 
          href="/dashboard/utilisateur" 
          className={`tab ${ongletActif === 'utilisateur' ? 'tab-active' : ''}`}
        >
          Créer un utilisateur
        </Link>
        <Link 
          href="/dashboard/communaute" 
          className={`tab ${ongletActif === 'communaute' ? 'tab-active' : ''}`}
        >
          Communauté
        </Link>
        <Link 
          href="/dashboard/parametres" 
          className={`tab ${ongletActif === 'parametres' ? 'tab-active' : ''}`}
        >
          Paramètres
        </Link>
      </div>

      {children}

      <a href="/" className="lien-retour">
        ← Retour au registre
      </a>
    </main>
  );
}
import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { useAuth } from './auth/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { Skeleton } from './components/ui/skeleton';

import Catalogue from './pages/Catalogue';
import LoginPage from './pages/LoginPage';
import Paiement from './pages/Paiement';
import MesRapports from './pages/MesRapports';

// L'analyse comparative et l'administration ne concernent qu'une partie des
// visiteurs : les charger a la demande evite d'imposer leur poids — et celui
// de Recharts — a quelqu'un qui vient acheter un rapport.
const Profil = lazy(() => import('./pages/Profil'));
const Parametres = lazy(() => import('./pages/Parametres'));

// Pages institutionnelles : consultees rarement, chargees a la demande.
const APropos = lazy(() => import('./pages/institutionnel/APropos'));
const Contact = lazy(() => import('./pages/institutionnel/Contact'));
const AvertissementRisques = lazy(() => import('./pages/institutionnel/AvertissementRisques'));
const MentionsLegales = lazy(() => import('./pages/institutionnel/MentionsLegales'));


// Analyse comparative : publique, chargee a la demande.
const Comparateur = lazy(() => import('./pages/analyse/Comparateur'));
const Regional = lazy(() => import('./pages/analyse/Regional'));
const Glossaire = lazy(() => import('./pages/ressources/Glossaire'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminSecteurs = lazy(() => import('./pages/admin/Secteurs'));
const AdminSecteurDonnees = lazy(() => import('./pages/admin/SecteurDonnees'));
const AdminRapports = lazy(() => import('./pages/admin/Rapports'));
const AdminRapportEdition = lazy(() => import('./pages/admin/RapportEdition'));
const AdminComptes = lazy(() => import('./pages/admin/Comptes'));

/**
 * Exige un compte connecte, quel que soit son role.
 *
 * La destination tentee est transmise a l'ecran de connexion : sans elle, un
 * visiteur qui clique « Commander » se retrouve sur le catalogue apres s'etre
 * connecte et doit refaire son choix, sans comprendre pourquoi.
 */
function RequiertCompte({ children }: { children: ReactNode }) {
  const { estConnecte } = useAuth();
  const emplacement = useLocation();

  if (estConnecte) return <>{children}</>;
  return <Navigate to="/login" replace state={{ retour: emplacement.pathname }} />;
}

/**
 * Exige le role administrateur.
 * Un client qui tente une URL du panneau de controle est renvoye au catalogue
 * et non vers la connexion : il est deja authentifie, il n'a simplement pas
 * acces — l'envoyer sur un formulaire de connexion serait trompeur.
 */
function RequiertAdmin({ children }: { children: ReactNode }) {
  const { estConnecte, estAdmin } = useAuth();
  if (!estConnecte) return <Navigate to="/login" replace />;
  return estAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

function Chargement() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-64 w-full rounded-[var(--radius-card)]" />
    </div>
  );
}

export default function App() {
  const { chargement } = useAuth();

  // Tant que la session n'est pas revalidee, afficher les routes ferait
  // clignoter la page de connexion sous les yeux d'un utilisateur deja connecte.
  if (chargement) {
    return (
      <AppShell>
        <Chargement />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Suspense fallback={<Chargement />}>
        <Routes>
          {/* Le catalogue est la porte d'entree publique du service (CDC section 3). */}
          <Route path="/" element={<Catalogue />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Commander exige un compte : la commande doit etre rattachee a
              un titulaire pour que le rapport lui reste accessible.
              L'apercu gratuit, lui, reste ouvert a tous. */}
          <Route path="/paiement/:id" element={<RequiertCompte><Paiement /></RequiertCompte>} />

          {/* Pages institutionnelles : publiques par nature — les mentions
              legales et l'avertissement sur les risques doivent etre lisibles
              sans compte. */}
          <Route path="/a-propos" element={<APropos />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/avertissement-risques" element={<AvertissementRisques />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />

          {/* Analyse comparative : publique elle aussi. Un investisseur doit
              pouvoir juger la valeur du service avant de creer un compte. */}
          <Route path="/analyse/secteurs" element={<Comparateur />} />
          <Route path="/analyse/regional" element={<Regional />} />
          <Route path="/ressources/glossaire" element={<Glossaire />} />

          <Route path="/mes-rapports" element={<RequiertCompte><MesRapports /></RequiertCompte>} />
          <Route path="/profil" element={<RequiertCompte><Profil /></RequiertCompte>} />
          <Route path="/parametres" element={<RequiertCompte><Parametres /></RequiertCompte>} />





          <Route path="/admin" element={<RequiertAdmin><AdminDashboard /></RequiertAdmin>} />
          <Route path="/admin/secteurs" element={<RequiertAdmin><AdminSecteurs /></RequiertAdmin>} />
          <Route path="/admin/secteurs/:id" element={<RequiertAdmin><AdminSecteurDonnees /></RequiertAdmin>} />
          <Route path="/admin/rapports" element={<RequiertAdmin><AdminRapports /></RequiertAdmin>} />
          <Route path="/admin/rapports/:id" element={<RequiertAdmin><AdminRapportEdition /></RequiertAdmin>} />
          <Route path="/admin/comptes" element={<RequiertAdmin><AdminComptes /></RequiertAdmin>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

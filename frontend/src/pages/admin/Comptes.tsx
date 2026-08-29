import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, User, UserCog, Users } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import {
  ChampRecherche, TableWrapper, Tbody, Td, Th, Thead, Tr, TrMessage,
} from '@/components/ui/table';
import { useTraduction } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import type { Compte, Role } from '@/lib/types';
import { cn, formatDate, formatNombre, initiales } from '@/lib/utils';

type Filtre = 'tous' | Role;

function filtres(t: Dictionnaire): { cle: Filtre; libelle: string }[] {
  return [
    { cle: 'tous', libelle: t.admin.filtreTous },
    { cle: 'admin', libelle: t.admin.filtreAdministrateurs },
    { cle: 'client', libelle: t.admin.filtreClients },
  ];
}

export default function Comptes() {
  const { t } = useTraduction();
  const queryClient = useQueryClient();
  const { compte: moi } = useAuth();
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');

  const comptes = useQuery({ queryKey: cles.adminComptes, queryFn: api.comptes });

  const changerRole = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) => api.setRole(id, role),
    onSuccess: ({ compte }) => {
      toast.success(t.admin.roleChange(compte.prenom ?? compte.email, compte.role));
      queryClient.invalidateQueries({ queryKey: cles.adminComptes });
    },
    // Les garde-fous vivent côté serveur (dernier administrateur, auto-rétrogradation) :
    // on affiche son refus tel quel plutôt que de dupliquer la règle ici.
    onError: (erreur: Error) => toast.error(t.admin.changementRefuse, { description: erreur.message }),
  });

  const tous = comptes.data?.comptes ?? [];

  const liste = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return tous.filter((c) => {
      if (filtre !== 'tous' && c.role !== filtre) return false;
      if (!terme) return true;
      return [c.email, c.nom, c.prenom, c.entreprise]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(terme));
    });
  }, [tous, recherche, filtre]);

  const admins = tous.filter((c) => c.role === 'admin').length;
  const actifs = tous.filter((c) => c.est_actif).length;

  function basculerRole(compte: Compte) {
    changerRole.mutate({ id: compte.id, role: compte.role === 'admin' ? 'client' : 'admin' });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">{t.admin.comptesTitre}</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          {t.admin.comptesAccroche}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} libelle={t.admin.nombreComptes} valeur={formatNombre(tous.length)} Icone={Users} />
        <StatCard index={1} libelle={t.admin.administrateurs} valeur={formatNombre(admins)}
          Icone={ShieldCheck} teinte="accent" />
        <StatCard index={2} libelle={t.admin.comptesActifs} valeur={formatNombre(actifs)}
          Icone={User} teinte="succes"
          detail={tous.length > actifs ? t.admin.desactives(tous.length - actifs) : undefined} />
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-1.5">
            {filtres(t).map(({ cle, libelle }) => (
              <button
                key={cle}
                type="button"
                onClick={() => setFiltre(cle)}
                aria-pressed={filtre === cle}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                  filtre === cle
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
                )}
              >
                {libelle}
              </button>
            ))}
          </div>
          <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder={t.admin.rechercherCompte} />
        </CardHeader>

        <CardContent className="px-0 sm:px-0">
          {comptes.isLoading ? (
            <div className="space-y-2 px-5 sm:px-6">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <TableWrapper className="px-2 sm:px-3">
              <Thead>
                <Th>{t.admin.colonneCompte}</Th>
                <Th>{t.admin.colonneEntreprise}</Th>
                <Th>{t.admin.colonnePays}</Th>
                <Th>{t.admin.colonneInscritLe}</Th>
                <Th>{t.admin.colonneDerniereConnexion}</Th>
                <Th>{t.admin.colonneRole}</Th>
                <Th />
              </Thead>
              <Tbody>
                {liste.length === 0 && (
                  <TrMessage colonnes={7}>{t.admin.aucunCompteCorrespond}</TrMessage>
                )}

                {liste.map((compte) => {
                  const cestMoi = compte.id === moi?.id;
                  return (
                    <Tr key={compte.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[hsl(var(--surface-muted))] text-xs font-bold">
                            {initiales(compte.prenom, compte.nom)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium leading-tight">
                              {compte.prenom} {compte.nom}
                              {cestMoi && (
                                <span className="ml-2 text-xs font-normal text-[hsl(var(--muted))]">
                                  (vous)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-[hsl(var(--muted))]">{compte.email}</p>
                          </div>
                        </div>
                      </Td>
                      <Td className="text-[hsl(var(--muted))]">{compte.entreprise ?? '—'}</Td>
                      <Td className="text-[hsl(var(--muted))]">{compte.pays ?? '—'}</Td>
                      <Td className="whitespace-nowrap text-[hsl(var(--muted))]">
                        {formatDate(compte.created_at)}
                      </Td>
                      <Td className="whitespace-nowrap text-[hsl(var(--muted))]">
                        {compte.derniere_connexion ? formatDate(compte.derniere_connexion, true) : t.admin.jamais}
                      </Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant={compte.role === 'admin' ? 'accent' : 'primaire'}>
                            {compte.role === 'admin' ? <ShieldCheck /> : <User />}
                            {compte.role}
                          </Badge>
                          {!compte.est_actif && <Badge variant="danger">{t.admin.desactive}</Badge>}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant={compte.role === 'admin' ? 'ghost' : 'outline'}
                            /* Personne ne modifie son propre rôle : le serveur
                               le refuse, autant ne pas proposer le geste. */
                            disabled={cestMoi || changerRole.isPending}
                            onClick={() => basculerRole(compte)}
                          >
                            <UserCog />
                            {compte.role === 'admin' ? t.admin.retrograder : t.admin.promouvoir}
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </TableWrapper>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

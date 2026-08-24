import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ArrowRight, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TableWrapper, Tbody, Td, Th, Thead, Tr } from '@/components/ui/table';
import { COULEUR_AXE, COULEUR_GRILLE, couleurSerie } from '@/components/charts/palette';
import { InfobulleGraphique } from '@/components/charts/InfobulleGraphique';
import { IconeSecteur } from '@/features/catalogue/IconeSecteur';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import { cn, formatMontant, formatNombre } from '@/lib/utils';

interface SecteurCompare {
  id: number;
  slug: string;
  nom: string;
  description: string | null;
  prix_rapport: number;
  contribution_pib_pct: number | null;
  croissance_annuelle_pct: number | null;
  nombre_emplois: number | null;
  exportations_mdt: number | null;
  nombre_entreprises: number | null;
  investissements_ide_mdt: number | null;
  part_marche_regional_pct: number | null;
}

type CleIndicateur = keyof Pick<SecteurCompare,
  'contribution_pib_pct' | 'croissance_annuelle_pct' | 'nombre_emplois' |
  'exportations_mdt' | 'nombre_entreprises' | 'investissements_ide_mdt' |
  'part_marche_regional_pct'>;

const INDICATEURS: { cle: CleIndicateur; libelle: string; unite: string; court: string }[] = [
  { cle: 'contribution_pib_pct', libelle: 'Contribution au PIB', unite: '%', court: 'PIB' },
  { cle: 'croissance_annuelle_pct', libelle: 'Croissance annuelle', unite: '%', court: 'Croissance' },
  { cle: 'nombre_emplois', libelle: 'Emplois générés', unite: 'postes', court: 'Emplois' },
  { cle: 'exportations_mdt', libelle: 'Exportations', unite: 'MDT', court: 'Export' },
  { cle: 'nombre_entreprises', libelle: 'Entreprises actives', unite: 'unités', court: 'Entreprises' },
  { cle: 'investissements_ide_mdt', libelle: 'Investissements directs étrangers', unite: 'MDT', court: 'IDE' },
  { cle: 'part_marche_regional_pct', libelle: 'Part de marché régionale', unite: '%', court: 'Part rég.' },
];

export default function Comparateur() {
  const [indicateur, setIndicateur] = useState<CleIndicateur>('croissance_annuelle_pct');

  const donnees = useQuery({ queryKey: cles.analyseSecteurs, queryFn: api.analyseSecteurs });
  const secteurs = ((donnees.data as { secteurs?: SecteurCompare[] } | undefined)?.secteurs ?? []);

  const actif = INDICATEURS.find((i) => i.cle === indicateur)!;

  const classement = useMemo(
    () => [...secteurs]
      .filter((s) => s[indicateur] != null)
      .sort((a, b) => Number(b[indicateur]) - Number(a[indicateur]))
      .map((s) => ({ nom: s.nom, valeur: Number(s[indicateur]) })),
    [secteurs, indicateur],
  );

  /**
   * Profil radar : chaque indicateur est ramené à 0-100 par rapport au MAXIMUM
   * observé sur les six secteurs.
   *
   * Sans cette normalisation, les emplois (centaines de milliers) écraseraient
   * les pourcentages et le radar ne montrerait plus rien. La conséquence à
   * garder en tête : le radar compare des POSITIONS RELATIVES, pas des valeurs
   * absolues — les chiffres réels sont dans le tableau plus bas.
   */
  const radar = useMemo(() => {
    if (secteurs.length === 0) return [];
    return INDICATEURS.map(({ cle, court }) => {
      const maximum = Math.max(...secteurs.map((s) => Number(s[cle] ?? 0)), 1);
      const point: Record<string, string | number> = { indicateur: court };
      secteurs.forEach((s) => {
        point[s.nom] = Math.round((Number(s[cle] ?? 0) / maximum) * 100);
      });
      return point;
    });
  }, [secteurs]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
          Analyse comparative
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight">
          Comparateur de secteurs
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted))]">
          Les six secteurs face à face, sur sept indicateurs agrégés. Cet écran est
          gratuit et sans compte : il sert à situer un secteur avant de commander
          l&apos;analyse détaillée.
        </p>
      </header>

      {donnees.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-72 w-full rounded-[var(--radius-card)]" />
          <Skeleton className="h-64 w-full rounded-[var(--radius-card)]" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Classement par indicateur</CardTitle>
              <CardDescription>
                Choisissez l&apos;indicateur qui compte pour votre projet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-1.5">
                {INDICATEURS.map(({ cle, libelle }) => (
                  <button
                    key={cle}
                    type="button"
                    onClick={() => setIndicateur(cle)}
                    aria-pressed={indicateur === cle}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                      indicateur === cle
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                        : 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
                    )}
                  >
                    {libelle}
                  </button>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classement} layout="vertical" margin={{ left: 8, right: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COULEUR_GRILLE} horizontal={false} />
                  <XAxis type="number" tick={{ fill: COULEUR_AXE, fontSize: 11 }}
                    tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="nom" width={160}
                    tick={{ fill: COULEUR_AXE, fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'hsl(var(--surface-muted))' }}
                    content={(props) => <InfobulleGraphique {...props} unite={actif.unite} />} />
                  <Bar dataKey="valeur" name={actif.libelle} radius={[0, 6, 6, 0]} maxBarSize={26}
                    fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profil comparé</CardTitle>
              <CardDescription>
                Chaque axe est ramené à 100 pour le secteur le mieux placé. Le radar
                montre des positions relatives, pas des valeurs absolues — celles-ci
                figurent dans le tableau ci-dessous.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={radar} outerRadius="72%">
                  <PolarGrid stroke={COULEUR_GRILLE} />
                  <PolarAngleAxis dataKey="indicateur" tick={{ fill: COULEUR_AXE, fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]}
                    tick={{ fill: COULEUR_AXE, fontSize: 9 }} axisLine={false} />
                  {secteurs.map((secteur, index) => (
                    <Radar
                      key={secteur.id}
                      name={secteur.nom}
                      dataKey={secteur.nom}
                      stroke={couleurSerie(index)}
                      fill={couleurSerie(index)}
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  ))}
                  <Tooltip content={(props) => <InfobulleGraphique {...props} unite="/ 100" />} />
                </RadarChart>
              </ResponsiveContainer>

              <div className="mt-4 flex flex-wrap gap-3">
                {secteurs.map((secteur, index) => (
                  <span key={secteur.id} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-full"
                      style={{ backgroundColor: couleurSerie(index) }} aria-hidden />
                    {secteur.nom}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valeurs détaillées</CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-0">
              <TableWrapper className="px-2 sm:px-3">
                <Thead>
                  <Th>Secteur</Th>
                  {INDICATEURS.map(({ cle, court }) => <Th key={cle} numerique>{court}</Th>)}
                  <Th />
                </Thead>
                <Tbody>
                  {secteurs.map((secteur) => (
                    <Tr key={secteur.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <IconeSecteur slug={secteur.slug} taille="sm" />
                          <div className="min-w-0">
                            <p className="font-medium leading-tight">{secteur.nom}</p>
                            <p className="text-xs text-[hsl(var(--muted))]">
                              {formatMontant(secteur.prix_rapport)}
                            </p>
                          </div>
                        </div>
                      </Td>
                      {INDICATEURS.map(({ cle }) => (
                        <Td key={cle} numerique>
                          {secteur[cle] == null
                            ? <span className="text-[hsl(var(--muted))]">—</span>
                            : formatNombre(Number(secteur[cle]), cle.endsWith('_pct') ? 1 : 0)}
                        </Td>
                      ))}
                      <Td>
                        <div className="flex justify-end">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/paiement/${secteur.id}`}>
                              Rapport <ArrowRight />
                            </Link>
                          </Button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </TableWrapper>
            </CardContent>
          </Card>

          <p className="flex items-start gap-2 text-xs leading-relaxed text-[hsl(var(--muted))]">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Ces indicateurs agrégés situent un ordre de grandeur. Les séries annuelles
            détaillées, leurs sources et les perspectives 2025-2028 figurent dans le
            rapport sectoriel. <Badge variant="neutre" className="ml-1">Données non contractuelles</Badge>
          </p>
        </>
      )}
    </div>
  );
}

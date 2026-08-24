import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, Download, FileText, RefreshCw, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api, fileUrl } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface RapportEdite {
  id: number;
  secteur: string;
  titre: string;
  cheminFichier: string | null;
  nombrePages: number | null;
  statut: string | null;
  dateGeneration: string | null;
  sections: string[];
  narratives: Record<string, string>;
}

const LIBELLES: Record<string, string> = {
  introduction: 'Présentation générale du secteur',
  tendances: 'Analyse des tendances',
  opportunites: 'Opportunités identifiées',
  risques: 'Analyse des risques',
  benchmarking: 'Benchmarking régional',
  recommandations: 'Recommandations investisseur',
  perspectives: 'Perspectives 2025-2028',
};

function compterMots(texte: string) {
  return texte.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Relecture et correction d'un rapport déjà produit.
 *
 * Le PDF est reconstruit à partir du texte corrigé, SANS nouvel appel au
 * service de rédaction : une régénération complète écraserait les corrections.
 * Les données chiffrées, elles, sont relues en base — le document repart donc
 * des valeurs à jour.
 */
export default function RapportEdition() {
  const { id } = useParams<{ id: string }>();
  const rapportId = Number(id);

  const [textes, setTextes] = useState<Record<string, string>>({});
  const [pdfReconstruit, setPdfReconstruit] = useState<string | null>(null);

  const rapport = useQuery({
    queryKey: ['admin', 'rapport', rapportId],
    queryFn: () => api.rapport(rapportId),
    enabled: Number.isFinite(rapportId),
  });

  const donnees = (rapport.data as { rapport?: RapportEdite } | undefined)?.rapport;

  // Les champs sont initialisés une fois la réponse reçue, pas à chaque rendu :
  // recopier les textes en continu écraserait la saisie en cours.
  useEffect(() => {
    if (!donnees) return;
    setTextes(
      Object.fromEntries(donnees.sections.map((cle) => [cle, donnees.narratives[cle] ?? ''])),
    );
  }, [donnees]);

  const reconstruire = useMutation({
    mutationFn: () => api.updateRapport(rapportId, textes),
    onSuccess: (resultat) => {
      const url = (resultat as { pdfUrl?: string }).pdfUrl;
      setPdfReconstruit(url ? fileUrl(url) : null);
      toast.success('PDF reconstruit', { description: 'Les corrections sont dans le document.' });
    },
    onError: (erreur: Error) =>
      toast.error('Reconstruction impossible', { description: erreur.message }),
  });

  if (rapport.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-[var(--radius-card)]" />
        ))}
      </div>
    );
  }

  if (rapport.isError || !donnees) {
    return (
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link to="/admin/rapports"><ArrowLeft /> Retour aux rapports</Link>
        </Button>
        <div role="alert" className="surface-card flex items-start gap-3 p-6">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[hsl(var(--danger))]" />
          <div>
            <p className="font-display font-semibold">Rapport inaccessible</p>
            <p className="mt-1 text-sm text-[hsl(var(--muted))]">
              {(rapport.error as Error)?.message ?? 'Rapport introuvable.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const sectionsVides = donnees.sections.filter((cle) => !(textes[cle] ?? '').trim()).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/rapports"><ArrowLeft /> Retour aux rapports</Link>
      </Button>

      <header className="surface-card flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight">{donnees.secteur}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted))]">
            Généré le {formatDate(donnees.dateGeneration, true)} ·
            {' '}{donnees.nombrePages ?? '—'} pages.
            Les sections chiffrées sont reconstruites automatiquement depuis la base.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sectionsVides > 0 && (
            <Badge variant="avertissement">
              {sectionsVides} section(s) vide(s)
            </Badge>
          )}
          {donnees.cheminFichier && (
            <Button asChild size="sm" variant="outline">
              <a href={fileUrl(donnees.cheminFichier)} target="_blank" rel="noreferrer">
                <Download /> PDF actuel
              </a>
            </Button>
          )}
        </div>
      </header>

      {pdfReconstruit && (
        <div className="surface-card flex flex-wrap items-center justify-between gap-4 border-[hsl(var(--success)/0.4)] p-5">
          <p className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-[hsl(var(--success))]" />
            Le document a été reconstruit avec vos corrections.
          </p>
          <Button asChild size="sm">
            <a href={pdfReconstruit} target="_blank" rel="noreferrer">
              <Download /> Ouvrir le nouveau PDF
            </a>
          </Button>
        </div>
      )}

      <form
        className="space-y-4"
        onSubmit={(evenement) => { evenement.preventDefault(); reconstruire.mutate(); }}
      >
        {donnees.sections.map((cle) => {
          const texte = textes[cle] ?? '';
          const mots = compterMots(texte);
          return (
            <Card key={cle}>
              <CardHeader className="flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">{LIBELLES[cle] ?? cle}</CardTitle>
                <span className="tabular shrink-0 text-xs text-[hsl(var(--muted))]">
                  {mots} mot{mots > 1 ? 's' : ''}
                </span>
              </CardHeader>
              <CardContent>
                <Textarea
                  className="min-h-44 font-sans leading-relaxed"
                  value={texte}
                  aria-label={LIBELLES[cle] ?? cle}
                  placeholder="Section vide — elle apparaîtra comme indisponible dans le PDF."
                  onChange={(evenement) => setTextes({ ...textes, [cle]: evenement.target.value })}
                />
              </CardContent>
            </Card>
          );
        })}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" size="lg" chargement={reconstruire.isPending}>
            <Save /> Enregistrer et reconstruire le PDF
          </Button>
          <Button asChild variant="ghost">
            <Link to="/admin/rapports">Annuler</Link>
          </Button>
          <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted))]">
            <RefreshCw className="size-3" />
            Aucun appel au service de rédaction : vos corrections ne seront pas écrasées.
          </p>
        </div>
      </form>
    </div>
  );
}

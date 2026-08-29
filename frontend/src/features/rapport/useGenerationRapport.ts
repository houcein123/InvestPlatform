import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, fileUrl } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import { lirePreferences } from '@/lib/preferences';
import type { JobGeneration } from '@/lib/types';

/**
 * Pilote la generation d'un rapport et son suivi.
 *
 * La generation dure 20 a 40 secondes : le backend ouvre une tache et repond
 * immediatement, le frontend interroge ensuite l'avancement. Ce sondage est
 * confie a TanStack Query (`refetchInterval`) plutot qu'a un setInterval
 * maison — la boucle s'arrete d'elle-meme des que la tache aboutit, survit au
 * demontage du composant et ne peut pas fuir.
 *
 * Le chronometre est tenu a part : il continue d'avancer meme quand le serveur
 * ne renvoie pas de nouveau palier, ce qui rassure sur une attente longue.
 */
export function useGenerationRapport() {
  const queryClient = useQueryClient();
  const [jobId, setJobId] = useState<string | null>(null);
  const [secondes, setSecondes] = useState(0);
  const demarreLe = useRef<number | null>(null);

  const lancer = useMutation({
    mutationFn: ({ sectorId, achatId, langue }: { sectorId: number; achatId: number; langue: string }) =>
      api.generateReport(sectorId, achatId, langue),
    onSuccess: (reponse) => {
      demarreLe.current = Date.now();
      setSecondes(0);
      setJobId(reponse.jobId);
    },
  });

  const relancer = useMutation({
    mutationFn: (achatId: number) => api.relancerRapport(achatId),
    onSuccess: (reponse) => {
      demarreLe.current = Date.now();
      setSecondes(0);
      setJobId(reponse.jobId);
    },
  });

  const suivi = useQuery({
    queryKey: cles.jobRapport(jobId ?? ''),
    queryFn: () => api.reportStatus(jobId as string),
    enabled: Boolean(jobId),
    // Un sondage a la seconde suffit : plus rapide, on interroge le serveur
    // vingt fois pour un pourcentage qui bouge d'un point.
    refetchInterval: (requete) => {
      const statut = requete.state.data?.job?.statut;
      return statut === 'termine' || statut === 'erreur' ? false : 1000;
    },
    // Le sondage n'a d'interet que si l'onglet est visible ; en arriere-plan,
    // la reprise se fera au retour.
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
  });

  const job: JobGeneration | null = suivi.data?.job ?? null;
  const termine = job?.statut === 'termine';
  const enErreur = job?.statut === 'erreur';
  const enCours = Boolean(jobId) && !termine && !enErreur;

  // Chronometre local, independant des reponses du serveur.
  useEffect(() => {
    if (!enCours || demarreLe.current === null) return undefined;
    const minuterie = setInterval(() => {
      setSecondes(Math.round((Date.now() - (demarreLe.current as number)) / 1000));
    }, 1000);
    return () => clearInterval(minuterie);
  }, [enCours]);

  // Un rapport livre change la liste de l'espace client : on l'invalide une
  // seule fois, a la transition, et non a chaque sondage.
  useEffect(() => {
    if (!termine) return;

    queryClient.invalidateQueries({ queryKey: cles.mesRapports });

    // Ouverture automatique, si la preference le demande. Le declenchement
    // suit un clic de l'utilisateur (le paiement), les navigateurs ne le
    // bloquent donc pas comme une fenetre surgissante non sollicitee.
    if (job?.pdfUrl && lirePreferences().ouvrirPdfAutomatiquement) {
      window.open(fileUrl(job.pdfUrl), '_blank', 'noopener,noreferrer');
    }
  }, [termine, job?.pdfUrl, queryClient]);

  const reinitialiser = useCallback(() => {
    setJobId(null);
    setSecondes(0);
    demarreLe.current = null;
  }, []);

  // Identite stable : sans ce memo, l'objet change a chaque rendu et tout
  // effet qui en depend se rejoue indefiniment.
  return useMemo(() => ({
    lancer: lancer.mutate,
    relancer: relancer.mutate,
    demarrage: lancer.isPending || relancer.isPending,
    erreurDemarrage: (lancer.error ?? relancer.error) as Error | null,
    job,
    enCours,
    termine,
    enErreur,
    secondes,
    reinitialiser,
  }), [
    lancer.mutate, relancer.mutate, lancer.isPending, relancer.isPending,
    lancer.error, relancer.error, job, enCours, termine, enErreur,
    secondes, reinitialiser,
  ]);
}

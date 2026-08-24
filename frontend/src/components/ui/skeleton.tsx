import { cn } from '@/lib/utils';

/**
 * Ossature de chargement.
 *
 * Preferee a un « Chargement... » centre : elle occupe la place exacte du
 * contenu a venir, ce qui evite le saut de mise en page au moment de la
 * reponse. Un portail financier qui tressaute perd immediatement en credibilite.
 */
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    aria-hidden
    className={cn('animate-pulse rounded-md bg-[hsl(var(--surface-muted))]', className)}
    {...props}
  />
);

/** Ossature d'une carte du catalogue, calee sur ses dimensions reelles. */
export const SkeletonCarteSecteur = () => (
  <div className="surface-card flex flex-col gap-4 p-6">
    <div className="flex items-center gap-3">
      <Skeleton className="h-11 w-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-5/6" />
    <Skeleton className="h-24 w-full rounded-lg" />
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="h-7 w-24" />
      <Skeleton className="h-10 w-32 rounded-[var(--radius-control)]" />
    </div>
  </div>
);

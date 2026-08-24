import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3',
  {
    variants: {
      variant: {
        neutre: 'border-[hsl(var(--border))] bg-[hsl(var(--surface-muted))] text-[hsl(var(--muted))]',
        primaire: 'border-transparent bg-[hsl(var(--primary-soft))] text-[hsl(var(--primary))]',
        accent: 'border-transparent bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))]',
        succes: 'border-transparent bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]',
        danger: 'border-transparent bg-[hsl(var(--danger-soft))] text-[hsl(var(--danger))]',
        avertissement: 'border-transparent bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]',
      },
    },
    defaultVariants: { variant: 'neutre' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

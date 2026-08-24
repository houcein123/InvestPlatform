import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-[var(--radius-control)] border border-[hsl(var(--input))]',
        'bg-[hsl(var(--surface))] px-3 py-2 text-sm transition-colors',
        'placeholder:text-[hsl(var(--muted))]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-24 w-full rounded-[var(--radius-control)] border border-[hsl(var(--input))]',
        'bg-[hsl(var(--surface))] px-3 py-2 text-sm transition-colors',
        'placeholder:text-[hsl(var(--muted))] disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-sm font-medium leading-none text-[hsl(var(--foreground))]', className)}
    {...props}
  />
));
Label.displayName = 'Label';

/** Message d'erreur de formulaire, annonce aux lecteurs d'ecran. */
export const ErreurChamp = ({ children }: { children?: React.ReactNode }) =>
  children ? (
    <p role="alert" className="text-xs font-medium text-[hsl(var(--danger))]">
      {children}
    </p>
  ) : null;

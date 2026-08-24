import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

/**
 * Modale animee.
 *
 * `forceMount` couple a AnimatePresence est indispensable : sans lui, Radix
 * retire le noeud du DOM des la fermeture demandee et l'animation de sortie
 * n'a jamais lieu — la modale disparait d'un coup.
 */
export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { ouvert: boolean }
>(({ className, children, ouvert, ...props }, ref) => (
  <AnimatePresence>
    {ouvert && (
      <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Overlay asChild forceMount>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
        </DialogPrimitive.Overlay>

        <DialogPrimitive.Content asChild forceMount ref={ref} {...props}>
          <motion.div
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2',
              'surface-card p-6 shadow-[var(--shadow-elevated)]',
              className,
            )}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {children}
            <DialogPrimitive.Close
              className="absolute right-4 top-4 rounded-md p-1 text-[hsl(var(--muted))] transition-colors hover:bg-[hsl(var(--surface-muted))]"
              aria-label="Fermér"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    )}
  </AnimatePresence>
));
DialogContent.displayName = 'DialogContent';

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('font-display text-lg font-semibold', className)}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('mt-1 text-sm text-[hsl(var(--muted))]', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

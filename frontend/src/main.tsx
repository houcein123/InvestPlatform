import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import App from './App';
import { AuthProvider } from './auth/AuthContext';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './components/layout/ThemeProvider';
import { lirePreferences } from './lib/preferences';

import './styles/global.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          {/* AuthProvider est a l'interieur du QueryClientProvider : il vide le
              cache a la deconnexion, il lui faut donc le client. */}
          <AuthProvider>
            <App />
            {/* La preference de notification est lue au montage : un
                interrupteur qui n'eteint rien ne vaut pas d'exister. */}
            {lirePreferences().notificationsActives && (
              <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{ className: 'font-sans' }}
              />
            )}
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

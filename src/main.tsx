import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from '@/api/store';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { UploadProvider } from '@/features/upload/UploadProvider';
import App from '@/App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <UploadProvider>
          <TooltipProvider>
            <App />
            <Toaster
              position="bottom-left"
              closeButton
              toastOptions={{ style: { fontFamily: 'Inter, sans-serif' } }}
            />
          </TooltipProvider>
        </UploadProvider>
      </Provider>
    </ErrorBoundary>
  </StrictMode>,
);

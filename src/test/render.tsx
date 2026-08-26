import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '@/api/api';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { UploadProvider } from '@/features/upload/UploadProvider';

/** A store per test, so RTK Query caches never leak between cases. */
function makeStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefault) => getDefault().concat(api.middleware),
  });
}

export function renderRoute(
  element: ReactElement,
  { path, route }: { path: string; route: string },
) {
  const store = makeStore();
  const result = render(
    <Provider store={store}>
      <UploadProvider>
        <TooltipProvider>
          <MemoryRouter initialEntries={[route]}>
            <Routes>
              <Route path={path} element={element} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </UploadProvider>
    </Provider>,
  );
  return { ...result, store };
}

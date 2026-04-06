import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AppToastViewport } from './components/feedback/AppToastViewport';
import { GlobalNetworkActivityIndicator } from './components/feedback/GlobalNetworkActivityIndicator';
import { PwaInstallAndUpdate } from './components/feedback/PwaInstallAndUpdate';
import { GlobalTextAutoCapitalize } from './components/behavior/GlobalTextAutoCapitalize';
import './styles.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <GlobalTextAutoCapitalize />
      <GlobalNetworkActivityIndicator />
      <PwaInstallAndUpdate />
      <AppToastViewport />
    </QueryClientProvider>
  </React.StrictMode>,
);

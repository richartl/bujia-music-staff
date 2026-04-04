import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { VisitCard } from '../src/features/visits/components/VisitCard';

vi.mock('../src/features/intakes/api/filesApi', () => ({
  filesApi: {
    getDownloadUrl: vi.fn(async (mediaId: string) => ({ url: `https://cdn.test/${mediaId}.jpg`, expiresInSeconds: 60 })),
  },
}));

describe('VisitCard', () => {
  it('muestra previews de intake cuando hay mediaIds', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <VisitCard
            visit={{
              id: 'v1',
              instrumentId: 'i1',
              clientId: 'c1',
              branchId: 'b1',
              workshopId: 'w1',
              folio: 'OT-1',
              isActive: true,
              status: { id: 'st1', name: 'Activa' },
              client: { id: 'c1', fullName: 'Juan', phone: '555' },
              instrument: { id: 'i1', name: 'Strat' },
              visitMediaIds: ['m1', 'm2'],
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Fotos intake')).toBeTruthy();
      expect(screen.getAllByAltText('Preview intake').length).toBeGreaterThan(0);
    });
  });
});

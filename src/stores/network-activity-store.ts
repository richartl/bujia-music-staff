import { create } from 'zustand';

type NetworkActivityState = {
  activeRequestCount: number;
  activeRequestIds: Record<string, true>;
  startRequest: (requestId: string) => void;
  endRequest: (requestId?: string | null) => void;
  reset: () => void;
};

export const networkActivityStore = create<NetworkActivityState>((set) => ({
  activeRequestCount: 0,
  activeRequestIds: {},
  startRequest: (requestId) =>
    set((state) => {
      if (!requestId || state.activeRequestIds[requestId]) return state;
      return {
        activeRequestCount: state.activeRequestCount + 1,
        activeRequestIds: {
          ...state.activeRequestIds,
          [requestId]: true,
        },
      };
    }),
  endRequest: (requestId) =>
    set((state) => {
      if (!requestId || !state.activeRequestIds[requestId]) return state;
      const nextRequestIds = { ...state.activeRequestIds };
      delete nextRequestIds[requestId];
      return {
        activeRequestCount: Math.max(0, state.activeRequestCount - 1),
        activeRequestIds: nextRequestIds,
      };
    }),
  reset: () => ({ activeRequestCount: 0, activeRequestIds: {} }),
}));

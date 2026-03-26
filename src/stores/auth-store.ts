import { create } from 'zustand';

type User = {
  id: string;
  email: string;
  role: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  workshopId: string | null;
  setSession: (payload: { token: string; user: User }) => void;
  setWorkshopId: (workshopId: string) => void;
  logout: () => void;
};

const persistedToken = localStorage.getItem('staff-token');
const persistedUser = localStorage.getItem('staff-user');
const persistedWorkshopId = localStorage.getItem('staff-workshop-id');

export const authStore = create<AuthState>((set) => ({
  token: persistedToken,
  user: persistedUser ? JSON.parse(persistedUser) : null,
  workshopId: persistedWorkshopId || null,
  setSession: ({ token, user }) => {
    localStorage.setItem('staff-token', token);
    localStorage.setItem('staff-user', JSON.stringify(user));
    set({ token, user });
  },
  setWorkshopId: (workshopId) => {
    localStorage.setItem('staff-workshop-id', workshopId);
    set({ workshopId });
  },
  logout: () => {
    localStorage.removeItem('staff-token');
    localStorage.removeItem('staff-user');
    localStorage.removeItem('staff-workshop-id');
    set({ token: null, user: null, workshopId: null });
  },
}));

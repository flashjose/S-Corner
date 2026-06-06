import { create } from 'zustand';
import type { AuthUser } from '@/types/auth';

const STORAGE_KEY = 's-corner-auth';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
  isAuthenticated: () => boolean;
}

function persist(token: string | null, user: AuthUser | null) {
  if (token && user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  hydrated: false,

  login: (token, user) => {
    persist(token, user);
    set({ token, user });
  },

  logout: () => {
    persist(null, null);
    set({ token: null, user: null });
  },

  hydrate: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
        if (parsed.token && parsed.user) {
          set({ token: parsed.token, user: parsed.user, hydrated: true });
          return;
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    set({ hydrated: true });
  },

  isAuthenticated: () => !!get().token,
}));

export function getAuthToken(): string | null {
  return useAuthStore.getState().token;
}

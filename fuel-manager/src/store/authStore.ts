import { create } from 'zustand';

const TOKEN_KEY = 'fuel_station_tokens';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasRehydrated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setRehydrated: (value: boolean) => void;
  rehydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  _hasRehydrated: false,

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(
      TOKEN_KEY,
      JSON.stringify({ accessToken, refreshToken })
    );

    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);

    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  setRehydrated: (value: boolean) =>
    set({ _hasRehydrated: value }),

  rehydrate: () => {
    try {
      const value = localStorage.getItem(TOKEN_KEY);

      if (value) {
        const { accessToken, refreshToken } = JSON.parse(value);

        if (accessToken && refreshToken) {
          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });
        }
      }
    } catch (error) {
      console.error('Rehydrate error:', error);
    } finally {
      set({ _hasRehydrated: true });
    }
  },
}));
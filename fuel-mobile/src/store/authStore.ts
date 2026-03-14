// src/store/authStore.ts
import { create } from 'zustand';
import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'fuel_station_tokens';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasRehydrated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setRehydrated: (value: boolean) => void;
  rehydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  _hasRehydrated: false,

  setTokens: async (accessToken, refreshToken) => {
    await Preferences.set({
      key: TOKEN_KEY,
      value: JSON.stringify({ accessToken, refreshToken }),
    });

    set({
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    await Preferences.remove({ key: TOKEN_KEY });

    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },

  setRehydrated: (value: boolean) =>
    set({ _hasRehydrated: value }),

  rehydrate: async () => {
    try {
      const { value } = await Preferences.get({ key: TOKEN_KEY });

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
import { create } from 'zustand';
import { apiService } from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isLoggedIn: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await apiService.login(email, password);
      set({
        user: data.user,
        token: data.token,
        isLoggedIn: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await apiService.register(name, email, password);
      set({
        user: data.user,
        token: data.token,
        isLoggedIn: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await apiService.logout();
    set({
      user: null,
      token: null,
      isLoggedIn: false,
    });
  },

  restoreToken: async () => {
    try {
      const token = await apiService.getToken();
      const user = await apiService.getUser();
      if (token && user) {
        set({
          token,
          user,
          isLoggedIn: true,
        });
      }
    } catch (error) {
      console.error('Failed to restore token:', error);
    }
  },

  setUser: (user: User | null) => {
    set({ user });
  },
}));

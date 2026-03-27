import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface User {
  id: string;
  email?: string | null;  // Made optional since patients may not have email
  firstName: string;
  lastName: string;
  role: string;
  phone: string;
  hospitalId: string;
  patientNumber?: string;  // Added for patient users
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  rememberMe: boolean;
  _hasHydrated: boolean;  // Track hydration state

  // Actions
  setAuth: (user: User, token: string, refreshToken: string, rememberMe?: boolean) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  updateToken: (token: string) => void;
  setHasHydrated: (state: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,
      rememberMe: false,
      _hasHydrated: false,

      setAuth: (user, token, refreshToken, rememberMe = false) =>
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          rememberMe,
        }),

      logout: () => {
        // Clear both storage keys completely
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-storage');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          rememberMe: false,
        });
      },

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      updateToken: (token) =>
        set({
          token,
        }),

      setHasHydrated: (state: boolean) =>
        set({
          _hasHydrated: state,
          isLoading: !state,  // Set isLoading to false when hydrated
        }),

      // Clear session without full logout (used when navigating to login)
      clearSession: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-storage');
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          rememberMe: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AuthState) => ({
        // Only persist auth state if "Remember Me" was checked
        user: state.rememberMe ? state.user : null,
        token: state.rememberMe ? state.token : null,
        refreshToken: state.rememberMe ? state.refreshToken : null,
        isAuthenticated: state.rememberMe ? state.isAuthenticated : false,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If rememberMe was not set, ensure we don't auto-login
          if (!state.rememberMe) {
            state.logout();
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);

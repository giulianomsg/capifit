import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type UserRole = 'ADMIN' | 'TRAINER' | 'STUDENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const STORAGE_KEY = 'capifit.auth';

const defaultState: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,
};

type Listener = (state: AuthState) => void;

type SessionPayload = {
  accessToken: string;
  refreshToken?: string | null;
  user?: AuthUser | null;
};

class AuthStore {
  private state: AuthState = { ...defaultState };
  private listeners: Set<Listener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<AuthState>;
          this.state = {
            ...this.state,
            ...parsed,
            isHydrated: true,
          };
        } catch (error) {
          console.warn('Failed to parse stored auth state', error);
          this.state = { ...this.state, isHydrated: true };
        }
      } else {
        this.state = { ...this.state, isHydrated: true };
      }
    } else {
      this.state = { ...this.state, isHydrated: true };
    }

    this.state.isAuthenticated = Boolean(this.state.accessToken && this.state.user);
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state);

    return () => {
      this.listeners.delete(listener);
    };
  }

  getState(): AuthState {
    return this.state;
  }

  private emit() {
    if (typeof window !== 'undefined') {
      const { accessToken, refreshToken, user } = this.state;
      const payload = JSON.stringify({ accessToken, refreshToken, user });
      window.localStorage.setItem(STORAGE_KEY, payload);
    }

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private updateState(next: Partial<AuthState>) {
    this.state = {
      ...this.state,
      ...next,
    };
    this.state.isAuthenticated = Boolean(this.state.accessToken && this.state.user);
    this.emit();
  }

  setSession(session: SessionPayload) {
    const refreshToken =
      Object.prototype.hasOwnProperty.call(session, 'refreshToken')
        ? session.refreshToken ?? null
        : this.state.refreshToken;

    const user =
      Object.prototype.hasOwnProperty.call(session, 'user')
        ? session.user ?? null
        : this.state.user;

    this.updateState({
      accessToken: session.accessToken,
      refreshToken,
      user,
    });
  }

  setUser(user: AuthUser | null) {
    this.updateState({ user });
  }

  logout() {
    this.state = {
      ...defaultState,
      isHydrated: true,
    };

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    this.emit();
  }
}

export const authStore = new AuthStore();

interface AuthContextValue {
  state: AuthState;
  setSession: (session: SessionPayload) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>(authStore.getState());

  useEffect(() => authStore.subscribe(setState), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      setSession: (session) => authStore.setSession(session),
      setUser: (user) => authStore.setUser(user),
      logout: () => authStore.logout(),
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

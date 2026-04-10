export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  avatar_url?: string;
  two_factor_enabled?: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

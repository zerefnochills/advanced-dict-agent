/**
 * Auth utilities – token + user stored in localStorage,
 * actual authentication is done by the backend API via api.ts
 */

export interface StoredUser {
  id: number;
  email: string;
  full_name: string;
  has_api_key: boolean;
}

/** Check if a JWT token is present */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('token');
};

/** Store the JWT token */
export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

/** Get the JWT token */
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/** Store user data */
export const setUser = (user: StoredUser) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/** Get stored user data */
export const getUser = (): StoredUser | null => {
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
};

/** Clear token and user – full logout */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

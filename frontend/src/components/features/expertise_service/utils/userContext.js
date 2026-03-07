/**
 * Lightweight auth/session helpers for the Expertise module.
 * Stores JWT + user info in localStorage.
 */

const USER_KEY = 'currentUser';
const TOKEN_KEY = 'authToken';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

export const setCurrentUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
};

export const logout = () => {
  setCurrentUser(null);
  setAuthToken(null);
};


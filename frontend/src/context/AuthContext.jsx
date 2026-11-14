import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.js';
import { getErrorMessage, setUnauthenticatedHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    // Any 401 from the API (e.g. session expired) logs the user out locally;
    // ProtectedRoute then redirects to /login.
    setUnauthenticatedHandler(() => setUser(null));

    authApi
      .getCurrentUser()
      .then(setUser)
      .catch((error) => {
        setUser(null);
        if (error?.response?.status !== 401) {
          setSessionError(getErrorMessage(error, 'Unable to verify your session.'));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    setSessionError('');
    const loggedIn = await authApi.login(credentials);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (details) => {
    setSessionError('');
    const created = await authApi.register(details);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setSessionError('');
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, sessionError, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, loading, sessionError, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

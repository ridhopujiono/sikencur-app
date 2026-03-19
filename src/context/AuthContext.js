import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginRequest, registerRequest } from '../api/auth';

const AUTH_STORAGE_KEY = '@finsight/auth-session';

export const AuthContext = createContext({
  userToken: null,
  user: null,
  isInitializing: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

function warnStorageIssue(error, action) {
  const message = error instanceof Error ? error.message : String(error);
  // Keep auth flow alive even when native storage is temporarily unavailable.
  console.warn(`[AuthStorage] ${action} failed: ${message}`);
}

function getSessionFromResponse(response) {
  const token = response?.data?.token;
  const user = response?.data?.user ?? null;

  if (!token) {
    throw new Error('Authentication token is missing from the server response.');
  }

  return { token, user };
}

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const rawSession = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

        if (!rawSession) {
          return;
        }

        const parsedSession = JSON.parse(rawSession);

        if (parsedSession?.token && isMounted) {
          setUserToken(parsedSession.token);
          setUser(parsedSession.user ?? null);
        }
      } catch (error) {
        warnStorageIssue(error, 'restore');
        try {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (removeError) {
          warnStorageIssue(removeError, 'cleanup');
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const persistSession = useCallback(async session => {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      warnStorageIssue(error, 'persist');
    }
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      warnStorageIssue(error, 'clear');
    }
  }, []);

  const login = useCallback(
    async payload => {
      const response = await loginRequest(payload);
      const session = getSessionFromResponse(response);

      setUserToken(session.token);
      setUser(session.user);
      await persistSession(session);

      return response;
    },
    [persistSession],
  );

  const register = useCallback(
    async payload => {
      const response = await registerRequest(payload);
      const session = getSessionFromResponse(response);

      setUserToken(session.token);
      setUser(session.user);
      await persistSession(session);

      return response;
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    setUserToken(null);
    setUser(null);
    await clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      userToken,
      user,
      isInitializing,
      login,
      register,
      logout,
    }),
    [isInitializing, login, logout, register, user, userToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

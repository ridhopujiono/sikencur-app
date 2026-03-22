import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginRequest, registerRequest } from '../api/auth';
import { setAuthToken } from '../api/client';
import { registerFcmToken, unregisterFcmToken } from '../services/fcmDeviceApi';
import { displayRemoteNotification } from '../services/pushNotification';
import {
  clearStoredFcmToken,
  getCurrentFcmToken,
  getDeviceName,
  getDevicePlatform,
  getStoredFcmToken,
  requestNotificationPermission,
  saveStoredFcmToken,
  subscribeToFcmTokenRefresh,
} from '../services/fcmManager';

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

function isRetryableNetworkError(error) {
  if (!error) return false;

  const status = Number(error?.status ?? 0);
  if (Number.isFinite(status) && status === 0) {
    return true;
  }

  if (error instanceof TypeError) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error ?? '').toLowerCase();

  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('enotfound')
  );
}

async function runWithSingleRetry(action) {
  try {
    return await action();
  } catch (error) {
    if (!isRetryableNetworkError(error)) {
      throw error;
    }

    return action();
  }
}

export function AuthProvider({ children }) {
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const tokenRefreshUnsubscribeRef = useRef(null);
  const foregroundMessageUnsubscribeRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      setAuthToken(null);

      try {
        const rawSession = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

        if (!rawSession) {
          return;
        }

        const parsedSession = JSON.parse(rawSession);

        if (parsedSession?.token && isMounted) {
          setUserToken(parsedSession.token);
          setUser(parsedSession.user ?? null);
          setAuthToken(parsedSession.token);
        }
      } catch (error) {
        warnStorageIssue(error, 'restore');
        setAuthToken(null);
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

  const registerDeviceFcmToken = useCallback(async providedToken => {
    try {
      const token = providedToken ?? (await getCurrentFcmToken());
      if (!token) {
        return;
      }

      await runWithSingleRetry(() =>
        registerFcmToken({
          fcm_token: token,
          platform: getDevicePlatform(),
          device_name: getDeviceName(),
        }),
      );

      await saveStoredFcmToken(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[FCM] register token failed: ${message}`);
    }
  }, []);

  const syncFcmOnAuthenticated = useCallback(async () => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return;
    }

    await registerDeviceFcmToken();
  }, [registerDeviceFcmToken]);

  const login = useCallback(
    async payload => {
      const response = await loginRequest(payload);
      const session = getSessionFromResponse(response);

      setUserToken(session.token);
      setUser(session.user);
      setAuthToken(session.token);
      await persistSession(session);
      await syncFcmOnAuthenticated();

      return response;
    },
    [persistSession, syncFcmOnAuthenticated],
  );

  const register = useCallback(
    async payload => {
      const response = await registerRequest(payload);
      const session = getSessionFromResponse(response);

      setUserToken(session.token);
      setUser(session.user);
      setAuthToken(session.token);
      await persistSession(session);
      await syncFcmOnAuthenticated();

      return response;
    },
    [persistSession, syncFcmOnAuthenticated],
  );

  const logout = useCallback(async () => {
    if (tokenRefreshUnsubscribeRef.current) {
      tokenRefreshUnsubscribeRef.current();
      tokenRefreshUnsubscribeRef.current = null;
    }
    if (foregroundMessageUnsubscribeRef.current) {
      foregroundMessageUnsubscribeRef.current();
      foregroundMessageUnsubscribeRef.current = null;
    }

    try {
      const lastStoredToken = await getStoredFcmToken();

      if (lastStoredToken) {
        await runWithSingleRetry(() => unregisterFcmToken(lastStoredToken));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[FCM] unregister token failed: ${message}`);
    } finally {
      await clearStoredFcmToken();
      setUserToken(null);
      setUser(null);
      setAuthToken(null);
      await clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    if (!userToken) {
      if (tokenRefreshUnsubscribeRef.current) {
        tokenRefreshUnsubscribeRef.current();
        tokenRefreshUnsubscribeRef.current = null;
      }
      if (foregroundMessageUnsubscribeRef.current) {
        foregroundMessageUnsubscribeRef.current();
        foregroundMessageUnsubscribeRef.current = null;
      }
      return undefined;
    }

    let isDisposed = false;

    const setupFcmLifecycle = async () => {
      await syncFcmOnAuthenticated();
      if (isDisposed) {
        return;
      }

      const unsubscribe = subscribeToFcmTokenRefresh(async nextToken => {
        await registerDeviceFcmToken(nextToken);
      });
      const unsubscribeForegroundMessage = messaging().onMessage(
        async remoteMessage => {
          console.log(
            '[FCM] Foreground message received:',
            JSON.stringify(remoteMessage),
          );
          await displayRemoteNotification(remoteMessage);
        },
      );

      tokenRefreshUnsubscribeRef.current = unsubscribe;
      foregroundMessageUnsubscribeRef.current = unsubscribeForegroundMessage;
    };

    setupFcmLifecycle();

    return () => {
      isDisposed = true;
      if (tokenRefreshUnsubscribeRef.current) {
        tokenRefreshUnsubscribeRef.current();
        tokenRefreshUnsubscribeRef.current = null;
      }
      if (foregroundMessageUnsubscribeRef.current) {
        foregroundMessageUnsubscribeRef.current();
        foregroundMessageUnsubscribeRef.current = null;
      }
    };
  }, [registerDeviceFcmToken, syncFcmOnAuthenticated, userToken]);

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

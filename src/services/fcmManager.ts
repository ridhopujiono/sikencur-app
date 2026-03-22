import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import type { DevicePlatform } from '../types/fcmDevice';

const FCM_TOKEN_STORAGE_KEY = '@finsight/fcm-last-token';

function getAuthorizationStatusesForiOS() {
  return [
    messaging.AuthorizationStatus.AUTHORIZED,
    messaging.AuthorizationStatus.PROVISIONAL,
    messaging.AuthorizationStatus.EPHEMERAL,
  ];
}

async function ensureRemoteMessagingReady() {
  try {
    await messaging().registerDeviceForRemoteMessages();
  } catch {
    // Ignore; token fetch may still work depending device state.
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      const sdkVersion =
        typeof Platform.Version === 'number' ? Platform.Version : Number(Platform.Version);

      if (sdkVersion >= 33) {
        const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
        const result = await PermissionsAndroid.request(permission, {
          title: 'Izin Notifikasi',
          message: 'FinSight memerlukan izin notifikasi untuk mengirim update penting.',
          buttonPositive: 'Izinkan',
          buttonNegative: 'Tolak',
        });

        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          return false;
        }
      }

      await ensureRemoteMessagingReady();
      return true;
    }

    await ensureRemoteMessagingReady();
    const authorizationStatus = await messaging().requestPermission();
    return getAuthorizationStatusesForiOS().includes(authorizationStatus);
  } catch {
    return false;
  }
}

export async function saveStoredFcmToken(token: string | null) {
  try {
    if (!token) {
      await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
      return;
    }

    await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
  } catch {
    // Keep auth/notification flow resilient against temporary storage issues.
  }
}

export async function getStoredFcmToken() {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function clearStoredFcmToken() {
  await saveStoredFcmToken(null);
}

export async function getCurrentFcmToken() {
  try {
    await ensureRemoteMessagingReady();
    const token = await messaging().getToken();
    await saveStoredFcmToken(token ?? null);
    return token ?? null;
  } catch {
    return null;
  }
}

export function subscribeToFcmTokenRefresh(
  onRefresh: (token: string) => void | Promise<void>,
) {
  return messaging().onTokenRefresh(async nextToken => {
    if (!nextToken) return;
    await saveStoredFcmToken(nextToken);
    await onRefresh(nextToken);
  });
}

export function getDevicePlatform(): DevicePlatform {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'web') return 'web';
  return 'unknown';
}

export function getDeviceName() {
  const version = typeof Platform.Version === 'string' ? Platform.Version : `${Platform.Version}`;
  return `FinSight ${Platform.OS} (${version})`;
}

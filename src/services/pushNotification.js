import { Platform } from 'react-native';
import notifee, { AndroidImportance } from '@notifee/react-native';

const DEFAULT_CHANNEL_ID = 'finsight-default';
let androidChannelPromise = null;

function getMessageText(remoteMessage) {
  const title =
    remoteMessage?.notification?.title ??
    remoteMessage?.data?.title ??
    'Notifikasi FinSight';
  const body =
    remoteMessage?.notification?.body ??
    remoteMessage?.data?.body ??
    remoteMessage?.data?.message ??
    'Anda menerima notifikasi baru.';

  return { title, body };
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return undefined;
  }

  if (!androidChannelPromise) {
    androidChannelPromise = notifee.createChannel({
      id: DEFAULT_CHANNEL_ID,
      name: 'FinSight Notifications',
      importance: AndroidImportance.HIGH,
      vibration: true,
      sound: 'default',
    });
  }

  return androidChannelPromise;
}

export async function initializePushNotifications() {
  await ensureAndroidChannel();
}

export async function displayRemoteNotification(
  remoteMessage,
  options = {},
) {
  const { skipIfHasNotificationPayload = false } = options;

  try {
    if (!remoteMessage) {
      return;
    }

    const hasNotificationPayload =
      typeof remoteMessage?.notification?.title === 'string' ||
      typeof remoteMessage?.notification?.body === 'string';

    if (skipIfHasNotificationPayload && hasNotificationPayload) {
      return;
    }

    const { title, body } = getMessageText(remoteMessage);
    if (!title && !body) {
      return;
    }

    const channelId = await ensureAndroidChannel();

    await notifee.displayNotification({
      title,
      body,
      android:
        Platform.OS === 'android' && channelId
          ? {
              channelId,
              smallIcon: 'ic_launcher',
              pressAction: { id: 'default' },
            }
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[FCM] display notification failed: ${message}`);
  }
}

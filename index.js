/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import {
  displayRemoteNotification,
  initializePushNotifications,
} from './src/services/pushNotification';

initializePushNotifications().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[FCM] initialize notification channel failed: ${message}`);
});

messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('[FCM] Background message received:', JSON.stringify(remoteMessage));
  await displayRemoteNotification(remoteMessage, {
    skipIfHasNotificationPayload: true,
  });
});

AppRegistry.registerComponent(appName, () => App);

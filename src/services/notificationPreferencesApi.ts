import { apiRequest } from '../api/client';
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesPayload,
} from '../types/notificationPreferences';

export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiRequest('/api/notification-preferences') as Promise<NotificationPreferences>;
}

export function updateNotificationPreferences(
  payload: UpdateNotificationPreferencesPayload,
): Promise<NotificationPreferences> {
  return apiRequest('/api/notification-preferences', {
    method: 'PUT',
    body: JSON.stringify(payload),
  }) as Promise<NotificationPreferences>;
}

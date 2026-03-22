import { apiRequest } from '../api/client';
import type {
  FcmTokenResponse,
  RegisterFcmTokenPayload,
} from '../types/fcmDevice';

export function registerFcmToken(
  payload: RegisterFcmTokenPayload,
): Promise<FcmTokenResponse> {
  return apiRequest('/api/devices/fcm-token', {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<FcmTokenResponse>;
}

export function unregisterFcmToken(fcmToken: string): Promise<FcmTokenResponse> {
  return apiRequest('/api/devices/fcm-token', {
    method: 'DELETE',
    body: JSON.stringify({ fcm_token: fcmToken }),
  }) as Promise<FcmTokenResponse>;
}

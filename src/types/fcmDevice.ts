export type DevicePlatform = 'android' | 'ios' | 'web' | 'unknown';

export interface RegisterFcmTokenPayload {
  fcm_token: string;
  platform?: DevicePlatform;
  device_name?: string;
}

export interface UnregisterFcmTokenPayload {
  fcm_token: string;
}

export interface FcmTokenResponse {
  success?: boolean;
  message?: string;
  data?: Record<string, unknown> | null;
}

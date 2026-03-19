import { Platform } from 'react-native';

const DEFAULT_DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';

export const API_BASE_URL = __DEV__
  ? `http://${DEFAULT_DEV_HOST}:8000`
  : 'https://api.example.com';

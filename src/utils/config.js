import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_VERSION = '1.0';
export const API_SERVER_MODES = {
  PRODUCTION: 'production',
  CUSTOM: 'custom',
};
export const DEFAULT_API_BASE_URL = 'http://148.135.76.25:8004';

const API_SERVER_STORAGE_KEY = '@sikencur/api-server';

let cachedApiServerConfig = null;

function normalizeBaseUrl(url) {
  if (typeof url !== 'string') {
    return '';
  }

  return url.trim().replace(/\/+$/, '');
}

function sanitizeApiServerConfig(config) {
  const mode =
    config?.mode === API_SERVER_MODES.CUSTOM
      ? API_SERVER_MODES.CUSTOM
      : API_SERVER_MODES.PRODUCTION;
  const customUrl = normalizeBaseUrl(config?.customUrl);

  return {
    mode,
    customUrl,
  };
}

function resolveApiBaseUrl(config) {
  if (config?.mode === API_SERVER_MODES.CUSTOM && config?.customUrl) {
    return config.customUrl;
  }

  return DEFAULT_API_BASE_URL;
}

export function isValidBaseUrl(url) {
  return /^https?:\/\/.+/i.test(normalizeBaseUrl(url));
}

export async function getApiServerConfig() {
  if (cachedApiServerConfig) {
    return cachedApiServerConfig;
  }

  try {
    const rawValue = await AsyncStorage.getItem(API_SERVER_STORAGE_KEY);

    if (!rawValue) {
      cachedApiServerConfig = sanitizeApiServerConfig();
      return cachedApiServerConfig;
    }

    cachedApiServerConfig = sanitizeApiServerConfig(JSON.parse(rawValue));
    return cachedApiServerConfig;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Config] restore api server failed: ${message}`);
    cachedApiServerConfig = sanitizeApiServerConfig();
    return cachedApiServerConfig;
  }
}

export async function getApiBaseUrl() {
  const config = await getApiServerConfig();
  return resolveApiBaseUrl(config);
}

export async function saveApiServerConfig(config) {
  const sanitizedConfig = sanitizeApiServerConfig(config);

  cachedApiServerConfig = sanitizedConfig;

  try {
    await AsyncStorage.setItem(
      API_SERVER_STORAGE_KEY,
      JSON.stringify(sanitizedConfig),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Config] persist api server failed: ${message}`);
  }

  return {
    ...sanitizedConfig,
    resolvedBaseUrl: resolveApiBaseUrl(sanitizedConfig),
  };
}

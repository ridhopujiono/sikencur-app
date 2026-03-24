import { getApiBaseUrl } from '../utils/config';

let authToken = null;

export function setAuthToken(token) {
  authToken = token ?? null;
}

export class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = options.status ?? 0;
    this.data = options.data ?? null;
    this.fieldErrors = options.fieldErrors ?? {};
  }
}

function getFirstErrorMessage(value) {
  if (Array.isArray(value)) return value[0] ?? '';
  if (typeof value === 'string') return value;
  return '';
}

function normalizeFieldErrors(payload) {
  const rawErrors = payload?.errors;

  if (!rawErrors || typeof rawErrors !== 'object') {
    return {};
  }

  return Object.entries(rawErrors).reduce((acc, [field, value]) => {
    const message = getFirstErrorMessage(value);
    if (message) {
      acc[field] = message;
    }
    return acc;
  }, {});
}

async function buildUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const baseUrl = await getApiBaseUrl();
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  return `${base}${endpoint}`;
}

async function parseResponseBody(response) {
  const rawText = await response.text();

  if (!rawText) return null;

  try {
    return JSON.parse(rawText);
  } catch {
    return { message: rawText };
  }
}

export async function apiRequest(path, options = {}) {
  const requestHeaders = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  const isFormDataBody =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!isFormDataBody && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const hasAuthorizationHeader =
    typeof requestHeaders.Authorization === 'string' ||
    typeof requestHeaders.authorization === 'string';

  if (!hasAuthorizationHeader && authToken) {
    requestHeaders.Authorization = `Bearer ${authToken}`;
  }

  const requestUrl = await buildUrl(path);

  const response = await fetch(requestUrl, {
    method: options.method ?? 'GET',
    headers: requestHeaders,
    body: options.body,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok || payload?.success === false) {
    const message =
      payload?.message ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, {
      status: response.status,
      data: payload,
      fieldErrors: normalizeFieldErrors(payload),
    });
  }

  return payload;
}

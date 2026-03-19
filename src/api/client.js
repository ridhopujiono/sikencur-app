import { API_BASE_URL } from '../utils/config';

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

function buildUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
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
  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
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

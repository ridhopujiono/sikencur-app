import { apiRequest } from './client';

export function loginRequest(payload) {
  return apiRequest('/api/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function registerRequest(payload) {
  return apiRequest('/api/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

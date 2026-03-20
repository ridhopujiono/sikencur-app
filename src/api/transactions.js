import { apiRequest } from './client';

function buildQueryString(params = {}) {
  const entries = Object.entries(params).filter(([, value]) => {
    if (value == null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  });

  if (entries.length === 0) {
    return '';
  }

  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return `?${query}`;
}

export function listTransactions(params = {}) {
  return apiRequest(`/api/transactions${buildQueryString(params)}`);
}

export function getTransactionSummary(params = {}) {
  return apiRequest(`/api/transactions/summary${buildQueryString(params)}`);
}

export function getTransactionTotal(params = {}) {
  return apiRequest(`/api/transactions/total${buildQueryString(params)}`);
}

export function upsertUserBudget(payload) {
  return apiRequest('/api/user-budgets', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function storeTransaction(payload) {
  return apiRequest('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

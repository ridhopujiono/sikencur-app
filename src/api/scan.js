import { apiRequest } from './client';

function normalizeFileForUpload(file) {
  if (!file?.uri) {
    throw new Error('Selected file is invalid.');
  }

  return {
    uri: file.uri,
    name: file.name ?? `scan-${Date.now()}`,
    type: file.type ?? 'application/octet-stream',
  };
}

export function submitReceiptScan(file) {
  const formData = new FormData();
  formData.append('image', normalizeFileForUpload(file));

  return apiRequest('/api/scan-receipt', {
    method: 'POST',
    body: formData,
  });
}

export function getReceiptScanStatus(scanId) {
  return apiRequest(`/api/scan-receipt/${scanId}`);
}


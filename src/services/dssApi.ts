import { apiRequest } from '../api/client';
import type {
  DssAnalyzeRequest,
  DssAnalyzeResponse,
  DssProfileResponse,
} from '../types/dss';

export function getDssProfile(): Promise<DssProfileResponse> {
  return apiRequest('/api/dss/profile') as Promise<DssProfileResponse>;
}

export function analyzeDssProfile(
  payload: DssAnalyzeRequest = {},
): Promise<DssAnalyzeResponse> {
  return apiRequest('/api/dss/analyze', {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<DssAnalyzeResponse>;
}

import { useQuery } from '@tanstack/react-query';
import { getDssProfile } from '../services/dssApi';

export const DSS_PROFILE_QUERY_KEY = ['dss', 'profile'] as const;

export function useDssProfile() {
  return useQuery({
    queryKey: DSS_PROFILE_QUERY_KEY,
    queryFn: getDssProfile,
  });
}

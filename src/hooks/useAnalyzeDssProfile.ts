import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzeDssProfile } from '../services/dssApi';
import type { DssAnalyzeRequest } from '../types/dss';
import { DSS_PROFILE_QUERY_KEY } from './useDssProfile';

export function useAnalyzeDssProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DssAnalyzeRequest) => analyzeDssProfile(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: DSS_PROFILE_QUERY_KEY });
    },
  });
}

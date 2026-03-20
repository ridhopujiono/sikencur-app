export type DssProfileKey =
  | 'saver'
  | 'spender'
  | 'investor'
  | 'debtor'
  | 'balanced';

export type DssScalar = string | number | boolean | null;

export type DssProfileFeatures = {
  monthly_burn_rate?: number | null;
  discretionary_ratio?: number | null;
  budget_adherence?: number | null;
  [key: string]: DssScalar | undefined;
};

export type DssProfileScores = Record<string, DssScalar>;

export type DssProfileData = {
  profile_key: DssProfileKey;
  profile_label: string;
  confidence: number;
  window_months: number;
  features: DssProfileFeatures;
  scores: DssProfileScores;
  reasons: string[];
  ruleset_version: string;
  analyzed_at: string;
};

export type DssProfileResponse = {
  data: DssProfileData | null;
  is_stale: boolean;
  analyze_required: boolean;
  latest_transaction_at: string | null;
};

export type DssAnalyzeRequest = {
  month?: number;
  year?: number;
  window_months?: number;
};

export type DssAnalyzeResponse = {
  data: DssProfileData | null;
  period?: {
    start_date: string;
    end_date: string;
  } | null;
  is_stale: boolean;
  analyze_required: boolean;
};

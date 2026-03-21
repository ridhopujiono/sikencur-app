export interface NotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  weekly_summary_enabled: boolean;
  budget_alert_enabled: boolean;
  dss_tips_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateNotificationPreferencesPayload {
  push_enabled?: boolean;
  weekly_summary_enabled?: boolean;
  budget_alert_enabled?: boolean;
  dss_tips_enabled?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  timezone?: string;
}

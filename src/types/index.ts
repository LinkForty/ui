export interface Link {
  id: string;
  userId: string;
  short_code: string;
  original_url: string;
  title?: string;
  description?: string;
  ios_url?: string;
  android_url?: string;
  web_fallback_url?: string;
  utmParameters?: UTMParameters;
  targeting_rules?: TargetingRules;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  click_count?: number;
}

export interface UTMParameters {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface TargetingRules {
  countries?: string[];
  devices?: ('ios' | 'android' | 'web')[];
  languages?: string[];
}

export interface CreateLinkRequest {
  originalUrl: string;
  title?: string;
  description?: string;
  iosUrl?: string;
  androidUrl?: string;
  webFallbackUrl?: string;
  utmParameters?: UTMParameters;
  targetingRules?: TargetingRules;
  customCode?: string;
  expiresAt?: string;
}

export interface UpdateLinkRequest extends Partial<CreateLinkRequest> {
  isActive?: boolean;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface LinkTemplateSettings {
  defaultIosUrl?: string;
  defaultAndroidUrl?: string;
  defaultWebFallbackUrl?: string;
  defaultAttributionWindowHours?: number;
  utmParameters?: UTMParameters;
  targetingRules?: TargetingRules;
  expiresAfterDays?: number;
}

export interface LinkTemplate {
  id: string;
  userId?: string;
  name: string;
  slug: string;
  description?: string;
  settings: LinkTemplateSettings;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  settings?: LinkTemplateSettings;
  isDefault?: boolean;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

export interface Link {
  id: string;
  userId?: string;
  template_id?: string;
  template_slug?: string;
  project_id?: string;
  short_code: string;
  original_url: string;
  title?: string;
  description?: string;
  ios_app_store_url?: string;
  android_app_store_url?: string;
  web_fallback_url?: string;
  app_scheme?: string;
  ios_universal_link?: string;
  android_app_link?: string;
  deep_link_path?: string;
  deep_link_parameters?: Record<string, any>;
  utmParameters?: UTMParameters;
  targeting_rules?: TargetingRules;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  og_type?: string;
  attribution_window_hours?: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  click_count?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  userId: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
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
  templateId: string;
  projectId?: string;
  originalUrl: string;
  title?: string;
  description?: string;
  iosAppStoreUrl?: string;
  androidAppStoreUrl?: string;
  webFallbackUrl?: string;
  appScheme?: string;
  iosUniversalLink?: string;
  androidAppLink?: string;
  deepLinkPath?: string;
  deepLinkParameters?: Record<string, any>;
  utmParameters?: UTMParameters;
  targetingRules?: TargetingRules;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogType?: string;
  attributionWindowHours?: number;
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

export interface Link {
  id: string;
  userId: string;
  short_code: string;
  title?: string;
  description?: string;
  // App store URLs (renamed from ios_url/android_url)
  ios_app_store_url?: string;
  android_app_store_url?: string;
  web_fallback_url?: string;
  // App deep linking configuration
  app_scheme?: string;
  ios_universal_link?: string;
  android_app_link?: string;
  deep_link_path?: string;
  deep_link_parameters?: Record<string, any>;
  // Custom scheme URL for push notifications (e.g., "myapp://path/to/content")
  custom_scheme_url?: string;
  // Click-id passthrough: redirect appends ?lf_click=<id> to web destinations.
  // Cloud defaults this to true; false opts the link out (e.g. presigned URLs).
  append_click_id?: boolean;
  // Launchpad page override: 'inherit' follows the workspace setting, 'on'
  // shows the page to desktop visitors even when the link has a web
  // destination, 'off' never shows it. Column is @linkforty/core's.
  launchpad_mode?: 'inherit' | 'on' | 'off';
  // Existing fields
  utmParameters?: UTMParameters;
  targeting_rules?: TargetingRules;
  attribution_window_hours?: number;
  event_attribution_window_hours?: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  click_count?: number;
  template_id?: string;
  template_slug?: string;
  project_id?: string;
  project_name?: string; // Joined from projects table
  project_color?: string; // Joined project color key (see PROJECT_COLORS)
  // Custom domain assignment. NULL domain_id = org default domain.
  domain_id?: string | null;
  domain?: string | null; // Joined hostname; null when unassigned or unverified
  // Resolved by the API: assigned domain → org default → platform,
  // with the template slug. Absent only on rows cached before it shipped.
  short_url?: string;
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
  // null clears an existing project assignment on update; undefined leaves it alone.
  projectId?: string | null;
  // null clears an existing custom domain assignment (back to org default).
  domainId?: string | null;
  title?: string;
  description?: string;
  // App store URLs (renamed from iosUrl/androidUrl)
  iosAppStoreUrl?: string;
  androidAppStoreUrl?: string;
  webFallbackUrl?: string;
  // App deep linking configuration
  appScheme?: string;
  iosUniversalLink?: string;
  androidAppLink?: string;
  deepLinkPath?: string;
  deepLinkParameters?: Record<string, any>;
  // Custom scheme URL for push notifications (e.g., "myapp://path/to/content")
  customSchemeUrl?: string;
  // Existing fields
  utmParameters?: UTMParameters;
  targetingRules?: TargetingRules;
  attributionWindowHours?: number;
  eventAttributionWindowHours?: number;
  appendClickId?: boolean;
  launchpadMode?: 'inherit' | 'on' | 'off';
  customCode?: string;
  expiresAt?: string;
}

export interface UpdateLinkRequest extends Omit<Partial<CreateLinkRequest>, 'expiresAt'> {
  isActive?: boolean;
  // null explicitly clears an existing expiration date
  expiresAt?: string | null;
}

// Verified custom domain offered in the link modals' Domain select
export interface CustomDomainOption {
  id: string;
  domain: string;
  isDefault?: boolean;
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

export interface LinkTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  settings: {
    // Default platform URLs (can be overridden per link)
    defaultIosAppStoreUrl?: string;
    defaultAndroidAppStoreUrl?: string;
    defaultWebFallbackUrl?: string;
    // Default app deep linking configuration
    defaultAppScheme?: string;
    defaultIosUniversalLink?: string;
    defaultAndroidAppLink?: string;
    defaultDeepLinkPath?: string;
    defaultDeepLinkParameters?: Record<string, any>;
    // Default attribution window (can be overridden per link)
    defaultAttributionWindowHours?: number;
    // Default conversion (event-attribution) window (can be overridden per link)
    defaultEventAttributionWindowHours?: number;
    // Default UTM parameters (can be overridden per link)
    utmParameters?: UTMParameters;
    // Default targeting rules (can be overridden per link)
    targetingRules?: TargetingRules;
    expiresAfterDays?: number;
  };
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  settings?: LinkTemplate['settings'];
  isDefault?: boolean;
}

export interface UpdateTemplateRequest extends Partial<CreateTemplateRequest> {}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Organization app configuration (stored in organizations.settings.appConfig)
export interface AppConfig {
  appScheme?: string;                    // URI scheme for deep linking (e.g., "myapp" or "com.company.app")
  iosTeamId?: string;                    // Apple Developer Team ID (e.g., "ABCDE12345")
  iosBundleId?: string;                  // iOS bundle identifier (e.g., "com.company.app")
  androidPackageName?: string;           // Android package name (e.g., "com.company.app")
  androidSha256Fingerprints?: string[];  // SHA-256 certificate fingerprints for Android App Links
  iosUniversalLinkDomain?: string;       // Domain for iOS Universal Links (e.g., "app.company.com")
  androidAppLinkDomain?: string;         // Domain for Android App Links (e.g., "app.company.com")
  customSchemePattern?: string;          // Custom URL scheme pattern for push notifications (e.g., "myapp://")
  iosAppStoreUrl?: string;              // Default iOS App Store URL (fallback when template doesn't specify)
  androidAppStoreUrl?: string;          // Default Android Play Store URL (fallback when template doesn't specify)
  webFallbackUrl?: string;              // Default web fallback URL (fallback when template doesn't specify)
  ephemeralDeepLinks?: boolean;         // When enabled, deep link parameters are deleted after delivery
}

// Organization settings structure (stored in organizations.settings JSONB field)
export interface OrganizationSettings {
  appConfig?: AppConfig;
  // Future settings can be added here (branding, notifications, etc.)
}

// Organization entity
export interface Organization {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  settings?: OrganizationSettings;
  subscriptionTier?: 'free' | 'starter' | 'pro' | 'enterprise';
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | 'trialing';
  createdAt: string;
  updatedAt: string;
}

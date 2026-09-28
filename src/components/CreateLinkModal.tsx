import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Info } from 'lucide-react';
import { CreateLinkRequest, LinkTemplate, AppConfig, Project, CustomDomainOption } from '../types';
import { DEFAULT_SHORTLINK_DOMAIN } from '../constants/shortlink';

const createLinkSchema = z.object({
  // .nullable() so that clearing the dropdown sends null (not undefined).
  projectId: z.string().optional().nullable(),
  // Custom domain assignment — empty/null means "use the workspace default"
  domainId: z.string().optional().nullable(),
  title: z.string().max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  // App store URLs (renamed)
  iosAppStoreUrl: z.string().url('Please enter a valid iOS App Store URL').optional().or(z.literal('')),
  androidAppStoreUrl: z.string().url('Please enter a valid Android Play Store URL').optional().or(z.literal('')),
  webFallbackUrl: z.string().url('Please enter a valid fallback URL').optional().or(z.literal('')),
  customSchemeUrl: z.string().optional().or(z.literal('')),
  // App deep linking configuration
  appScheme: z.string()
    .regex(/^[a-z][a-z0-9+.-]*$/, 'Invalid URI scheme format (must start with lowercase letter)')
    .max(255, 'App scheme too long')
    .optional()
    .or(z.literal('')),
  iosUniversalLink: z.string().url('Please enter a valid iOS Universal Link URL').optional().or(z.literal('')),
  androidAppLink: z.string().url('Please enter a valid Android App Link URL').optional().or(z.literal('')),
  deepLinkPath: z.string().max(500, 'Deep link path too long').optional(),
  // Existing fields
  customCode: z.string()
    .regex(/^[a-zA-Z0-9_-]*$/, 'Only letters, numbers, hyphens, and underscores allowed')
    .min(3, 'Custom code must be at least 3 characters')
    .max(50, 'Custom code must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  templateId: z.string().min(1, 'Please select a template'),
  attributionWindowHours: z.coerce.number()
    .int('Attribution window must be an integer')
    .min(1, 'Attribution window must be at least 1 hour')
    .max(2160, 'Attribution window must be at most 2160 hours (90 days)')
    .default(168),
  // Optional — empty means "use default" (resolved server-side to 168h).
  eventAttributionWindowHours: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number()
      .int('Event attribution window must be an integer')
      .min(1, 'Event attribution window must be at least 1 hour')
      .max(2160, 'Event attribution window must be at most 2160 hours (90 days)')
      .optional(),
  ),
  appendClickId: z.boolean().optional(),
  launchpadMode: z.enum(['inherit', 'on', 'off']).optional(),
  // datetime-local input value ("YYYY-MM-DDTHH:mm" in the user's timezone);
  // converted to ISO on submit. Empty string = no expiration.
  expiresAt: z.string().optional(),
  utmSource: z.string().max(255, 'UTM source too long').optional(),
  utmMedium: z.string().max(255, 'UTM medium too long').optional(),
  utmCampaign: z.string().max(255, 'UTM campaign too long').optional(),
  utmTerm: z.string().max(255, 'UTM term too long').optional(),
  utmContent: z.string().max(255, 'UTM content too long').optional(),
  targetCountries: z.array(z.string()).optional(),
  targetDevices: z.array(z.enum(['ios', 'android', 'web'])).optional(),
  targetLanguages: z.array(z.string()).optional(),
});

type CreateLinkFormData = z.infer<typeof createLinkSchema>;

interface CreateLinkModalProps {
  /**
   * The short-link host this deployment serves on, e.g. `go.linkforty.com`.
   *
   * Optional, and only used when neither the link nor the workspace supplies a
   * domain. The host application knows which domain its backend actually serves;
   * this package does not, and must not read the app's environment to find out.
   * Omitted, it falls back to the platform default in `constants/shortlink.ts`.
   */
  defaultDomain?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLinkRequest) => Promise<void>;
  isLoading?: boolean;
  templates: LinkTemplate[];
  projects?: Project[];
  /** Verified custom domains offered in the Domain select. */
  domains?: CustomDomainOption[];
  orgAppConfig?: AppConfig;
}

const COUNTRY_OPTIONS = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
];

interface DeepLinkParameter {
  key: string;
  value: string;
}

export function CreateLinkModal({ isOpen, onClose, onSubmit, isLoading, templates, projects = [], domains = [], orgAppConfig, defaultDomain }: CreateLinkModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<('ios' | 'android' | 'web')[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [deepLinkParams, setDeepLinkParams] = useState<DeepLinkParameter[]>([]);
  const [usePushNotification, setUsePushNotification] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
    // Click-id passthrough is on by default for Cloud links (web attribution).
    defaultValues: { appendClickId: true, launchpadMode: 'inherit' },
  });

  // Watch for template selection changes
  const selectedTemplateId = watch('templateId');

  // Apply organization app config defaults when modal opens (runs before template defaults)
  useEffect(() => {
    if (!isOpen || !orgAppConfig) return;

    // Only set values if they're not already filled and org config has them
    if (orgAppConfig.appScheme && !watch('appScheme')) {
      setValue('appScheme', orgAppConfig.appScheme);
    }
  }, [isOpen, orgAppConfig, setValue, watch]);

  // Auto-fill custom scheme URL when push notification mode is toggled on
  useEffect(() => {
    if (usePushNotification && orgAppConfig?.customSchemePattern) {
      // Only auto-fill if the field is empty
      if (!watch('customSchemeUrl')) {
        setValue('customSchemeUrl', orgAppConfig.customSchemePattern);
      }
    }
  }, [usePushNotification, orgAppConfig, setValue, watch]);

  // Apply template defaults when template is selected
  useEffect(() => {
    if (!selectedTemplateId) return;

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template || !template.settings) return;

    const { settings } = template;

    // Only set values if they're not already filled by the user
    // This allows template defaults to populate but user can still override

    if (settings.defaultIosAppStoreUrl && !watch('iosAppStoreUrl')) {
      setValue('iosAppStoreUrl', settings.defaultIosAppStoreUrl);
    }

    if (settings.defaultAndroidAppStoreUrl && !watch('androidAppStoreUrl')) {
      setValue('androidAppStoreUrl', settings.defaultAndroidAppStoreUrl);
    }

    if (settings.defaultWebFallbackUrl && !watch('webFallbackUrl')) {
      setValue('webFallbackUrl', settings.defaultWebFallbackUrl);
    }

    if (settings.defaultAppScheme && !watch('appScheme')) {
      setValue('appScheme', settings.defaultAppScheme);
    }

    if (settings.defaultIosUniversalLink && !watch('iosUniversalLink')) {
      setValue('iosUniversalLink', settings.defaultIosUniversalLink);
    }

    if (settings.defaultAndroidAppLink && !watch('androidAppLink')) {
      setValue('androidAppLink', settings.defaultAndroidAppLink);
    }

    if (settings.defaultDeepLinkPath && !watch('deepLinkPath')) {
      setValue('deepLinkPath', settings.defaultDeepLinkPath);
    }

    // Apply default deep link parameters from template
    if (settings.defaultDeepLinkParameters && deepLinkParams.length === 0) {
      const params = Object.entries(settings.defaultDeepLinkParameters).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      setDeepLinkParams(params);
    }

    if (settings.defaultAttributionWindowHours && !watch('attributionWindowHours')) {
      setValue('attributionWindowHours', settings.defaultAttributionWindowHours);
    }

    if (settings.defaultEventAttributionWindowHours && !watch('eventAttributionWindowHours')) {
      setValue('eventAttributionWindowHours', settings.defaultEventAttributionWindowHours);
    }

    // Apply UTM parameters from template (merge, don't override)
    if (settings.utmParameters) {
      if (settings.utmParameters.source && !watch('utmSource')) {
        setValue('utmSource', settings.utmParameters.source);
      }
      if (settings.utmParameters.medium && !watch('utmMedium')) {
        setValue('utmMedium', settings.utmParameters.medium);
      }
      if (settings.utmParameters.campaign && !watch('utmCampaign')) {
        setValue('utmCampaign', settings.utmParameters.campaign);
      }
      if (settings.utmParameters.term && !watch('utmTerm')) {
        setValue('utmTerm', settings.utmParameters.term);
      }
      if (settings.utmParameters.content && !watch('utmContent')) {
        setValue('utmContent', settings.utmParameters.content);
      }
    }

    // Apply targeting rules from template
    if (settings.targetingRules) {
      if (settings.targetingRules.countries && selectedCountries.length === 0) {
        setSelectedCountries(settings.targetingRules.countries);
      }
      if (settings.targetingRules.devices && selectedDevices.length === 0) {
        setSelectedDevices(settings.targetingRules.devices);
      }
      if (settings.targetingRules.languages && selectedLanguages.length === 0) {
        setSelectedLanguages(settings.targetingRules.languages);
      }
    }
  }, [selectedTemplateId, templates, setValue, watch, selectedCountries.length, selectedDevices.length, selectedLanguages.length, deepLinkParams.length]);

  const handleFormSubmit = async (data: CreateLinkFormData) => {
    // Build deep link parameters object from dynamic array
    const deepLinkParameters: Record<string, any> = {};
    deepLinkParams.forEach(param => {
      if (param.key && param.value) {
        deepLinkParameters[param.key] = param.value;
      }
    });

    const linkData: CreateLinkRequest = {
      // Send null when no project selected so the create handler stores NULL
      // (and keeps Create and Edit sending the same shape).
      projectId: data.projectId || null,
      domainId: data.domainId || null,
      title: data.title,
      description: data.description,
      // App store URLs (renamed)
      iosAppStoreUrl: data.iosAppStoreUrl || undefined,
      androidAppStoreUrl: data.androidAppStoreUrl || undefined,
      webFallbackUrl: data.webFallbackUrl || undefined,
      // Only send customSchemeUrl if push notification checkbox is checked
      customSchemeUrl: usePushNotification ? (data.customSchemeUrl || undefined) : undefined,
      // App deep linking configuration
      appScheme: data.appScheme || undefined,
      iosUniversalLink: data.iosUniversalLink || undefined,
      androidAppLink: data.androidAppLink || undefined,
      deepLinkPath: data.deepLinkPath || undefined,
      deepLinkParameters: Object.keys(deepLinkParameters).length > 0 ? deepLinkParameters : undefined,
      // Existing fields
      customCode: data.customCode,
      templateId: data.templateId,
      attributionWindowHours: data.attributionWindowHours,
      eventAttributionWindowHours: data.eventAttributionWindowHours,
      appendClickId: data.appendClickId,
      launchpadMode: data.launchpadMode,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
      // Only send UTM parameters if at least one field has a value
      utmParameters: (data.utmSource || data.utmMedium || data.utmCampaign || data.utmTerm || data.utmContent) ? {
        source: data.utmSource || undefined,
        medium: data.utmMedium || undefined,
        campaign: data.utmCampaign || undefined,
        term: data.utmTerm || undefined,
        content: data.utmContent || undefined,
      } : undefined,
      targetingRules: (selectedCountries.length > 0 || selectedDevices.length > 0 || selectedLanguages.length > 0) ? {
        countries: selectedCountries.length > 0 ? selectedCountries : undefined,
        devices: selectedDevices.length > 0 ? selectedDevices : undefined,
        languages: selectedLanguages.length > 0 ? selectedLanguages : undefined,
      } : undefined,
    };

    await onSubmit(linkData);
    reset();
    setSelectedCountries([]);
    setSelectedDevices([]);
    setSelectedLanguages([]);
    setDeepLinkParams([]);
    setUsePushNotification(false);
    onClose();
  };

  const handleClose = () => {
    reset();
    setSelectedCountries([]);
    setSelectedDevices([]);
    setSelectedLanguages([]);
    setDeepLinkParams([]);
    setUsePushNotification(false);
    onClose();
  };

  const addDeepLinkParam = () => {
    setDeepLinkParams(prev => [...prev, { key: '', value: '' }]);
  };

  const removeDeepLinkParam = (index: number) => {
    setDeepLinkParams(prev => prev.filter((_, i) => i !== index));
  };

  const updateDeepLinkParam = (index: number, field: 'key' | 'value', value: string) => {
    setDeepLinkParams(prev => prev.map((param, i) =>
      i === index ? { ...param, [field]: value } : param
    ));
  };

  const toggleCountry = (code: string) => {
    setSelectedCountries(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const toggleDevice = (device: 'ios' | 'android' | 'web') => {
    setSelectedDevices(prev =>
      prev.includes(device) ? prev.filter(d => d !== device) : [...prev, device]
    );
  };

  const toggleLanguage = (code: string) => {
    setSelectedLanguages(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />

        <div className="surface-popover relative rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create New Link</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Title
                  </label>
                  <input
                    {...register('title')}
                    type="text"
                    className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="My Campaign Link"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Custom Short Code
                  </label>
                  <input
                    {...register('customCode')}
                    type="text"
                    className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                    placeholder="my-code (optional)"
                  />
                  {errors.customCode && (
                    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.customCode.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Optional description for this link"
                />
              </div>
            </div>

            {/* Template & Attribution Section */}
            <div className="space-y-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Link Configuration</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Template <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  {...register('templateId')}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.slug})
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  All links must be assigned to a template for URL organization
                </p>
                {errors.templateId && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.templateId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Project <span className="text-gray-500 dark:text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <select
                  {...register('projectId')}
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Group this link with related links in a project
                </p>
                {errors.projectId && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.projectId.message}</p>
                )}
              </div>

              {/* Domain select — only shown when there's a real choice:
                  more than one verified domain, or one that isn't the default */}
              {(domains.length > 1 || (domains.length === 1 && !domains[0].isDefault)) && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                    Domain <span className="text-gray-500 dark:text-gray-400 font-normal text-xs">(Optional)</span>
                  </label>
                  <select
                    {...register('domainId')}
                    className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">
                      Default ({domains.find(d => d.isDefault)?.domain || defaultDomain || DEFAULT_SHORTLINK_DOMAIN})
                    </option>
                    {domains.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.domain}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    The domain shown when sharing this link — every connected domain resolves it
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Attribution Window
                </label>
                <select
                  {...register('attributionWindowHours')}
                  defaultValue="168"
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="1">1 hour</option>
                  <option value="24">24 hours (1 day)</option>
                  <option value="72">72 hours (3 days)</option>
                  <option value="168">168 hours (7 days) - Default</option>
                  <option value="336">336 hours (14 days)</option>
                  <option value="720">720 hours (30 days)</option>
                  <option value="2160">2160 hours (90 days)</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Time window for attributing app installs to this link
                </p>
                {errors.attributionWindowHours && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.attributionWindowHours.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Event Attribution Window
                </label>
                <select
                  {...register('eventAttributionWindowHours')}
                  defaultValue=""
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Use default (7 days)</option>
                  <option value="1">1 hour</option>
                  <option value="24">24 hours (1 day)</option>
                  <option value="72">72 hours (3 days)</option>
                  <option value="168">168 hours (7 days)</option>
                  <option value="336">336 hours (14 days)</option>
                  <option value="720">720 hours (30 days)</option>
                  <option value="2160">2160 hours (90 days)</option>
                </select>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  How long after a click in-app events (screen views, purchases) are attributed to this link
                </p>
                {errors.eventAttributionWindowHours && (
                  <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.eventAttributionWindowHours.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                  Expiration Date <span className="text-gray-500 dark:text-gray-400 font-normal text-xs">(Optional)</span>
                </label>
                <input
                  {...register('expiresAt')}
                  type="datetime-local"
                  className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  The link stops redirecting after this time — visitors see a "link expired" page instead. Leave empty for a permanent link.
                </p>
              </div>
            </div>

            {/* Link Type Toggle - MOVED UP FOR BETTER UX */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={usePushNotification}
                    onChange={(e) => {
                      setUsePushNotification(e.target.checked);
                      // Clear customSchemeUrl when unchecked
                      if (!e.target.checked) {
                        setValue('customSchemeUrl', '');
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-800 accent-blue-600 dark:accent-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                    Use for push notifications (custom URL scheme)
                  </span>
                </label>
                <p className="mt-1 ml-7 text-xs text-gray-600 dark:text-gray-400">
                  Enable this to create a link that opens your app directly from push notifications
                </p>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                {/* App Configuration Section */}
                <div className="surface-sunken space-y-4 p-4 rounded-lg border">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">App Configuration</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Configure your app's URL scheme for deep linking</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                      App URL Scheme
                    </label>
                    <input
                      {...register('appScheme')}
                      type="text"
                      className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                      placeholder="myapp or com.company.app"
                    />
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      Use the same scheme for both iOS and Android (typically your bundle ID)
                    </p>
                    {errors.appScheme && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.appScheme.message}</p>
                    )}
                  </div>
                </div>

                {/* Deep Link Destination Section */}
                <div className="surface-sunken space-y-4 p-4 rounded-lg border">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Deep Link Destination</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Where to navigate inside your app</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                      Deep Link Path
                    </label>
                    <input
                      {...register('deepLinkPath')}
                      type="text"
                      className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                      placeholder="/product/123"
                    />
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      In-app destination path (combined with app scheme for URI scheme URLs)
                    </p>
                    {errors.deepLinkPath && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.deepLinkPath.message}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                        Custom Parameters <span className="text-gray-500 dark:text-gray-400 font-normal text-xs">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={addDeepLinkParam}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Parameter
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Additional key-value pairs to pass to your app as query parameters
                    </p>

                    {deepLinkParams.length === 0 ? (
                      <div className="surface-sunken text-sm text-gray-500 dark:text-gray-400 italic py-6 text-center border-2 border-dashed rounded-md">
                        No parameters added. Click "Add Parameter" to add custom data.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {deepLinkParams.map((param, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={param.key}
                              onChange={(e) => updateDeepLinkParam(index, 'key', e.target.value)}
                              placeholder="Key (e.g., productId)"
                              className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                            />
                            <input
                              type="text"
                              value={param.value}
                              onChange={(e) => updateDeepLinkParam(index, 'value', e.target.value)}
                              placeholder="Value (e.g., 12345)"
                              className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => removeDeepLinkParam(index)}
                              className="p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors flex-shrink-0"
                              title="Remove parameter"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Universal & App Links Section */}
                <div className="surface-sunken space-y-4 p-4 rounded-lg border">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Universal & App Links</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">HTTPS URLs that open your app when installed (preferred method)</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        iOS Universal Link
                      </label>
                      <input
                        {...register('iosUniversalLink')}
                        type="url"
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="https://yourdomain.com/link"
                      />
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Requires .well-known/apple-app-site-association file
                      </p>
                      {errors.iosUniversalLink && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.iosUniversalLink.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        Android App Link
                      </label>
                      <input
                        {...register('androidAppLink')}
                        type="url"
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="https://yourdomain.com/link"
                      />
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Requires .well-known/assetlinks.json file
                      </p>
                      {errors.androidAppLink && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.androidAppLink.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Push Notification Custom Scheme URL - Only shown when toggle is ON */}
                {usePushNotification && (
                  <div className="surface-sunken space-y-4 p-4 rounded-lg border">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white">Push Notification URL</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Custom URL scheme to open your app directly</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        Custom Scheme URL
                      </label>
                      <input
                        {...register('customSchemeUrl')}
                        type="text"
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="myapp://path/to/content"
                      />
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Example: myapp://article/123 or yourapp://screen/parameter
                      </p>
                      {errors.customSchemeUrl && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.customSchemeUrl.message}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* App Store URLs Section - Always shown, disabled when push notification mode is ON */}
                <div className="surface-sunken space-y-4 p-4 rounded-lg border">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">App Store URLs</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Where to send users who don't have the app installed</p>
                  </div>

                  {/* Info banner when push notification mode is enabled */}
                  {usePushNotification && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                          Push notification deep links don't need app store redirects
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                          Push notification links only show to users with your app installed, so app store URLs are not needed.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className={`block text-sm font-semibold mb-1.5 ${usePushNotification ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                        iOS App Store URL
                      </label>
                      <input
                        {...register('iosAppStoreUrl')}
                        type="url"
                        disabled={usePushNotification}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          usePushNotification
                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-600'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
                        }`}
                        placeholder="https://apps.apple.com/app/id123"
                      />
                      {errors.iosAppStoreUrl && !usePushNotification && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.iosAppStoreUrl.message}</p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-sm font-semibold mb-1.5 ${usePushNotification ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                        Android Play Store URL
                      </label>
                      <input
                        {...register('androidAppStoreUrl')}
                        type="url"
                        disabled={usePushNotification}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          usePushNotification
                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-600'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
                        }`}
                        placeholder="https://play.google.com/store/apps/details?id=com.app"
                      />
                      {errors.androidAppStoreUrl && !usePushNotification && (
                        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.androidAppStoreUrl.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-1.5 ${usePushNotification ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                      Web Fallback URL
                    </label>
                    <input
                      {...register('webFallbackUrl')}
                      type="url"
                      disabled={usePushNotification}
                        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          usePushNotification
                            ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed placeholder-gray-400 dark:placeholder-gray-600'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500'
                        }`}
                      placeholder="https://example.com/fallback"
                    />
                    {!usePushNotification && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        For web browsers (if no app-specific URL applies)
                      </p>
                    )}
                    {errors.webFallbackUrl && !usePushNotification && (
                      <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{errors.webFallbackUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className={`flex items-start gap-2 ${usePushNotification ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        {...register('appendClickId')}
                        type="checkbox"
                        disabled={usePushNotification}
                        className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-800 accent-blue-600 dark:accent-blue-500 disabled:cursor-not-allowed"
                      />
                      <span>
                        <span className={`block text-sm font-semibold ${usePushNotification ? 'text-gray-400 dark:text-gray-500' : 'text-gray-700 dark:text-gray-200'}`}>
                          Append click ID to destination URL
                        </span>
                        <span className="block mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          Adds <code>?lf_click=…</code> to the web destination on each redirect so the LinkForty
                          web pixel can attribute the landing visit to this exact click. Turn off if the
                          destination rejects modified URLs — e.g. presigned or signed links (S3, Google Cloud
                          Storage) that fail when any query parameter is added.
                        </span>
                      </span>
                    </label>
                  </div>

                  <div>
                    <label htmlFor="create-launchpad-mode" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                      Launchpad page
                    </label>
                    <select
                      id="create-launchpad-mode"
                      {...register('launchpadMode')}
                      className="block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="inherit">Workspace default</option>
                      <option value="on">Always show</option>
                      <option value="off">Never show</option>
                    </select>
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      The page shown when this link can't open the app. Configure the workspace default under
                      Social Preview → Launchpad.
                    </p>
                  </div>
                </div>

                {/* UTM Parameters Section */}
                <div className="surface-sunken space-y-4 p-4 rounded-lg border">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">UTM Parameters</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Track campaign performance</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        UTM Source
                      </label>
                      <input
                        {...register('utmSource')}
                        type="text"
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="facebook"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        UTM Medium
                      </label>
                      <input
                        {...register('utmMedium')}
                        type="text"
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="social"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        UTM Campaign
                      </label>
                      <input
                        {...register('utmCampaign')}
                        type="text"
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="summer_sale"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                        UTM Term
                      </label>
                      <input
                        {...register('utmTerm')}
                        type="text"
                        className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="keyword"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
                      UTM Content
                    </label>
                    <input
                      {...register('utmContent')}
                      type="text"
                      className="block w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="banner_ad, text_link"
                    />
                  </div>
                </div>

                {/* Targeting Rules Section */}
                <div className="surface-sunken space-y-4 p-4 rounded-lg border">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Targeting Rules</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Optional: Restrict this link to specific audiences
                    </p>
                  </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Target Countries
                  </label>
                  <div className="flex flex-wrap gap-2 max-w-full">
                    {COUNTRY_OPTIONS.map(country => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => toggleCountry(country.code)}
                        className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                          selectedCountries.includes(country.code)
                            ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {country.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Target Devices
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleDevice('ios')}
className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                          selectedDevices.includes('ios')
                          ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      iOS
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDevice('android')}
className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                          selectedDevices.includes('android')
                          ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      Android
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDevice('web')}
className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                          selectedDevices.includes('web')
                          ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                      }`}
                    >
                      Web
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Target Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(language => (
                      <button
                        key={language.code}
                        type="button"
                        onClick={() => toggleLanguage(language.code)}
                        className={`px-3 py-1 text-sm rounded-md border transition-colors ${
                          selectedLanguages.includes(language.code)
                            ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {language.name}
                      </button>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-8 border-t-2 border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Link'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

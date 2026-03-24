import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { CreateLinkRequest, LinkTemplate, Project } from '../types';

const createLinkSchema = z.object({
  templateId: z.string().min(1, 'Template is required'),
  projectId: z.string().optional(),
  originalUrl: z.string().min(1, 'URL is required').url('Please enter a valid URL'),
  title: z.string().max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  iosAppStoreUrl: z.string().url('Please enter a valid iOS URL').optional().or(z.literal('')),
  androidAppStoreUrl: z.string().url('Please enter a valid Android URL').optional().or(z.literal('')),
  webFallbackUrl: z.string().url('Please enter a valid fallback URL').optional().or(z.literal('')),
  appScheme: z.string()
    .regex(/^[a-z][a-z0-9+.-]*$/, 'Invalid URI scheme format')
    .optional()
    .or(z.literal('')),
  iosUniversalLink: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  androidAppLink: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  deepLinkPath: z.string().optional(),
  customCode: z.string()
    .regex(/^[a-zA-Z0-9_-]*$/, 'Only letters, numbers, hyphens, and underscores allowed')
    .min(3, 'Custom code must be at least 3 characters')
    .max(50, 'Custom code must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  ogTitle: z.string().max(255, 'OG title must be less than 255 characters').optional(),
  ogDescription: z.string().max(1000, 'OG description must be less than 1000 characters').optional(),
  ogImageUrl: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
  ogType: z.string().max(50, 'OG type too long').optional(),
  attributionWindowHours: z.number()
    .int('Attribution window must be a whole number')
    .min(1, 'Attribution window must be at least 1 hour')
    .max(2160, 'Attribution window must be at most 2160 hours (90 days)')
    .optional(),
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
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLinkRequest) => Promise<void>;
  isLoading?: boolean;
  templates: LinkTemplate[];
  projects?: Project[];
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

export function CreateLinkModal({ isOpen, onClose, onSubmit, isLoading, templates, projects = [] }: CreateLinkModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<('ios' | 'android' | 'web')[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
  });

  // Watch for template selection changes
  const selectedTemplateId = watch('templateId');

  // Apply template defaults when template is selected
  useEffect(() => {
    if (!selectedTemplateId) return;

    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template || !template.settings) return;

    const { settings } = template;

    // Apply platform URLs from template if not already filled
    if (settings.defaultIosUrl) {
      setValue('iosAppStoreUrl', settings.defaultIosUrl);
    }
    if (settings.defaultAndroidUrl) {
      setValue('androidAppStoreUrl', settings.defaultAndroidUrl);
    }
    if (settings.defaultWebFallbackUrl) {
      setValue('webFallbackUrl', settings.defaultWebFallbackUrl);
    }

    // Apply attribution window from template
    if (settings.defaultAttributionWindowHours) {
      setValue('attributionWindowHours', settings.defaultAttributionWindowHours);
    }

    // Apply UTM parameters from template
    if (settings.utmParameters) {
      if (settings.utmParameters.source) setValue('utmSource', settings.utmParameters.source);
      if (settings.utmParameters.medium) setValue('utmMedium', settings.utmParameters.medium);
      if (settings.utmParameters.campaign) setValue('utmCampaign', settings.utmParameters.campaign);
      if (settings.utmParameters.term) setValue('utmTerm', settings.utmParameters.term);
      if (settings.utmParameters.content) setValue('utmContent', settings.utmParameters.content);
    }

    // Apply targeting rules from template
    if (settings.targetingRules) {
      if (settings.targetingRules.countries) {
        setSelectedCountries(settings.targetingRules.countries);
      }
      if (settings.targetingRules.devices) {
        setSelectedDevices(settings.targetingRules.devices);
      }
      if (settings.targetingRules.languages) {
        setSelectedLanguages(settings.targetingRules.languages);
      }
    }
  }, [selectedTemplateId, templates, setValue]);

  const handleFormSubmit = async (data: CreateLinkFormData) => {
    const linkData: CreateLinkRequest = {
      templateId: data.templateId,
      projectId: data.projectId || undefined,
      originalUrl: data.originalUrl,
      title: data.title,
      description: data.description,
      iosAppStoreUrl: data.iosAppStoreUrl || undefined,
      androidAppStoreUrl: data.androidAppStoreUrl || undefined,
      webFallbackUrl: data.webFallbackUrl || undefined,
      appScheme: data.appScheme || undefined,
      iosUniversalLink: data.iosUniversalLink || undefined,
      androidAppLink: data.androidAppLink || undefined,
      deepLinkPath: data.deepLinkPath || undefined,
      customCode: data.customCode,
      ogTitle: data.ogTitle,
      ogDescription: data.ogDescription,
      ogImageUrl: data.ogImageUrl || undefined,
      ogType: data.ogType,
      attributionWindowHours: data.attributionWindowHours,
      utmParameters: {
        source: data.utmSource,
        medium: data.utmMedium,
        campaign: data.utmCampaign,
        term: data.utmTerm,
        content: data.utmContent,
      },
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
    onClose();
  };

  const handleClose = () => {
    reset();
    setSelectedCountries([]);
    setSelectedDevices([]);
    setSelectedLanguages([]);
    onClose();
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Create New Link</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Template *
              </label>
              <select
                {...register('templateId')}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Select a template</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Template settings will auto-populate the form below
              </p>
              {errors.templateId && (
                <p className="mt-1 text-sm text-red-600">{errors.templateId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Destination URL *
              </label>
              <input
                {...register('originalUrl')}
                type="url"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://example.com"
              />
              {errors.originalUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.originalUrl.message}</p>
              )}
            </div>

            {projects && projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Project
                </label>
                <select
                  {...register('projectId')}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">No Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Organize your link within a project
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Link title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Custom Short Code
                </label>
                <input
                  {...register('customCode')}
                  type="text"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="custom-code (optional)"
                />
                {errors.customCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.customCode.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Link description"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>
            </div>

            {showAdvanced && (
              <div className="space-y-6 border-t pt-6">
                <h4 className="text-md font-medium text-gray-900">Platform-Specific URLs</h4>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      iOS App Store URL
                    </label>
                    <input
                      {...register('iosAppStoreUrl')}
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://apps.apple.com/..."
                    />
                    {errors.iosAppStoreUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.iosAppStoreUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Android App Store URL
                    </label>
                    <input
                      {...register('androidAppStoreUrl')}
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://play.google.com/..."
                    />
                    {errors.androidAppStoreUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.androidAppStoreUrl.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Web Fallback URL
                  </label>
                  <input
                    {...register('webFallbackUrl')}
                    type="url"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="https://example.com/fallback"
                  />
                  {errors.webFallbackUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.webFallbackUrl.message}</p>
                  )}
                </div>

                <h4 className="text-md font-medium text-gray-900">Deep Linking</h4>
                <p className="text-sm text-gray-500 -mt-2">
                  Configure how the link opens your app directly
                </p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      App URI Scheme
                    </label>
                    <input
                      {...register('appScheme')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="myapp"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      e.g., "myapp" or "com.company.app"
                    </p>
                    {errors.appScheme && (
                      <p className="mt-1 text-sm text-red-600">{errors.appScheme.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Deep Link Path
                    </label>
                    <input
                      {...register('deepLinkPath')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="/product/123"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      In-app destination path
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      iOS Universal Link
                    </label>
                    <input
                      {...register('iosUniversalLink')}
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://app.example.com/..."
                    />
                    {errors.iosUniversalLink && (
                      <p className="mt-1 text-sm text-red-600">{errors.iosUniversalLink.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Android App Link
                    </label>
                    <input
                      {...register('androidAppLink')}
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://app.example.com/..."
                    />
                    {errors.androidAppLink && (
                      <p className="mt-1 text-sm text-red-600">{errors.androidAppLink.message}</p>
                    )}
                  </div>
                </div>

                <h4 className="text-md font-medium text-gray-900">Social Media Preview (Open Graph)</h4>
                <p className="text-sm text-gray-500 -mt-2">
                  Customize how your link appears when shared on Facebook, Twitter, LinkedIn, etc.
                </p>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      OG Title
                    </label>
                    <input
                      {...register('ogTitle')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Leave empty to use link title"
                    />
                    {errors.ogTitle && (
                      <p className="mt-1 text-sm text-red-600">{errors.ogTitle.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      OG Type
                    </label>
                    <select
                      {...register('ogType')}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="website">Website</option>
                      <option value="article">Article</option>
                      <option value="product">Product</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    OG Description
                  </label>
                  <textarea
                    {...register('ogDescription')}
                    rows={2}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Leave empty to use link description"
                  />
                  {errors.ogDescription && (
                    <p className="mt-1 text-sm text-red-600">{errors.ogDescription.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    OG Image URL
                  </label>
                  <input
                    {...register('ogImageUrl')}
                    type="url"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="https://example.com/image.png"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended: 1200x630px for best results on all platforms
                  </p>
                  {errors.ogImageUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.ogImageUrl.message}</p>
                  )}
                </div>

                <h4 className="text-md font-medium text-gray-900">UTM Parameters</h4>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      UTM Source
                    </label>
                    <input
                      {...register('utmSource')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="facebook, google, newsletter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      UTM Medium
                    </label>
                    <input
                      {...register('utmMedium')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="social, email, cpc"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      UTM Campaign
                    </label>
                    <input
                      {...register('utmCampaign')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="summer_sale, product_launch"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      UTM Term
                    </label>
                    <input
                      {...register('utmTerm')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="keyword terms"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    UTM Content
                  </label>
                  <input
                    {...register('utmContent')}
                    type="text"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="banner_ad, text_link"
                  />
                </div>

                <h4 className="text-md font-medium text-gray-900 pt-6">Attribution Window</h4>
                <p className="text-sm text-gray-500 -mt-2">
                  Configure how long after a click an app install can be attributed to this link
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Attribution Window (hours)
                  </label>
                  <select
                    {...register('attributionWindowHours', { valueAsNumber: true })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value={1}>1 hour</option>
                    <option value={24}>24 hours (1 day)</option>
                    <option value={72}>72 hours (3 days)</option>
                    <option value={168}>168 hours (7 days) - Default</option>
                    <option value={336}>336 hours (14 days)</option>
                    <option value={720}>720 hours (30 days)</option>
                    <option value={2160}>2160 hours (90 days)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Clicks older than this window won't be matched to installs. Default: 7 days
                  </p>
                  {errors.attributionWindowHours && (
                    <p className="mt-1 text-sm text-red-600">{errors.attributionWindowHours.message}</p>
                  )}
                </div>

                <h4 className="text-md font-medium text-gray-900 pt-6">Targeting Rules</h4>
                <p className="text-sm text-gray-500">
                  Optional: Restrict this link to specific countries, devices, or languages. If no rules are set, the link will work for everyone.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Countries
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRY_OPTIONS.map(country => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => toggleCountry(country.code)}
                        className={`px-3 py-1 text-sm rounded-md border ${
                          selectedCountries.includes(country.code)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {country.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Devices
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleDevice('ios')}
                      className={`px-4 py-2 text-sm rounded-md border ${
                        selectedDevices.includes('ios')
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      iOS
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDevice('android')}
                      className={`px-4 py-2 text-sm rounded-md border ${
                        selectedDevices.includes('android')
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Android
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDevice('web')}
                      className={`px-4 py-2 text-sm rounded-md border ${
                        selectedDevices.includes('web')
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Web
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Languages
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(language => (
                      <button
                        key={language.code}
                        type="button"
                        onClick={() => toggleLanguage(language.code)}
                        className={`px-3 py-1 text-sm rounded-md border ${
                          selectedLanguages.includes(language.code)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {language.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
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

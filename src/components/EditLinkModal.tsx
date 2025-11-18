import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { Link, UpdateLinkRequest } from '../types';

const updateLinkSchema = z.object({
  original_url: z.string().url('Please enter a valid URL').optional(),
  title: z.string().max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  ios_url: z.string().url('Please enter a valid iOS URL').optional().or(z.literal('')),
  android_url: z.string().url('Please enter a valid Android URL').optional().or(z.literal('')),
  web_fallback_url: z.string().url('Please enter a valid fallback URL').optional().or(z.literal('')),
  is_active: z.boolean().optional(),
  og_title: z.string().max(255, 'OG title must be less than 255 characters').optional(),
  og_description: z.string().max(1000, 'OG description must be less than 1000 characters').optional(),
  og_image_url: z.string().url('Please enter a valid image URL').optional().or(z.literal('')),
  og_type: z.string().max(50, 'OG type too long').optional(),
  attribution_window_hours: z.number()
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

type UpdateLinkFormData = z.infer<typeof updateLinkSchema>;

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateLinkRequest) => Promise<void>;
  link: Link | null;
  isLoading?: boolean;
}

export function EditLinkModal({ isOpen, onClose, onSubmit, link, isLoading }: EditLinkModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<('ios' | 'android' | 'web')[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UpdateLinkFormData>({
    resolver: zodResolver(updateLinkSchema),
  });

  useEffect(() => {
    if (link && isOpen) {
      setValue('original_url', link.original_url);
      setValue('title', link.title || '');
      setValue('description', link.description || '');
      setValue('ios_url', link.ios_url || '');
      setValue('android_url', link.android_url || '');
      setValue('web_fallback_url', link.web_fallback_url || '');
      setValue('is_active', link.is_active);
      setValue('utmSource', link.utmParameters?.source || '');
      setValue('utmMedium', link.utmParameters?.medium || '');
      setValue('utmCampaign', link.utmParameters?.campaign || '');
      setValue('utmTerm', link.utmParameters?.term || '');
      setValue('utmContent', link.utmParameters?.content || '');

      // Set targeting rules state
      setSelectedCountries(link.targeting_rules?.countries || []);
      setSelectedDevices(link.targeting_rules?.devices || []);
      setSelectedLanguages(link.targeting_rules?.languages || []);
    }
  }, [link, isOpen, setValue]);

  const handleFormSubmit = async (data: UpdateLinkFormData) => {
    const linkData: UpdateLinkRequest = {
      originalUrl: data.original_url,
      title: data.title,
      description: data.description,
      iosUrl: data.ios_url || undefined,
      androidUrl: data.android_url || undefined,
      webFallbackUrl: data.web_fallback_url || undefined,
      isActive: data.is_active,
      ogTitle: data.og_title,
      ogDescription: data.og_description,
      ogImageUrl: data.og_image_url || undefined,
      ogType: data.og_type,
      attributionWindowHours: data.attribution_window_hours,
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

  if (!isOpen || !link) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">Edit Link</h3>
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
                Destination URL
              </label>
              <input
                {...register('original_url')}
                type="url"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://example.com"
              />
              {errors.original_url && (
                <p className="mt-1 text-sm text-red-600">{errors.original_url.message}</p>
              )}
            </div>

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
                <label className="flex items-center">
                  <input
                    {...register('is_active')}
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Active</span>
                </label>
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
                      iOS App URL
                    </label>
                    <input
                      {...register('ios_url')}
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://apps.apple.com/..."
                    />
                    {errors.ios_url && (
                      <p className="mt-1 text-sm text-red-600">{errors.ios_url.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Android App URL
                    </label>
                    <input
                      {...register('android_url')}
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://play.google.com/..."
                    />
                    {errors.android_url && (
                      <p className="mt-1 text-sm text-red-600">{errors.android_url.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Web Fallback URL
                  </label>
                  <input
                    {...register('web_fallback_url')}
                    type="url"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="https://example.com/fallback"
                  />
                  {errors.web_fallback_url && (
                    <p className="mt-1 text-sm text-red-600">{errors.web_fallback_url.message}</p>
                  )}
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
                      {...register('og_title')}
                      type="text"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Leave empty to use link title"
                    />
                    {errors.og_title && (
                      <p className="mt-1 text-sm text-red-600">{errors.og_title.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      OG Type
                    </label>
                    <select
                      {...register('og_type')}
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
                    {...register('og_description')}
                    rows={2}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Leave empty to use link description"
                  />
                  {errors.og_description && (
                    <p className="mt-1 text-sm text-red-600">{errors.og_description.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    OG Image URL
                  </label>
                  <input
                    {...register('og_image_url')}
                    type="url"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="https://example.com/image.png"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended: 1200x630px for best results on all platforms
                  </p>
                  {errors.og_image_url && (
                    <p className="mt-1 text-sm text-red-600">{errors.og_image_url.message}</p>
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
                    {...register('attribution_window_hours', { valueAsNumber: true })}
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
                  {errors.attribution_window_hours && (
                    <p className="mt-1 text-sm text-red-600">{errors.attribution_window_hours.message}</p>
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
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

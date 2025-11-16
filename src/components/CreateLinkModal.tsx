import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { CreateLinkRequest } from '../types';

const createLinkSchema = z.object({
  originalUrl: z.string().min(1, 'URL is required').url('Please enter a valid URL'),
  title: z.string().max(255, 'Title must be less than 255 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  iosUrl: z.string().url('Please enter a valid iOS URL').optional().or(z.literal('')),
  androidUrl: z.string().url('Please enter a valid Android URL').optional().or(z.literal('')),
  webFallbackUrl: z.string().url('Please enter a valid fallback URL').optional().or(z.literal('')),
  customCode: z.string()
    .regex(/^[a-zA-Z0-9_-]*$/, 'Only letters, numbers, hyphens, and underscores allowed')
    .min(3, 'Custom code must be at least 3 characters')
    .max(50, 'Custom code must be less than 50 characters')
    .optional()
    .or(z.literal('')),
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

export function CreateLinkModal({ isOpen, onClose, onSubmit, isLoading }: CreateLinkModalProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedDevices, setSelectedDevices] = useState<('ios' | 'android' | 'web')[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
  });

  const handleFormSubmit = async (data: CreateLinkFormData) => {
    const linkData: CreateLinkRequest = {
      originalUrl: data.originalUrl,
      title: data.title,
      description: data.description,
      iosUrl: data.iosUrl || undefined,
      androidUrl: data.androidUrl || undefined,
      webFallbackUrl: data.webFallbackUrl || undefined,
      customCode: data.customCode,
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
                      iOS App URL
                    </label>
                    <input
                      {...register('iosUrl')}
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://apps.apple.com/..."
                    />
                    {errors.iosUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.iosUrl.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Android App URL
                    </label>
                    <input
                      {...register('androidUrl')}
                      type="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://play.google.com/..."
                    />
                    {errors.androidUrl && (
                      <p className="mt-1 text-sm text-red-600">{errors.androidUrl.message}</p>
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

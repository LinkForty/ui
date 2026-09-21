import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, AlertCircle } from 'lucide-react';
import { AppConfig } from '../types';

const appConfigSchema = z.object({
  appScheme: z.string()
    .regex(/^[a-z][a-z0-9+.-]*$/, 'Invalid URI scheme format (must start with lowercase letter, contain only lowercase letters, numbers, +, ., or -)')
    .max(255, 'App scheme too long')
    .optional()
    .or(z.literal('')),
  iosTeamId: z.string().max(255).optional().or(z.literal('')),
  iosBundleId: z.string().max(255).optional().or(z.literal('')),
  androidPackageName: z.string().max(255).optional().or(z.literal('')),
  androidSha256Fingerprints: z.string().max(2000).optional().or(z.literal('')),
  iosUniversalLinkDomain: z.string().max(255).optional().or(z.literal('')),
  androidAppLinkDomain: z.string().max(255).optional().or(z.literal('')),
  customSchemePattern: z.string().max(255).optional().or(z.literal('')),
  iosAppStoreUrl: z.string().url('Must be a valid URL').max(512).optional().or(z.literal('')),
  androidAppStoreUrl: z.string().url('Must be a valid URL').max(512).optional().or(z.literal('')),
  webFallbackUrl: z.string().url('Must be a valid URL').max(512).optional().or(z.literal('')),
  ephemeralDeepLinks: z.boolean().optional(),
});

type AppConfigForm = z.infer<typeof appConfigSchema>;

interface OrganizationAppConfigProps {
  appConfig?: AppConfig;
  onSave: (appConfig: AppConfig) => Promise<void>;
  isLoading?: boolean;
  /** Render without the surrounding card + header (e.g. when the host page
   *  already provides a title). */
  bare?: boolean;
}

export function OrganizationAppConfig({ appConfig, onSave, isLoading = false, bare = false }: OrganizationAppConfigProps) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AppConfigForm>({
    resolver: zodResolver(appConfigSchema),
    values: {
      appScheme: appConfig?.appScheme || '',
      iosTeamId: appConfig?.iosTeamId || '',
      iosBundleId: appConfig?.iosBundleId || '',
      androidPackageName: appConfig?.androidPackageName || '',
      androidSha256Fingerprints: appConfig?.androidSha256Fingerprints?.join('\n') || '',
      iosUniversalLinkDomain: appConfig?.iosUniversalLinkDomain || '',
      androidAppLinkDomain: appConfig?.androidAppLinkDomain || '',
      customSchemePattern: appConfig?.customSchemePattern || '',
      iosAppStoreUrl: appConfig?.iosAppStoreUrl || '',
      androidAppStoreUrl: appConfig?.androidAppStoreUrl || '',
      webFallbackUrl: appConfig?.webFallbackUrl || '',
      ephemeralDeepLinks: appConfig?.ephemeralDeepLinks || false,
    },
  });

  const onSubmit = async (data: AppConfigForm) => {
    setIsSaving(true);
    try {
      // Convert empty strings to undefined
      const cleanedData: AppConfig = {
        appScheme: data.appScheme || undefined,
        iosTeamId: data.iosTeamId || undefined,
        iosBundleId: data.iosBundleId || undefined,
        androidPackageName: data.androidPackageName || undefined,
        androidSha256Fingerprints: data.androidSha256Fingerprints
          ? data.androidSha256Fingerprints.split('\n').map(s => s.trim()).filter(Boolean)
          : undefined,
        iosUniversalLinkDomain: data.iosUniversalLinkDomain || undefined,
        androidAppLinkDomain: data.androidAppLinkDomain || undefined,
        customSchemePattern: data.customSchemePattern || undefined,
        iosAppStoreUrl: data.iosAppStoreUrl || undefined,
        androidAppStoreUrl: data.androidAppStoreUrl || undefined,
        webFallbackUrl: data.webFallbackUrl || undefined,
        ephemeralDeepLinks: data.ephemeralDeepLinks || undefined,
      };
      await onSave(cleanedData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={bare ? '' : 'surface-card shadow-sm rounded-lg border'}>
      {!bare && (
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">App Configuration</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Configure default app settings for deep linking. These values will auto-fill when creating new links.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={bare ? '' : 'px-6 py-5'}>
        <div className="space-y-6">
          {/* App Scheme */}
          <div>
            <label htmlFor="appScheme" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              App URI Scheme
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Your app's custom URL scheme (e.g., "myapp" or "com.company.app")
            </p>
            <input
              type="text"
              id="appScheme"
              {...register('appScheme')}
              placeholder="myapp"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.appScheme && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.appScheme.message}</span>
              </div>
            )}
          </div>

          {/* iOS Team ID */}
          <div>
            <label htmlFor="iosTeamId" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Apple Developer Team ID
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Your Apple Developer Team ID (e.g., "ABCDE12345"). Required for Universal Links (AASA file).
              Found in the <a href="https://developer.apple.com/account" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Apple Developer Portal</a> under Membership details.
            </p>
            <input
              type="text"
              id="iosTeamId"
              {...register('iosTeamId')}
              placeholder="ABCDE12345"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.iosTeamId && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.iosTeamId.message}</span>
              </div>
            )}
          </div>

          {/* iOS Bundle ID */}
          <div>
            <label htmlFor="iosBundleId" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              iOS Bundle ID
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Your iOS app's bundle identifier (e.g., "com.company.app")
            </p>
            <input
              type="text"
              id="iosBundleId"
              {...register('iosBundleId')}
              placeholder="com.company.app"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.iosBundleId && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.iosBundleId.message}</span>
              </div>
            )}
          </div>

          {/* Android Package Name */}
          <div>
            <label htmlFor="androidPackageName" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Android Package Name
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Your Android app's package name (e.g., "com.company.app")
            </p>
            <input
              type="text"
              id="androidPackageName"
              {...register('androidPackageName')}
              placeholder="com.company.app"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.androidPackageName && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.androidPackageName.message}</span>
              </div>
            )}
          </div>

          {/* Android SHA-256 Fingerprints */}
          <div>
            <label htmlFor="androidSha256Fingerprints" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Android SHA-256 Certificate Fingerprints
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              SHA-256 fingerprints of your Android app signing certificate. One per line. Required for Android App Links (assetlinks.json).
              Found in the <a href="https://play.google.com/console" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Google Play Console</a> under Test and Release &rarr; App Integrity &rarr; Play app signing &rarr; Settings.
            </p>
            <textarea
              id="androidSha256Fingerprints"
              {...register('androidSha256Fingerprints')}
              placeholder="14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B2:3F:CF:44:E5"
              rows={3}
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
            />
            {errors.androidSha256Fingerprints && (
              <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.androidSha256Fingerprints.message}</span>
              </div>
            )}
          </div>

          {/* iOS Universal Link Domain */}
          <div>
            <label htmlFor="iosUniversalLinkDomain" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              iOS Universal Link Domain
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Domain for iOS Universal Links (e.g., "app.company.com")
            </p>
            <input
              type="text"
              id="iosUniversalLinkDomain"
              {...register('iosUniversalLinkDomain')}
              placeholder="app.company.com"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.iosUniversalLinkDomain && (
              <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.iosUniversalLinkDomain.message}</span>
              </div>
            )}
          </div>

          {/* Android App Link Domain */}
          <div>
            <label htmlFor="androidAppLinkDomain" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Android App Link Domain
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Domain for Android App Links (e.g., "app.company.com")
            </p>
            <input
              type="text"
              id="androidAppLinkDomain"
              {...register('androidAppLinkDomain')}
              placeholder="app.company.com"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.androidAppLinkDomain && (
              <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.androidAppLinkDomain.message}</span>
              </div>
            )}
          </div>

          {/* Default Platform URLs Section */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Default Platform URLs</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              These URLs are used as the final fallback when a link or template doesn't specify platform-specific URLs.
            </p>
          </div>

          {/* iOS App Store URL */}
          <div>
            <label htmlFor="iosAppStoreUrl" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              iOS App Store URL
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Default App Store link for your iOS app (e.g., "https://apps.apple.com/app/id123456789")
            </p>
            <input
              type="url"
              id="iosAppStoreUrl"
              {...register('iosAppStoreUrl')}
              placeholder="https://apps.apple.com/app/id123456789"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.iosAppStoreUrl && (
              <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.iosAppStoreUrl.message}</span>
              </div>
            )}
          </div>

          {/* Android Play Store URL */}
          <div>
            <label htmlFor="androidAppStoreUrl" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Android Play Store URL
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Default Play Store link for your Android app (e.g., "https://play.google.com/store/apps/details?id=com.company.app")
            </p>
            <input
              type="url"
              id="androidAppStoreUrl"
              {...register('androidAppStoreUrl')}
              placeholder="https://play.google.com/store/apps/details?id=com.company.app"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.androidAppStoreUrl && (
              <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.androidAppStoreUrl.message}</span>
              </div>
            )}
          </div>

          {/* Web Fallback URL */}
          <div>
            <label htmlFor="webFallbackUrl" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Web Fallback URL
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Default URL for desktop/web users who don't have the mobile app (e.g., your website)
            </p>
            <input
              type="url"
              id="webFallbackUrl"
              {...register('webFallbackUrl')}
              placeholder="https://www.company.com"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.webFallbackUrl && (
              <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.webFallbackUrl.message}</span>
              </div>
            )}
          </div>

          {/* Custom Scheme Pattern for Push Notifications */}
          <div>
            <label htmlFor="customSchemePattern" className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
              Custom Scheme Pattern (Push Notifications)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              URL scheme pattern for push notifications (e.g., "myapp://"). Used as default when creating links for push notifications.
            </p>
            <input
              type="text"
              id="customSchemePattern"
              {...register('customSchemePattern')}
              placeholder="myapp://"
              className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {errors.customSchemePattern && (
              <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.customSchemePattern.message}</span>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Advanced</h4>
          </div>

          {/* Ephemeral Deep Links */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="ephemeralDeepLinks"
              {...register('ephemeralDeepLinks')}
              className="mt-1 h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="ephemeralDeepLinks" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Ephemeral Deep Links
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                When enabled, deep link parameters are automatically deleted from the server after delivery. Used for zero-knowledge encrypted messaging where message data should not persist.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={!isDirty || isSaving || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}

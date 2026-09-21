import { useEffect, useState, type ReactNode } from 'react';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { Link } from '../types';

const COUNTRY_OPTIONS = [
  { code: 'US', name: 'United States' }, { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' }, { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' }, { code: 'FR', name: 'France' },
  { code: 'ES', name: 'Spain' }, { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' }, { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' }, { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

const LANGUAGE_OPTIONS = [
  { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' }, { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' },
];

export interface DiscoveredLink extends Link {
  creator_email?: string;
  template_name?: string;
}

/**
 * One link's Launchpad funnel for a period — the shape returned by the host's
 * `GET /api/launchpad/links/:id/stats`. Counts are whole numbers; `days` is the
 * window actually applied (the host may clamp the requested one to the plan).
 */
export interface LaunchpadLinkStats {
  days: number;
  /** Page views, all devices. */
  views: number;
  /** "Download on the App Store" taps. */
  ctaIos: number;
  /** "Get it on Google Play" taps. */
  ctaAndroid: number;
  /** "Open in app" taps. */
  ctaOpen: number;
  /** "Continue on the web" taps. */
  ctaWeb: number;
  /** Page views by the visitor's device. */
  byDevice: { web: number; ios: number; android: number };
  /** Desktop-class clicks on the link in the same window — the page's audience. */
  desktopClicks: number;
}

export interface LinkDetailProps {
  /** The link to render. */
  link: DiscoveredLink;
  /** Short URL origin, e.g. `https://go.linkforty.com` or a custom domain URL. */
  baseShortUrl: string;
  /** API origin *without* the `/api` suffix — the component appends `/api/links/:id/qr` itself. */
  apiBaseUrl: string;
  /**
   * Navigate callback — host wires this to react-router's navigate() so
   * packages/ui stays framework-agnostic. When omitted, the Template/Project
   * "view" links are rendered as plain anchors with full page loads.
   */
  onNavigate?: (path: string) => void;
  /**
   * Optional renderer for UTM values — lets the host overlay friendly names
   * from its UTM library. This package stays presentational, so the
   * host passes e.g. `(param, value) => <UtmLabel .../>`. When omitted, the
   * raw value is shown.
   */
  renderUtmValue?: (
    param: 'source' | 'medium' | 'campaign' | 'term' | 'content',
    value: string,
  ) => ReactNode;
  /**
   * Loads the link's Launchpad funnel for a period. The stats endpoint needs
   * the host's bearer token, so the host supplies the fetcher; when omitted,
   * no Launchpad section is rendered. The section also stays hidden for a
   * link that has never served the page unless it is set to always show it.
   */
  fetchLaunchpadStats?: (linkId: string, days: number) => Promise<LaunchpadLinkStats>;
}

// Per-link assigned domain wins over the org-default baseShortUrl
function effectiveBaseShortUrl(link: DiscoveredLink, baseShortUrl: string) {
  return link.domain ? `https://${link.domain}` : baseShortUrl;
}

function buildShortUrl(link: DiscoveredLink, baseShortUrl: string) {
  const base = effectiveBaseShortUrl(link, baseShortUrl);
  return link.template_slug
    ? `${base}/${link.template_slug}/${link.short_code}`
    : `${base}/${link.short_code}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-2 p-1 rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="surface-table-header border-b border-gray-200 dark:border-gray-700 px-6 py-3 font-semibold text-sm text-gray-700 dark:text-gray-300">
      {title}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start px-6 py-3 gap-1 sm:gap-4">
      <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide sm:w-40 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-gray-800 dark:text-gray-200 flex items-center flex-wrap gap-1">
        {children}
      </span>
    </div>
  );
}

function NotConfigured() {
  return (
    <div className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500 italic">
      Not configured
    </div>
  );
}

const QR_SIZES = [
  { value: 256, label: 'Small (256px)' },
  { value: 512, label: 'Medium (512px)' },
  { value: 1024, label: 'Large (1024px)' },
  { value: 2048, label: 'XL (2048px)' },
] as const;
type QRSize = typeof QR_SIZES[number]['value'];

const LAUNCHPAD_PERIODS = [7, 30, 90] as const;
type LaunchpadPeriod = (typeof LAUNCHPAD_PERIODS)[number];

/** Whole-number percent of `part` in `whole`; null when there is no `whole` to divide by. */
function wholePercent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

function StatTile({ label, value, caption }: { label: string; value: number; caption?: string }) {
  return (
    <div className="surface-table-header rounded-lg p-3" data-testid={`lp-stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-gray-900 dark:text-gray-100">{value.toLocaleString()}</div>
      {caption && <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{caption}</div>}
    </div>
  );
}

/**
 * Launchpad funnel — desktop clicks → page views → store / app taps for the
 * selected period. Rendered only once the link has something to show: a view in
 * the default window, or a `launchpad_mode` of `on` (an empty state then tells
 * the user the page is live but unvisited). Period changes never hide it again.
 */
function LaunchpadSection({
  link,
  fetchStats,
}: {
  link: DiscoveredLink;
  fetchStats: (linkId: string, days: number) => Promise<LaunchpadLinkStats>;
}) {
  const [days, setDays] = useState<LaunchpadPeriod>(30);
  const [stats, setStats] = useState<LaunchpadLinkStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hadViews, setHadViews] = useState(false);
  const alwaysOn = link.launchpad_mode === 'on';

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetchStats(link.id, days)
      .then((next) => {
        if (cancelled) return;
        setStats(next);
        if (next.views > 0) setHadViews(true);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load Launchpad stats');
      });
    return () => {
      cancelled = true;
    };
  }, [fetchStats, link.id, days]);

  if (!alwaysOn && !hadViews) return null;

  const serveRate = stats ? wholePercent(stats.byDevice.web, stats.desktopClicks) : null;
  const storeTaps = stats ? stats.ctaIos + stats.ctaAndroid : 0;

  return (
    <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden" data-testid="launchpad-funnel">
      <div className="surface-table-header flex items-center justify-between gap-3 px-6 py-2 border-b border-gray-200 dark:border-gray-700">
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">Launchpad</span>
        <label className="flex items-center gap-2 text-xs font-normal text-gray-500 dark:text-gray-400">
          <span>Period</span>
          <select
            id="launchpad-stats-period"
            value={days}
            onChange={(e) => setDays(Number(e.target.value) as LaunchpadPeriod)}
            className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 focus:ring-brand focus:border-brand"
          >
            {LAUNCHPAD_PERIODS.map((d) => (
              <option key={d} value={d}>Last {d} days</option>
            ))}
          </select>
        </label>
      </div>
      <div className="p-6">
        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : !stats ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">Loading…</p>
        ) : stats.views === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No Launchpad views in the last {stats.days} days.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Desktop clicks" value={stats.desktopClicks} />
              <StatTile
                label="Page views"
                value={stats.views}
                caption={serveRate === null ? undefined : `${serveRate}% of desktop clicks saw the page`}
              />
              <StatTile
                label="Store taps"
                value={storeTaps}
                caption={`iOS ${stats.ctaIos.toLocaleString()} · Android ${stats.ctaAndroid.toLocaleString()}`}
              />
              <StatTile label="Open in app" value={stats.ctaOpen} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Views by device: desktop {stats.byDevice.web.toLocaleString()} · iOS {stats.byDevice.ios.toLocaleString()} · Android {stats.byDevice.android.toLocaleString()}.
              {' '}Continue on the web: {stats.ctaWeb.toLocaleString()}.
              {stats.days !== days ? ` Limited to your plan's ${stats.days}-day window.` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function QRSection({
  link,
  baseShortUrl,
  apiBaseUrl,
}: {
  link: DiscoveredLink;
  baseShortUrl: string;
  apiBaseUrl: string;
}) {
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [size, setSize] = useState<QRSize>(512);
  const [color, setColor] = useState('#000000');
  const [bgcolor, setBgcolor] = useState('#ffffff');

  const shortUrl = buildShortUrl(link, baseShortUrl);

  const qrUrl = `${apiBaseUrl}/api/links/${link.id}/qr?format=${format}&size=${size}&color=${encodeURIComponent(color)}&bgcolor=${encodeURIComponent(bgcolor)}&url=${encodeURIComponent(shortUrl)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrUrl);
      if (!response.ok) throw new Error('Failed to fetch QR code');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `linkforty-qr-${link.short_code}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('QR download failed:', err);
    }
  };

  return (
    <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <SectionHeader title="QR Code" />
      <div className="p-6 space-y-4">
        {/* Preview */}
        <div className="surface-table-header flex justify-center items-center p-6 rounded-lg">
          <img
            src={qrUrl}
            alt={`QR code for ${link.short_code}`}
            className="max-w-full h-auto"
            style={{ maxHeight: '280px' }}
          />
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Format */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Format
            </label>
            <div className="flex gap-4">
              {(['png', 'svg'] as const).map((f) => (
                <label key={f} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    className="h-4 w-4 text-brand border-gray-300 dark:border-gray-700 focus:ring-brand"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200 uppercase">{f}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Size
            </label>
            <select
              value={size}
              onChange={(e) => setSize(Number(e.target.value) as QRSize)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              {QR_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Foreground color */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Foreground
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="#000000"
              />
            </div>
          </div>

          {/* Background color */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bgcolor}
                onChange={(e) => setBgcolor(e.target.value)}
                className="h-9 w-14 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
              />
              <input
                type="text"
                value={bgcolor}
                onChange={(e) => setBgcolor(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Download */}
        <div className="flex justify-end">
          <button
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-5 py-1.5 text-sm font-semibold text-white btn-primary rounded-lg"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export function LinkDetail({ link, baseShortUrl, apiBaseUrl, onNavigate, renderUtmValue, fetchLaunchpadStats }: LinkDetailProps) {
  const shortUrl = buildShortUrl(link, baseShortUrl);

  const utm = link.utmParameters;
  const hasUtm = utm && Object.values(utm).some(Boolean);

  const hasDeepLink =
    link.app_scheme ||
    link.deep_link_path ||
    link.ios_universal_link ||
    link.android_app_link ||
    link.custom_scheme_url ||
    (link.deep_link_parameters && Object.keys(link.deep_link_parameters).length > 0);

  const hasFallbacks =
    link.ios_app_store_url ||
    link.android_app_store_url ||
    link.web_fallback_url;

  const hasTargeting = !!(link.targeting_rules && (
    (link.targeting_rules.countries?.length ?? 0) > 0 ||
    (link.targeting_rules.devices?.length ?? 0) > 0 ||
    (link.targeting_rules.languages?.length ?? 0) > 0
  ));

  const renderNavLink = (path: string, label: string) => {
    if (onNavigate) {
      return (
        <button
          onClick={() => onNavigate(path)}
          className="text-brand hover:text-brand-dark text-xs font-medium"
        >
          {label}
        </button>
      );
    }
    return (
      <a href={path} className="text-brand hover:text-brand-dark text-xs font-medium">
        {label}
      </a>
    );
  };

  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <SectionHeader title="Basic Information" />
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <InfoRow label="Short Code ID">
            <span className="font-mono text-xs bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
              {link.short_code}
            </span>
          </InfoRow>
          <InfoRow label="Short URL">
            <span className="font-mono text-xs break-all">{shortUrl}</span>
            <CopyButton value={shortUrl} />
          </InfoRow>
          {link.title && (
            <InfoRow label="Title">{link.title}</InfoRow>
          )}
          {link.description && (
            <InfoRow label="Description">{link.description}</InfoRow>
          )}
          <InfoRow label="Status">
            {link.is_active ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                Inactive
              </span>
            )}
          </InfoRow>
          <InfoRow label="Clicks">{link.click_count ?? 0}</InfoRow>
          <InfoRow label="Created">{formatDate(link.created_at)}</InfoRow>
          <InfoRow label="Expires">
            {link.expires_at ? formatDate(link.expires_at) : 'Never'}
          </InfoRow>
          {link.creator_email && (
            <InfoRow label="Creator Email">{link.creator_email}</InfoRow>
          )}
        </div>
      </div>

      {/* Launchpad funnel — only for links that serve the page */}
      {fetchLaunchpadStats && <LaunchpadSection link={link} fetchStats={fetchLaunchpadStats} />}

      {/* Campaign Parameters */}
      <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <SectionHeader title="Campaign Parameters" />
        {hasUtm ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {utm?.source && <InfoRow label="UTM Source">{renderUtmValue ? renderUtmValue('source', utm.source) : utm.source}</InfoRow>}
            {utm?.medium && <InfoRow label="UTM Medium">{renderUtmValue ? renderUtmValue('medium', utm.medium) : utm.medium}</InfoRow>}
            {utm?.campaign && <InfoRow label="UTM Campaign">{renderUtmValue ? renderUtmValue('campaign', utm.campaign) : utm.campaign}</InfoRow>}
            {utm?.term && <InfoRow label="UTM Term">{renderUtmValue ? renderUtmValue('term', utm.term) : utm.term}</InfoRow>}
            {utm?.content && <InfoRow label="UTM Content">{renderUtmValue ? renderUtmValue('content', utm.content) : utm.content}</InfoRow>}
          </div>
        ) : (
          <NotConfigured />
        )}
      </div>

      {/* Template Info */}
      {link.template_id && (
        <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <SectionHeader title="Template Info" />
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {link.template_name && (
              <InfoRow label="Template Name">{link.template_name}</InfoRow>
            )}
            {link.template_slug && (
              <InfoRow label="Template Slug">
                <span className="font-mono text-xs bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">
                  {link.template_slug}
                </span>
              </InfoRow>
            )}
            <InfoRow label="">
              {renderNavLink('/templates', 'View template →')}
            </InfoRow>
          </div>
        </div>
      )}

      {/* Project Info */}
      {link.project_id && (
        <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <SectionHeader title="Project Info" />
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {link.project_name && (
              <InfoRow label="Project Name">{link.project_name}</InfoRow>
            )}
            <InfoRow label="">
              {renderNavLink(`/projects/${link.project_id}`, 'View project →')}
            </InfoRow>
          </div>
        </div>
      )}

      {/* QR Code */}
      <QRSection link={link} baseShortUrl={baseShortUrl} apiBaseUrl={apiBaseUrl} />

      {/* Deep Link Info */}
      <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <SectionHeader title="Deep Link Info" />
        {hasDeepLink ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {link.app_scheme && <InfoRow label="App Scheme"><span className="font-mono text-xs">{link.app_scheme}</span></InfoRow>}
            {link.deep_link_path && <InfoRow label="Deep Link Path"><span className="font-mono text-xs">{link.deep_link_path}</span></InfoRow>}
            {link.ios_universal_link && <InfoRow label="iOS Universal Link"><span className="font-mono text-xs break-all">{link.ios_universal_link}</span></InfoRow>}
            {link.android_app_link && <InfoRow label="Android App Link"><span className="font-mono text-xs break-all">{link.android_app_link}</span></InfoRow>}
            {link.custom_scheme_url && <InfoRow label="Custom Scheme URL"><span className="font-mono text-xs break-all">{link.custom_scheme_url}</span></InfoRow>}
            {link.deep_link_parameters && Object.keys(link.deep_link_parameters).length > 0 && (
              <div className="px-6 py-3">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide block mb-2">
                  Deep Link Parameters
                </span>
                <div className="relative">
                  <pre className="text-xs font-mono bg-black/5 dark:bg-white/10 rounded p-3 overflow-x-auto max-h-48 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">
                    {JSON.stringify(link.deep_link_parameters, null, 2)}
                  </pre>
                  <div className="absolute top-2 right-2">
                    <CopyButton value={JSON.stringify(link.deep_link_parameters, null, 2)} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <NotConfigured />
        )}
      </div>

      {/* Fallback Paths */}
      <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <SectionHeader title="Fallback Paths" />
        {hasFallbacks ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {link.ios_app_store_url && (
              <InfoRow label="iOS">
                <a
                  href={link.ios_app_store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-brand-dark text-xs flex items-center gap-1 break-all"
                >
                  {link.ios_app_store_url}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </InfoRow>
            )}
            {link.android_app_store_url && (
              <InfoRow label="Android">
                <a
                  href={link.android_app_store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-brand-dark text-xs flex items-center gap-1 break-all"
                >
                  {link.android_app_store_url}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </InfoRow>
            )}
            {link.web_fallback_url && (
              <InfoRow label="Web">
                <a
                  href={link.web_fallback_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-brand-dark text-xs flex items-center gap-1 break-all"
                >
                  {link.web_fallback_url}
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </a>
              </InfoRow>
            )}
          </div>
        ) : (
          <NotConfigured />
        )}
      </div>

      {/* Targeting Rules */}
      <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <SectionHeader title="Targeting Rules" />
        {hasTargeting ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <InfoRow label="Target Countries">
              {(link.targeting_rules!.countries?.length ?? 0) > 0 ? (
                <span className="text-xs text-gray-800 dark:text-gray-200">
                  {link.targeting_rules!.countries!.map((code) =>
                    COUNTRY_OPTIONS.find((c) => c.code === code)?.name ?? code
                  ).join(', ')}
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">No restrictions</span>
              )}
            </InfoRow>
            <InfoRow label="Target Devices">
              {(link.targeting_rules!.devices?.length ?? 0) > 0 ? (
                <span className="flex flex-wrap gap-1">
                  {link.targeting_rules!.devices!.map((d) => (
                    <span
                      key={d}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        d === 'ios'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : d === 'android'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-black/5 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">No restrictions</span>
              )}
            </InfoRow>
            <InfoRow label="Target Languages">
              {(link.targeting_rules!.languages?.length ?? 0) > 0 ? (
                <span className="text-xs text-gray-800 dark:text-gray-200">
                  {link.targeting_rules!.languages!.map((code) =>
                    LANGUAGE_OPTIONS.find((l) => l.code === code)?.name ?? code
                  ).join(', ')}
                </span>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500">No restrictions</span>
              )}
            </InfoRow>
          </div>
        ) : (
          <NotConfigured />
        )}
      </div>
    </div>
  );
}

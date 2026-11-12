import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Copy, Check, Download, ExternalLink } from 'lucide-react';
import { Link, type QrDesign } from '../types';
import { shortUrlForms } from '../utils/shortUrl';

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
  /**
   * Hostnames that belong to the link's workspace. On these, a templated link is
   * shown and encoded as the shorter `/{code}`, with the `/{templateSlug}/{code}`
   * form listed under it. Omitted, the template form is always used.
   */
  ownHosts?: string[];
  /**
   * The workspace's QR style, where the QR panel starts for a link with no
   * design of its own and what "Reset to workspace default" goes back to.
   * Omitted, that is a plain code.
   */
  qrDefaults?: QrDesign;
  /** The workspace's brand logo. When set, the QR panel offers it for the center. */
  brandLogoUrl?: string;
  /**
   * Saves the QR design on the link; `null` clears it so the workspace style
   * applies. Omitted (a viewer, say), the panel styles downloads only.
   */
  onSaveQrDesign?: (design: QrDesign | null) => Promise<void>;
  /**
   * Uploads a PNG or JPEG as this link's QR logo and returns its key. Omitted,
   * the panel offers no upload.
   */
  onUploadQrLogo?: (file: File) => Promise<{ logoKey: string; previewUrl?: string }>;
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

/**
 * How long the colors must stay unchanged before the preview asks for a new image.
 * A color picker reports every step of a drag, and each new color is a new image.
 */
const QR_PREVIEW_DELAY_MS = 250;

/** `value`, once it has stayed the same for `delayMs`. */
function useSettledValue<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}

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

const PLAIN_QR: QrDesign = { dots: 'square', corners: 'square', cornerColor: null, logo: 'none' };
/** The color form a saved design takes. */
const SAVED_HEX = /^#[0-9a-f]{6}$/i;

const DOT_OPTIONS: Array<{ value: QrDesign['dots']; label: string }> = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
];
const CORNER_OPTIONS: Array<{ value: QrDesign['corners']; label: string }> = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
];

/** WCAG relative luminance of a #rgb or #rrggbb color; null for anything else. */
function relativeLuminance(color: string): number | null {
  const hex = color.trim().replace(/^#/, '');
  const full = /^[0-9a-f]{3}$/i.test(hex) ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Whether a dark-on-light reading of these colors is in doubt: the foreground
 * lighter than the background, or less than 4:1 contrast between them. Most
 * scanners look for dark modules on a light ground.
 */
function qrMayNotScan(foreground: string, background: string): boolean {
  const fg = relativeLuminance(foreground);
  const bg = relativeLuminance(background);
  if (fg === null || bg === null) return false;
  return fg > bg || (bg + 0.05) / (fg + 0.05) < 4;
}

function sameDesign(a: QrDesign, b: QrDesign): boolean {
  return a.dots === b.dots && a.corners === b.corners && a.cornerColor === b.cornerColor && a.logo === b.logo && a.logoKey === b.logoKey;
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{label}</span>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={`px-3 py-1.5 text-sm border-l first:border-l-0 border-gray-300 dark:border-gray-700 ${
              value === option.value
                ? 'bg-brand text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QRSection({
  link,
  shortUrl,
  apiBaseUrl,
  qrDefaults,
  brandLogoUrl,
  onSaveQrDesign,
  onUploadQrLogo,
}: {
  link: DiscoveredLink;
  shortUrl: string;
  apiBaseUrl: string;
  qrDefaults?: QrDesign;
  brandLogoUrl?: string;
  onSaveQrDesign?: (design: QrDesign | null) => Promise<void>;
  onUploadQrLogo?: (file: File) => Promise<{ logoKey: string; previewUrl?: string }>;
}) {
  const workspaceDesign = qrDefaults ?? PLAIN_QR;
  const [format, setFormat] = useState<'png' | 'svg'>('png');
  const [size, setSize] = useState<QRSize>(512);
  const startDesign = link.qr_design ?? workspaceDesign;
  const [color, setColor] = useState(startDesign.color ?? '#000000');
  const [bgcolor, setBgcolor] = useState(startDesign.bgcolor ?? '#ffffff');
  const [design, setDesign] = useState<QrDesign>(startDesign);
  // The custom logo stays selectable after switching away from it, until another upload replaces it.
  const [customLogoKey, setCustomLogoKey] = useState<string | undefined>(link.qr_design?.logoKey);
  const [status, setStatus] = useState<{ kind: 'idle' | 'busy' | 'saved' | 'error'; message?: string }>({ kind: 'idle' });
  const fileInput = useRef<HTMLInputElement>(null);

  const previewColor = useSettledValue(color, QR_PREVIEW_DELAY_MS);
  const previewBgcolor = useSettledValue(bgcolor, QR_PREVIEW_DELAY_MS);
  const previewCornerColor = useSettledValue(design.cornerColor, QR_PREVIEW_DELAY_MS);

  // Every style option is sent, never left to the saved styles, so the image
  // is the one on screen whatever is saved and whatever a cache holds.
  const qrImageUrl = (foreground: string, background: string, corner: string | null) => {
    const params = new URLSearchParams({ format, size: String(size), color: foreground, bgcolor: background, url: shortUrl });
    if (sameDesign({ ...design, cornerColor: corner }, PLAIN_QR)) {
      params.set('style', 'plain');
    } else {
      params.set('dots', design.dots);
      params.set('corners', design.corners);
      params.set('cornerColor', corner ?? foreground);
      params.set('logo', design.logo);
      if (design.logo === 'custom' && design.logoKey) params.set('logoKey', design.logoKey);
    }
    return `${apiBaseUrl}/api/links/${link.id}/qr?${params.toString()}`;
  };
  // The download always uses the colors as chosen, even within the preview delay.
  const qrUrl = qrImageUrl(color, bgcolor, design.cornerColor);
  const previewUrl = qrImageUrl(previewColor, previewBgcolor, previewCornerColor);
  const lowContrast = qrMayNotScan(color, bgcolor) || (design.cornerColor !== null && qrMayNotScan(design.cornerColor, bgcolor));

  const update = (change: Partial<QrDesign>) => {
    setDesign((current) => {
      const next = { ...current, ...change };
      if (next.logo !== 'custom') delete next.logoKey;
      return next;
    });
    setStatus({ kind: 'idle' });
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file || !onUploadQrLogo) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setStatus({ kind: 'error', message: 'Choose a PNG or JPEG image.' });
      return;
    }
    setStatus({ kind: 'busy', message: 'Uploading…' });
    try {
      const { logoKey } = await onUploadQrLogo(file);
      setCustomLogoKey(logoKey);
      setDesign((current) => ({ ...current, logo: 'custom', logoKey }));
      setStatus({ kind: 'idle' });
    } catch {
      setStatus({ kind: 'error', message: 'The logo could not be uploaded. Try again.' });
    } finally {
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const save = async (value: QrDesign | null) => {
    if (!onSaveQrDesign) return;
    if (value && !(SAVED_HEX.test(color) && SAVED_HEX.test(bgcolor))) {
      setStatus({ kind: 'error', message: 'To save the colors, write them as #rrggbb, like #1a2b3c.' });
      return;
    }
    setStatus({ kind: 'busy', message: 'Saving…' });
    try {
      await onSaveQrDesign(value && { ...value, color: color.toLowerCase(), bgcolor: bgcolor.toLowerCase() });
      if (value === null) {
        setDesign(workspaceDesign);
        setColor(workspaceDesign.color ?? '#000000');
        setBgcolor(workspaceDesign.bgcolor ?? '#ffffff');
        setStatus({ kind: 'saved', message: 'Using the workspace default.' });
      } else {
        setStatus({ kind: 'saved', message: 'Saved for this link.' });
      }
    } catch {
      setStatus({ kind: 'error', message: 'The design could not be saved. Try again.' });
    }
  };

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

  const logoOptions: Array<{ value: QrDesign['logo']; label: string }> = [{ value: 'none', label: 'None' }];
  if (brandLogoUrl || design.logo === 'brand') logoOptions.push({ value: 'brand', label: 'Brand kit' });
  if (customLogoKey) logoOptions.push({ value: 'custom', label: 'This link’s logo' });

  return (
    <div className="surface-popover rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <SectionHeader title="QR Code" />
      <div className="p-6 space-y-4">
        {/* Preview */}
        <div className="surface-table-header flex justify-center items-center p-6 rounded-lg">
          <img
            src={previewUrl}
            alt={`QR code for ${link.short_code}`}
            className="max-w-full h-auto"
            style={{ maxHeight: '280px' }}
          />
        </div>

        {lowContrast && (
          <p role="status" className="text-sm text-amber-700 dark:text-amber-400">
            This may not scan: most scanners need a dark code on a light background, with strong contrast between them.
          </p>
        )}

        {/* Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Segmented label="Dots" value={design.dots} options={DOT_OPTIONS} onChange={(dots) => update({ dots })} />
          <Segmented label="Corners" value={design.corners} options={CORNER_OPTIONS} onChange={(corners) => update({ corners })} />

          {/* Corner color */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Corner color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label="Corner color"
                value={design.cornerColor ?? color}
                onChange={(e) => update({ cornerColor: e.target.value.toLowerCase() })}
                className="h-9 w-14 border border-gray-300 dark:border-gray-700 rounded cursor-pointer flex-shrink-0"
              />
              <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={design.cornerColor === null}
                  onChange={(e) => update({ cornerColor: e.target.checked ? null : color.toLowerCase() })}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-700 text-brand focus:ring-brand"
                />
                Same color as the dots
              </label>
            </div>
          </div>

          {/* Logo */}
          <div>
            <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Logo</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {logoOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name={`qr-logo-${link.id}`}
                    checked={design.logo === option.value}
                    onChange={() => update(option.value === 'custom' ? { logo: 'custom', logoKey: customLogoKey } : { logo: option.value })}
                    className="h-4 w-4 text-brand border-gray-300 dark:border-gray-700 focus:ring-brand"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-200">{option.label}</span>
                </label>
              ))}
              {onUploadQrLogo && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    disabled={status.kind === 'busy'}
                    className="text-sm font-medium text-brand hover:underline disabled:opacity-50"
                  >
                    Upload…
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                  />
                </>
              )}
            </div>
          </div>
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

        {/* Save and download */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {status.message && (
            <span
              role="status"
              className={`mr-auto text-sm ${status.kind === 'error' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {status.message}
            </span>
          )}
          {onSaveQrDesign && (
            <>
              <button
                type="button"
                onClick={() => save(null)}
                disabled={status.kind === 'busy'}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Reset to workspace default
              </button>
              <button
                type="button"
                onClick={() => save(design)}
                disabled={status.kind === 'busy'}
                className="px-4 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Save for this link
              </button>
            </>
          )}
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

export function LinkDetail({
  link,
  baseShortUrl,
  apiBaseUrl,
  onNavigate,
  renderUtmValue,
  fetchLaunchpadStats,
  ownHosts,
  qrDefaults,
  brandLogoUrl,
  onSaveQrDesign,
  onUploadQrLogo,
}: LinkDetailProps) {
  const { primary: shortUrl, alternate: alternateShortUrl } = shortUrlForms(link, baseShortUrl, ownHosts);

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
            {alternateShortUrl && (
              <span className="basis-full text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center flex-wrap">
                  Also works:&nbsp;<span className="font-mono break-all">{alternateShortUrl}</span>
                  <CopyButton value={alternateShortUrl} />
                </span>
                <span className="block">Links shared in either form keep working.</span>
              </span>
            )}
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
      <QRSection
        link={link}
        shortUrl={shortUrl}
        apiBaseUrl={apiBaseUrl}
        qrDefaults={qrDefaults}
        brandLogoUrl={brandLogoUrl}
        onSaveQrDesign={onSaveQrDesign}
        onUploadQrLogo={onUploadQrLogo}
      />

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

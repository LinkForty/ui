import { useState } from 'react';
import { Link } from '../types';
import { Copy, ExternalLink, Target, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { projectPillClasses } from '../constants/projectColors';
import { DEFAULT_SHORTLINK_ORIGIN } from '../constants/shortlink';

interface LinkTableProps {
  /**
   * The short-link host this deployment serves on, e.g. `go.linkforty.com`.
   *
   * Optional, and only used when neither the link nor the workspace supplies a
   * domain. The host application knows which domain its backend actually serves;
   * this package does not, and must not read the app's environment to find out.
   * Omitted, it falls back to the platform default in `constants/shortlink.ts`.
   */
  defaultDomain?: string;
  links: Link[];
  /**
   * Called when a row is clicked — typically opens a detail / inspector modal.
   * When omitted, rows are not clickable.
   */
  onInspect?: (link: Link) => void;
  /**
   * Renders an Analytics icon in the action column that links to analytics
   * filtered for this link. Omit to hide.
   */
  onViewAnalytics?: (link: Link) => void;
  customDomain?: string;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

export function LinkTable({ links, onInspect, onViewAnalytics, customDomain, selectedIds, onSelectionChange, defaultDomain }: LinkTableProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const selectable = !!selectedIds && !!onSelectionChange;

  const handleCopyLink = async (link: Link) => {
    const shortUrl = getShortUrl(link);
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLink(link.short_code);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const getShortUrl = (link: Link) => {
    // Per-link assigned domain wins, then the org default, then the platform default.
    const host = link.domain || customDomain;
    const domain = host ? `https://${host}` : (defaultDomain ? `https://${defaultDomain}` : DEFAULT_SHORTLINK_ORIGIN);

    if (link.template_slug) {
      return `${domain}/${link.template_slug}/${link.short_code}`;
    }
    return `${domain}/${link.short_code}`;
  };

  const allSelected = selectable && links.length > 0 && links.every(l => selectedIds!.has(l.id));
  const someSelected = selectable && links.some(l => selectedIds!.has(l.id)) && !allSelected;

  const handleSelectAll = () => {
    if (!selectable) return;
    if (allSelected) {
      // Deselect all on current page
      const next = new Set(selectedIds!);
      links.forEach(l => next.delete(l.id));
      onSelectionChange!(next);
    } else {
      // Select all on current page
      const next = new Set(selectedIds!);
      links.forEach(l => next.add(l.id));
      onSelectionChange!(next);
    }
  };

  const handleToggleRow = (linkId: string) => {
    if (!selectable) return;
    const next = new Set(selectedIds!);
    if (next.has(linkId)) {
      next.delete(linkId);
    } else {
      next.add(linkId);
    }
    onSelectionChange!(next);
  };

  return (
    <div className="surface-table shadow rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="surface-table-header">
            <tr>
              {selectable && (
                <th className="px-4 py-3 w-12 align-middle text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 accent-brand focus:ring-brand cursor-pointer"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-2/5">
                Link
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-16">
                Clicks
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Created
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-24">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="surface-table divide-y divide-gray-200 dark:divide-gray-700">
            {links.map((link) => {
              const isSelected = selectable && selectedIds!.has(link.id);
              return (
                <tr
                  key={link.id}
                  onClick={onInspect ? () => onInspect(link) : undefined}
                  className={`${onInspect ? 'row-hover cursor-pointer' : ''} ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                >
                  {selectable && (
                    <td className="px-4 py-3 w-12 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(link.id)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 accent-brand focus:ring-brand cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {link.title || 'Untitled'}
                        </div>
                        <div className="text-xs url-link font-mono truncate">
                          {getShortUrl(link)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(link);
                        }}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href={getShortUrl(link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                        title="Open link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {onViewAnalytics && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewAnalytics(link);
                          }}
                          className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
                          title="View analytics"
                        >
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      )}
                      {copiedLink === link.short_code && (
                        <span className="text-xs text-green-600 flex-shrink-0">Copied!</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {link.project_name ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${projectPillClasses(link.project_color)}`}>
                        {link.project_name}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {link.click_count || 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(link.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`inline-flex justify-center min-w-[68px] px-2 py-0.5 text-xs font-semibold rounded-full ${
                        link.is_active
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {link.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {link.targeting_rules && (
                        ((link.targeting_rules.countries && link.targeting_rules.countries.length > 0) ||
                         (link.targeting_rules.devices && link.targeting_rules.devices.length > 0) ||
                         (link.targeting_rules.languages && link.targeting_rules.languages.length > 0)) && (
                          <span className="inline-flex items-center justify-center min-w-[68px] px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                            <Target className="h-3 w-3 mr-1" />
                            Targeted
                          </span>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {links.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">No links yet</p>
            <p className="mt-1">Create your first link to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}

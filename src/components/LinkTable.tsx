import { useState } from 'react';
import { Link } from '../types';
import { Copy, ExternalLink, Edit, Trash2, Target } from 'lucide-react';
import { format } from 'date-fns';

interface LinkTableProps {
  links: Link[];
  onEdit: (link: Link) => void;
  onDelete: (linkId: string) => void;
  baseUrl?: string;
}

export function LinkTable({ links, onEdit, onDelete, baseUrl = window.location.origin }: LinkTableProps) {
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = async (short_code: string) => {
    const shortUrl = `${baseUrl}/${short_code}`;
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLink(short_code);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const getShortUrl = (short_code: string) => {
    return `${baseUrl}/${short_code}`;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Link
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {link.title || 'Untitled'}
                      </div>
                      <div className="text-sm text-blue-600 font-mono">
                        {getShortUrl(link.short_code)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopyLink(link.short_code)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy link"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {copiedLink === link.short_code && (
                      <span className="text-xs text-green-600">Copied!</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {link.original_url}
                  </div>
                  {link.description && (
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {link.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {link.click_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(link.created_at), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      link.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {link.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {link.targeting_rules && (
                      ((link.targeting_rules.countries && link.targeting_rules.countries.length > 0) ||
                       (link.targeting_rules.devices && link.targeting_rules.devices.length > 0) ||
                       (link.targeting_rules.languages && link.targeting_rules.languages.length > 0)) && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                          <Target className="h-3 w-3 mr-1" />
                          Targeted
                        </span>
                      )
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <a
                      href={getShortUrl(link.short_code)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600"
                      title="Open link"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => onEdit(link)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Edit link"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(link.id)}
                      className="text-gray-400 hover:text-red-600"
                      title="Delete link"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {links.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p className="text-lg font-medium">No links yet</p>
            <p className="mt-1">Create your first link to get started</p>
          </div>
        </div>
      )}
    </div>
  );
}

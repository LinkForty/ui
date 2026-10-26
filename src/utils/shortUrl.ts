import type { Link } from '../types';

export interface ShortUrlForms {
  /** The URL to show, copy and encode in a QR code. */
  primary: string;
  /** The template form of the same link, when `primary` is the shorter one; otherwise null. */
  alternate: string | null;
}

/**
 * The short URL forms of a link.
 *
 * On a host the workspace owns, a bare `/{code}` resolves only that workspace's
 * links, so a templated link there is shown as `https://{host}/{code}`, with the
 * `/{templateSlug}/{code}` form as the alternate: both open the same link. On any
 * other host (a shared platform host) the template slug is what identifies the
 * link, so it stays in the URL and there is no alternate.
 *
 * @param link The link. Its own `domain` wins over `baseOrigin`.
 * @param baseOrigin Origin to use when the link has no domain, e.g. `https://go.linkforty.com`.
 * @param ownHosts Hostnames that belong to the link's workspace. Compared case-insensitively.
 */
export function shortUrlForms(
  link: Pick<Link, 'short_code' | 'template_slug' | 'domain'>,
  baseOrigin: string,
  ownHosts: readonly string[] = [],
): ShortUrlForms {
  const origin = link.domain ? `https://${link.domain}` : baseOrigin.replace(/\/+$/, '');
  const bare = `${origin}/${link.short_code}`;
  if (!link.template_slug) return { primary: bare, alternate: null };

  const templated = `${origin}/${link.template_slug}/${link.short_code}`;
  const host = hostOf(origin);
  const owned = !!host && ownHosts.some((h) => h.toLowerCase() === host);
  return owned ? { primary: bare, alternate: templated } : { primary: templated, alternate: null };
}

function hostOf(origin: string): string | null {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

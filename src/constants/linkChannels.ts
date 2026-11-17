import type { LinkChannel } from '../types';

/**
 * The channels a person can pick for a link, in display order. `user_share`
 * is not offered: it is set for links an app creates through the SDK.
 */
export const LINK_CHANNEL_OPTIONS: ReadonlyArray<{ value: LinkChannel; label: string; hint: string }> = [
  { value: 'email', label: 'Email, push or SMS', hint: 'Newsletters, lifecycle flows, notifications' },
  { value: 'bio_social', label: 'Bio or social', hint: 'Link in bio, posts, creators' },
  { value: 'website', label: 'Website', hint: 'Buttons and banners on your site, blog posts' },
  { value: 'qr_print', label: 'QR or print', hint: 'Packaging, flyers, events' },
  { value: 'product', label: 'Product link', hint: 'Sign-in, invites, gifts. Left out of marketing results' },
];

/** The label shown for a link's channel, including `user_share`. */
export function linkChannelLabel(channel: LinkChannel | null | undefined): string {
  if (!channel) return 'Not set';
  if (channel === 'user_share') return 'User share (created by your app)';
  return LINK_CHANNEL_OPTIONS.find((o) => o.value === channel)?.label ?? channel;
}

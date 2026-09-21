import type { Meta, StoryObj } from '@storybook/react';
import { LinkDetail, type DiscoveredLink, type LaunchpadLinkStats } from './LinkDetail';

const meta = {
  title: 'Components/LinkDetail',
  component: LinkDetail,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LinkDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLink: DiscoveredLink = {
  id: '1',
  userId: 'user-1',
  short_code: 'summer24',
  original_url: 'https://example.com/summer-sale',
  title: 'Summer Sale 2024',
  description: 'Check out our amazing summer deals',
  is_active: true,
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z',
  click_count: 1234,
  ios_app_store_url: 'https://apps.apple.com/app/example',
  android_app_store_url: 'https://play.google.com/store/apps/details?id=com.example',
  web_fallback_url: 'https://example.com/summer-sale',
  utmParameters: {
    source: 'newsletter',
    medium: 'email',
    campaign: 'summer_sale',
  },
};

const mockStats: LaunchpadLinkStats = {
  days: 30,
  views: 412,
  ctaIos: 96,
  ctaAndroid: 71,
  ctaOpen: 38,
  ctaWeb: 54,
  byDevice: { web: 380, ios: 20, android: 12 },
  desktopClicks: 1020,
};

const baseArgs = {
  link: mockLink,
  baseShortUrl: 'https://go.linkforty.com',
  apiBaseUrl: 'http://localhost:3000',
};

/** No fetcher supplied — the host has no stats endpoint, so no Launchpad section. */
export const Default: Story = {
  args: baseArgs,
};

/** A link whose page has been viewed: the funnel tiles appear below Basic Information. */
export const WithLaunchpadFunnel: Story = {
  args: {
    ...baseArgs,
    fetchLaunchpadStats: async (_linkId, days) => ({ ...mockStats, days }),
  },
};

/** Set to always show the page but not visited yet: the empty state explains that. */
export const LaunchpadNoViewsYet: Story = {
  args: {
    ...baseArgs,
    link: { ...mockLink, launchpad_mode: 'on' },
    fetchLaunchpadStats: async (_linkId, days) => ({
      days,
      views: 0,
      ctaIos: 0,
      ctaAndroid: 0,
      ctaOpen: 0,
      ctaWeb: 0,
      byDevice: { web: 0, ios: 0, android: 0 },
      desktopClicks: 87,
    }),
  },
};

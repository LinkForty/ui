import type { Meta, StoryObj } from '@storybook/react';
import { LinkTable } from './LinkTable';
import { Link } from '../types';

const meta = {
  title: 'Components/LinkTable',
  component: LinkTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LinkTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLinks: Link[] = [
  {
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
    utmParameters: {
      source: 'newsletter',
      medium: 'email',
      campaign: 'summer_sale',
    },
  },
  {
    id: '2',
    userId: 'user-1',
    short_code: 'app-dl',
    original_url: 'https://example.com/download',
    title: 'App Download',
    ios_app_store_url: 'https://apps.apple.com/app/example',
    android_app_store_url: 'https://play.google.com/store/apps/details?id=com.example',
    is_active: true,
    created_at: '2024-02-01T14:20:00Z',
    updated_at: '2024-02-01T14:20:00Z',
    click_count: 542,
    targeting_rules: {
      devices: ['ios', 'android'],
    },
  },
  {
    id: '3',
    userId: 'user-1',
    short_code: 'promo-us',
    original_url: 'https://example.com/us-promo',
    title: 'US-Only Promotion',
    description: 'Special offer for US customers',
    is_active: false,
    created_at: '2024-03-10T09:15:00Z',
    updated_at: '2024-03-10T09:15:00Z',
    click_count: 89,
    targeting_rules: {
      countries: ['US'],
      languages: ['en'],
    },
  },
];

export const Default: Story = {
  args: {
    links: mockLinks,
    onEdit: (link) => console.log('Edit:', link),
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const Empty: Story = {
  args: {
    links: [],
    onEdit: (link) => console.log('Edit:', link),
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const CustomBaseUrl: Story = {
  args: {
    links: mockLinks,
    baseUrl: 'https://my-custom-domain.com',
    onEdit: (link) => console.log('Edit:', link),
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const SingleLink: Story = {
  args: {
    links: [mockLinks[0]],
    onEdit: (link) => console.log('Edit:', link),
    onDelete: (id) => console.log('Delete:', id),
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CreateLinkModal } from './CreateLinkModal';
import { CreateLinkRequest, LinkTemplate } from '../types';

const mockTemplates: LinkTemplate[] = [
  {
    id: '1',
    name: 'Default Template',
    slug: 'default',
    description: 'Default template for all links',
    settings: {
      defaultIosUrl: 'https://apps.apple.com/app/id123456789',
      defaultAndroidUrl: 'https://play.google.com/store/apps/details?id=com.example',
      defaultWebFallbackUrl: 'https://example.com',
      defaultAttributionWindowHours: 168,
    },
    is_default: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Marketing Campaign',
    slug: 'marketing',
    description: 'Template for marketing campaigns',
    settings: {
      defaultIosUrl: 'https://apps.apple.com/app/id123456789',
      defaultAndroidUrl: 'https://play.google.com/store/apps/details?id=com.example',
      defaultAttributionWindowHours: 336,
      utmParameters: {
        source: 'facebook',
        medium: 'social',
      },
    },
    is_default: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const meta = {
  title: 'Components/CreateLinkModal',
  component: CreateLinkModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CreateLinkModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Wrapper component to handle modal state
function ModalWrapper(args: any) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 100); // Reopen for demo
  };

  const handleSubmit = async (data: CreateLinkRequest) => {
    console.log('Submit:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    handleClose();
  };

  return (
    <CreateLinkModal
      {...args}
      isOpen={isOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
    />
  );
}

export const Default: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async () => {},
    isLoading: false,
    templates: mockTemplates,
  },
};

export const Loading: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async () => {},
    isLoading: true,
    templates: mockTemplates,
  },
};

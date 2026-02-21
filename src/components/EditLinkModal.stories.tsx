import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EditLinkModal } from './EditLinkModal';
import { Link, UpdateLinkRequest } from '../types';

const meta = {
  title: 'Components/EditLinkModal',
  component: EditLinkModal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EditLinkModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockLink: Link = {
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
  targeting_rules: {
    countries: ['US', 'CA'],
    devices: ['ios', 'android'],
  },
};

// Wrapper component to handle modal state
function ModalWrapper(args: any) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 100); // Reopen for demo
  };

  const handleSubmit = async (data: UpdateLinkRequest) => {
    console.log('Submit:', data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    handleClose();
  };

  return (
    <EditLinkModal
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
    link: mockLink,
    isLoading: false,
  },
};

export const Loading: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async () => {},
    link: mockLink,
    isLoading: true,
  },
};

export const MinimalLink: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isOpen: true,
    onClose: () => {},
    onSubmit: async () => {},
    link: {
      id: '2',
      userId: 'user-1',
      short_code: 'simple',
      original_url: 'https://example.com',
      is_active: true,
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
    },
    isLoading: false,
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CreateLinkModal } from './CreateLinkModal';
import { CreateLinkRequest, LinkTemplate } from '../types';

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
    isLoading: false,
  },
};

export const Loading: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isLoading: true,
  },
};

const newsletterTemplate: LinkTemplate = {
  id: 'tpl-newsletter',
  name: 'Newsletter',
  slug: 'news',
  settings: { channel: 'email', utmParameters: { source: 'newsletter', medium: 'email' } },
  is_default: false,
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
};

/** Picking the Newsletter template pre-selects its channel, "Email, push or SMS". */
export const TemplateWithChannel: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    isLoading: false,
    templates: [newsletterTemplate],
  },
};

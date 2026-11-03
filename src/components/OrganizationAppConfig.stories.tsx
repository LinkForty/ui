import type { Meta, StoryObj } from '@storybook/react';
import { OrganizationAppConfig } from './OrganizationAppConfig';

const meta = {
  title: 'Components/OrganizationAppConfig',
  component: OrganizationAppConfig,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onSave: async (appConfig) => {
      // eslint-disable-next-line no-console
      console.log('save', appConfig);
    },
  },
} satisfies Meta<typeof OrganizationAppConfig>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The card as an npm consumer sees it, with only this package's stylesheet loaded. */
export const Card: Story = {
  args: {
    appConfig: {
      appScheme: 'exampleapp',
      iosTeamId: 'ABCDE12345',
      iosBundleId: 'app.exampleapp.ios',
      androidPackageName: 'app.exampleapp.android',
      androidSha256Fingerprints: ['AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99'],
      iosUniversalLinkDomain: 'go.exampleapp.example',
      androidAppLinkDomain: 'go.exampleapp.example',
      iosAppStoreUrl: 'https://apps.apple.com/app/id1',
      androidAppStoreUrl: 'https://play.google.com/store/apps/details?id=app.exampleapp.android',
      webFallbackUrl: 'https://exampleapp.example',
    },
  },
};

export const Empty: Story = {
  args: {},
};

/** `bare` drops the card wrapper for embedding in the host's own panel. */
export const Bare: Story = {
  args: { bare: true },
};

export const Saving: Story = {
  args: { isLoading: true },
};

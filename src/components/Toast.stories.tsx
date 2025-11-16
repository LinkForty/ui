import type { Meta, StoryObj } from '@storybook/react';
import { ToastProvider, useToast } from '../hooks/useToast';

const meta = {
  title: 'Components/Toast',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

// Demo component to trigger toasts
function ToastDemo() {
  const { success, error, warning, info } = useToast();

  return (
    <div className="space-y-4 p-8">
      <h3 className="text-lg font-medium mb-4">Click to show toasts:</h3>
      <div className="space-x-2">
        <button
          onClick={() => success('Operation completed successfully!')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Success Toast
        </button>
        <button
          onClick={() => error('Something went wrong!')}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Error Toast
        </button>
        <button
          onClick={() => warning('Please be careful with this action')}
          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Warning Toast
        </button>
        <button
          onClick={() => info('Here is some useful information')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Info Toast
        </button>
      </div>
    </div>
  );
}

export const Interactive: StoryObj = {
  render: () => (
    <ToastProvider>
      <ToastDemo />
    </ToastProvider>
  ),
};

# @linkforty/ui

**React UI components for deeplink management**

Beautiful, accessible React components for building deeplink management interfaces. Part of the LinkForty open-source ecosystem.

[![npm version](https://img.shields.io/npm/v/@linkforty/ui.svg)](https://www.npmjs.com/package/@linkforty/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Features

✅ **LinkTable** - Sortable, filterable table for displaying links \
✅ **CreateLinkModal** - Full-featured modal for creating new links \
✅ **EditLinkModal** - Modal for editing existing links \
✅ **Toast Notifications** - Beautiful toast system with provider \
✅ **TypeScript** - Fully typed components \
✅ **Tailwind CSS** - Styled with Tailwind utilities \
✅ **Zero Configuration** - Works out of the box

## Installation

```bash
npm install @linkforty/ui
```

### Peer Dependencies

```bash
npm install react react-dom
```

## Quick Start

### 1. Wrap your app with ToastProvider

```tsx
import { ToastProvider } from '@linkforty/ui';
import '@linkforty/ui/styles';

function App() {
  return (
    <ToastProvider>
      {/* Your app */}
    </ToastProvider>
  );
}
```

### 2. Use the components

```tsx
import { LinkTable, CreateLinkModal, useToast } from '@linkforty/ui';
import { useState } from 'react';

function LinksPage() {
  const [showCreate, setShowCreate] = useState(false);
  const { success, error } = useToast();

  const handleCreate = async (data) => {
    try {
      await fetch('/api/links', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      success('Link created successfully!');
      setShowCreate(false);
    } catch (err) {
      error('Failed to create link');
    }
  };

  return (
    <div>
      <button onClick={() => setShowCreate(true)}>Create Link</button>

      <LinkTable
        links={links}
        onEdit={(link) => console.log('Edit', link)}
        onDelete={(id) => console.log('Delete', id)}
      />

      <CreateLinkModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
}
```

## Components

### LinkTable

Display a table of links with sorting, filtering, and actions.

**Props:**

| Prop       | Type                       | Required | Description                                                  |
|------------|----------------------------|----------|--------------------------------------------------------------|
| `links`    | `Link[]`                   | Yes      | Array of link objects                                        |
| `onEdit`   | `(link: Link) => void`     | Yes      | Callback when edit is clicked                                |
| `onDelete` | `(linkId: string) => void` | Yes      | Callback when delete is clicked                              |
| `baseUrl`  | `string`                   | No       | Base URL for short links (default: `window.location.origin`) |

**Example:**

```tsx
<LinkTable
  links={[
    {
      id: '1',
      short_code: 'abc123',
      original_url: 'https://example.com',
      title: 'My Link',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      click_count: 42,
    }
  ]}
  onEdit={(link) => setEditingLink(link)}
  onDelete={(id) => handleDelete(id)}
  baseUrl="https://myapp.com"
/>
```

### CreateLinkModal

Modal for creating new links with advanced options.

**Props:**

| Prop        | Type                                         | Required | Description                     |
|-------------|----------------------------------------------|----------|---------------------------------|
| `isOpen`    | `boolean`                                    | Yes      | Whether modal is open           |
| `onClose`   | `() => void`                                 | Yes      | Callback to close modal         |
| `onSubmit`  | `(data: CreateLinkRequest) => Promise<void>` | Yes      | Callback when form is submitted |
| `isLoading` | `boolean`                                    | No       | Show loading state              |

**Example:**

```tsx
<CreateLinkModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSubmit={async (data) => {
    await apiClient.post('/api/links', data);
  }}
  isLoading={isCreating}
/>
```

### EditLinkModal

Modal for editing existing links.

**Props:**

| Prop        | Type                                         | Required | Description                     |
|-------------|----------------------------------------------|----------|---------------------------------|
| `isOpen`    | `boolean`                                    | Yes      | Whether modal is open           |
| `onClose`   | `() => void`                                 | Yes      | Callback to close modal         |
| `onSubmit`  | `(data: UpdateLinkRequest) => Promise<void>` | Yes      | Callback when form is submitted |
| `link`      | `Link \| null`                               | Yes      | Link to edit                    |
| `isLoading` | `boolean`                                    | No       | Show loading state              |

**Example:**

```tsx
<EditLinkModal
  isOpen={!!editingLink}
  onClose={() => setEditingLink(null)}
  onSubmit={async (data) => {
    await apiClient.put(`/api/links/${editingLink.id}`, data);
  }}
  link={editingLink}
/>
```

### Toast System

#### ToastProvider

Wrap your app with this provider to enable toasts.

```tsx
import { ToastProvider } from '@linkforty/ui';

function App() {
  return (
    <ToastProvider>
      {/* Your app */}
    </ToastProvider>
  );
}
```

#### useToast Hook

Hook to show toast notifications.

```tsx
import { useToast } from '@linkforty/ui';

function MyComponent() {
  const { success, error, warning, info } = useToast();

  const handleClick = () => {
    success('Operation completed!');
    error('Something went wrong');
    warning('Please be careful');
    info('Here is some info');
  };

  return <button onClick={handleClick}>Show Toast</button>;
}
```

**Methods:**

- `success(message, duration?)` - Show success toast
- `error(message, duration?)` - Show error toast
- `warning(message, duration?)` - Show warning toast
- `info(message, duration?)` - Show info toast
- `showToast(message, type, duration?)` - Show custom toast

## Types

All TypeScript types are exported from the package:

```tsx
import type {
  Link,
  CreateLinkRequest,
  UpdateLinkRequest,
  UTMParameters,
  TargetingRules,
  Toast,
  ToastType,
} from '@linkforty/ui';
```

### Link

```tsx
interface Link {
  id: string;
  userId: string;
  short_code: string;
  original_url: string;
  title?: string;
  description?: string;
  ios_url?: string;
  android_url?: string;
  web_fallback_url?: string;
  utmParameters?: UTMParameters;
  targeting_rules?: TargetingRules;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  click_count?: number;
}
```

### CreateLinkRequest

```tsx
interface CreateLinkRequest {
  originalUrl: string;
  title?: string;
  description?: string;
  iosUrl?: string;
  androidUrl?: string;
  webFallbackUrl?: string;
  utmParameters?: UTMParameters;
  targetingRules?: TargetingRules;
  customCode?: string;
  expiresAt?: string;
}
```

## Styling

The components use Tailwind CSS. You need to import the styles in your app:

```tsx
import '@linkforty/ui/styles';
```

If you want to customize the styles, you can override the Tailwind classes or create your own theme.

## Advanced Usage

### Custom Base URL

You can customize the base URL for short links:

```tsx
<LinkTable
  links={links}
  baseUrl="https://custom-domain.com"
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

### Controlled Modals

The modals are controlled components. You manage the open/close state:

```tsx
const [isOpen, setIsOpen] = useState(false);
const [currentLink, setCurrentLink] = useState(null);

// Open modal
setIsOpen(true);

// Close modal
setIsOpen(false);
```

### Form Validation

The modals use `zod` for form validation. Validation errors are displayed automatically:

- URLs must be valid
- Custom codes only allow letters, numbers, hyphens, and underscores
- All fields have max length validation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Projects

- **@linkforty/core** - Backend engine for deeplink management
- **[LinkForty Cloud](https://linkforty.com)** - Hosted SaaS version

## Support

- **Documentation**: [https://docs.linkforty.com](https://docs.linkforty.com)
- **Issues**: [GitHub Issues](https://github.com/linkforty/ui/issues)
- **Discussions**: [GitHub Discussions](https://github.com/linkforty/ui/discussions)

---

Made with ❤️ by the LinkForty team

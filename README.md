# @linkforty/ui

**React components for deeplink management interfaces**

The link table, link detail view, create/edit modals, app configuration form and toast system that the LinkForty dashboard is built from, published so you can build your own interface on top of [`@linkforty/core`](https://github.com/linkforty/core) without starting from a blank page.

[![npm version](https://img.shields.io/npm/v/@linkforty/ui.svg)](https://www.npmjs.com/package/@linkforty/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## What's in the box

| Export | What it is |
|---|---|
| `LinkTable` | Table of links with sortable columns, per-row inspect and analytics actions, optional row selection |
| `LinkDetail` | Read-only view of one link: short URL with copy and QR code, campaign parameters, template, project, deep link info, fallback paths, targeting rules, Launchpad funnel |
| `CreateLinkModal` | Form for creating a link from a template, with project, domain, deep-linking, UTM, targeting and expiry fields |
| `EditLinkModal` | The same form for an existing link |
| `OrganizationAppConfig` | Form for a workspace's app configuration: URI scheme, iOS team and bundle id, Android package and SHA-256 fingerprints, Universal Link and App Link domains, default store and fallback URLs |
| `ToastProvider`, `useToast`, `ToastItem` | Toast notifications, rendered through a portal on `document.body` |
| Types | `Link`, `CreateLinkRequest`, `UpdateLinkRequest`, `LinkTemplate`, `Project`, `CustomDomainOption`, `AppConfig`, `Organization`, `UTMParameters`, `TargetingRules`, and more — see `src/types` |
| Constants | `PROJECT_COLORS`, `DEFAULT_PROJECT_COLOR`, `projectPillClasses()`, `DEFAULT_SHORTLINK_DOMAIN` |

The components are presentational: they take data and callbacks, and never call an API themselves. Fetching, mutations and routing stay in your app.

## Installation

```bash
npm install @linkforty/ui react react-dom
```

React 18 is a peer dependency.

## Quick start

### 1. Import the styles and wrap your app in `ToastProvider`

```tsx
import { ToastProvider } from '@linkforty/ui';
import '@linkforty/ui/styles';

function App() {
  return (
    <ToastProvider>
      {/* your app */}
    </ToastProvider>
  );
}
```

### 2. Use the components

```tsx
import { LinkTable, CreateLinkModal, useToast } from '@linkforty/ui';
import type { CreateLinkRequest } from '@linkforty/ui';
import { useState } from 'react';

function LinksPage({ links, templates, projects, domains, defaultDomain }) {
  const [showCreate, setShowCreate] = useState(false);
  const { success, error } = useToast();

  const handleCreate = async (data: CreateLinkRequest) => {
    try {
      await api.createLink(data);
      success('Link created');
      setShowCreate(false);
    } catch (e) {
      error('Failed to create link');
    }
  };

  return (
    <>
      <button onClick={() => setShowCreate(true)}>New link</button>
      <LinkTable
        links={links}
        defaultDomain={defaultDomain}
        onInspect={(link) => navigate(`/links/${link.id}`)}
        onViewAnalytics={(link) => navigate(`/analytics?link=${link.id}`)}
      />
      <CreateLinkModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreate}
        templates={templates}
        projects={projects}
        domains={domains}
        defaultDomain={defaultDomain}
      />
    </>
  );
}
```

## Components

### LinkTable

| Prop | Type | Required | Description |
|---|---|---|---|
| `links` | `Link[]` | Yes | Links to display |
| `defaultDomain` | `string` | No | Host that links without an assigned domain are served on, e.g. `go.example.com` |
| `customDomain` | `string` | No | Workspace-level custom domain, used when a link has no `domain` of its own |
| `onInspect` | `(link: Link) => void` | No | Row action: open the link's detail view |
| `onViewAnalytics` | `(link: Link) => void` | No | Row action: open the link's analytics |
| `selectedIds` | `Set<string>` | No | Controlled row selection |
| `onSelectionChange` | `(ids: Set<string>) => void` | No | Called when the selection changes; selection UI is shown only when both selection props are given |

The short URL shown per row is `https://<host>/<short_code>` (with the template slug in between when the link has one), where the host is the link's own `domain`, then `customDomain`, then `defaultDomain`, then `DEFAULT_SHORTLINK_DOMAIN`.

### LinkDetail

| Prop | Type | Required | Description |
|---|---|---|---|
| `link` | `DiscoveredLink` | Yes | The link (`Link` plus optional `creator_email` and `template_name`) |
| `baseShortUrl` | `string` | Yes | Short URL origin for links without an assigned domain, e.g. `https://go.example.com` |
| `apiBaseUrl` | `string` | Yes | Origin of the API that serves `GET /api/links/:id/qr`, used by the QR code section |
| `onNavigate` | `(path: string) => void` | No | Called for in-app navigation (template, project) so the host's router can handle it |
| `renderUtmValue` | `(param, value) => ReactNode` | No | Overlay friendly names on UTM values; raw values are shown when omitted |
| `fetchLaunchpadStats` | `(linkId, days) => Promise<LaunchpadLinkStats>` | No | Loads the Launchpad funnel for a period; the funnel card is hidden when omitted |

```tsx
<LinkDetail
  link={link}
  baseShortUrl="https://go.example.com"
  apiBaseUrl="https://api.example.com"
  onNavigate={(path) => navigate(path)}
  fetchLaunchpadStats={(id, days) => api.getLaunchpadStats(id, days)}
/>
```

### CreateLinkModal

| Prop | Type | Required | Description |
|---|---|---|---|
| `isOpen` | `boolean` | Yes | Controlled open state |
| `onClose` | `() => void` | Yes | |
| `onSubmit` | `(data: CreateLinkRequest) => Promise<void>` | Yes | Receives the validated payload |
| `templates` | `LinkTemplate[]` | Yes | Templates to choose from; the default template's settings prefill the form |
| `projects` | `Project[]` | No | Shows a project select when non-empty; `projectId` is `null` when none is chosen |
| `domains` | `CustomDomainOption[]` | No | Verified custom domains; shows a domain select when there is a real choice; `domainId` is `null` for the workspace default |
| `defaultDomain` | `string` | No | Host shown for the workspace default option |
| `orgAppConfig` | `AppConfig` | No | Prefills deep-linking fields from the workspace's app configuration |
| `isLoading` | `boolean` | No | Disables the submit button |

### EditLinkModal

Same props as `CreateLinkModal` minus `orgAppConfig`, plus:

| Prop | Type | Required | Description |
|---|---|---|---|
| `link` | `Link \| null` | Yes | The link being edited; `null` renders nothing |
| `onSubmit` | `(data: UpdateLinkRequest) => Promise<void>` | Yes | `expiresAt: null` clears an expiration date |
| `templates` | `LinkTemplate[]` | No | Used to show the template's name |

### OrganizationAppConfig

| Prop | Type | Required | Description |
|---|---|---|---|
| `appConfig` | `AppConfig` | No | Current values |
| `onSave` | `(appConfig: AppConfig) => Promise<void>` | Yes | Receives the validated configuration |
| `isLoading` | `boolean` | No | Disables the save button |
| `bare` | `boolean` | No | Render without the card wrapper, for embedding in your own panel |

```tsx
<OrganizationAppConfig
  appConfig={organization.settings?.appConfig}
  onSave={(appConfig) => api.updateOrganization({ settings: { appConfig } })}
/>
```

### Toasts

```tsx
const { success, error, warning, info, showToast } = useToast();

success('Saved');
error('Something went wrong', 8000);
showToast('Custom', 'info', 3000);
```

## Styling

The components are styled with Tailwind utility classes compiled into the package stylesheet:

```tsx
import '@linkforty/ui/styles';
```

To restyle, override the classes in your own stylesheet or fork the components; there is no theme API.

## Types

Everything under `src/types` is exported:

```tsx
import type {
  Link,
  CreateLinkRequest,
  UpdateLinkRequest,
  LinkTemplate,
  Project,
  CustomDomainOption,
  AppConfig,
  Organization,
  UTMParameters,
  TargetingRules,
  Toast,
  ToastType,
} from '@linkforty/ui';
```

Field names follow the API they were built against: snake_case on records read from the API (`Link`, `LinkTemplate`), camelCase on request payloads (`CreateLinkRequest`, `AppConfig`).

## Form validation

The modals validate with `zod` and show errors inline: URLs must be well-formed, custom codes allow letters, numbers, hyphens and underscores, and text fields carry maximum lengths.

## Development

```bash
npm install
npm run storybook   # component explorer on port 6006
npm run build       # ESM + CJS + type declarations into dist/
```

## Browser support

Current versions of Chrome, Firefox, Safari and Edge.

## Changelog

See [CHANGELOG.md](CHANGELOG.md). 3.0.0 is a breaking release; read its Removed and Changed sections before upgrading from 2.x.

## License

MIT — see [LICENSE](LICENSE).

## Related projects

- [`@linkforty/core`](https://github.com/linkforty/core) — the open-source deeplink engine these components are built for
- [LinkForty Cloud](https://linkforty.com) — the hosted platform
- [Documentation](https://docs.linkforty.com)

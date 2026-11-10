# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.2.3] - 2026-11-07

### Changed

- `LinkDetail` updates the QR preview 250 ms after the foreground or background color stops changing, instead of requesting a new image for every step of a color-picker drag. Downloads always use the colors as chosen.

## [3.2.2] - 2026-11-03

### Changed

- Sample values in a Storybook story. Stories are not published, so the package contents are unchanged.

## [3.2.1] - 2026-10-28

### Changed

- The Targeting Rules section of `CreateLinkModal` and `EditLinkModal` now says what happens to a visitor who doesn't match: they see the not-found page instead of the link's destination.

## [3.2.0] - 2026-10-26

### Added

- **Shorter URLs on a workspace's own hosts.** `LinkTable` and `LinkDetail` take an optional `ownHosts` list. For a templated link on one of those hosts, they show, copy and QR-encode `https://{host}/{code}` instead of `https://{host}/{templateSlug}/{code}`. `LinkDetail` lists the template form under it as "Also works", with its own Copy button. Without `ownHosts`, nothing changes.
- `shortUrlForms(link, baseOrigin, ownHosts)` is exported for hosts that print the same URLs elsewhere.

## [3.1.0] - 2026-10-21

### Added

- **Install windows under an hour.** The Attribution Window select in `CreateLinkModal` and `EditLinkModal` offers 5, 15 and 30 minutes alongside the hour presets, and sends `attributionWindowMinutes` for those (`attributionWindowHours` otherwise). A link's or template's window that isn't a preset is listed as its own option.
- **Match each click to one install only.** A checkbox in both modals sends `oneInstallPerClick`; `CreateLinkModal` turns it on when the selected template's `defaultOneInstallPerClick` is set.
- `INSTALL_WINDOW_OPTIONS`, `installWindowValue`, `installWindowFields` and `installWindowOptions` are exported for hosts that edit the same setting.
- Types: `Link.attribution_window_minutes`, `Link.one_install_per_click`, `CreateLinkRequest.attributionWindowMinutes`, `CreateLinkRequest.oneInstallPerClick`, and the template settings `defaultAttributionWindowMinutes` and `defaultOneInstallPerClick`.

### Fixed

- `EditLinkModal` keeps a link's install window when it isn't one of the presets. Before, the select had no matching option and a save sent the first one, 1 hour.

## [3.0.3] - 2026-09-27

### Fixed

- The `CreateLinkModal` and `EditLinkModal` backdrop no longer switches to a navy tint in dark mode. Both now use the same neutral gray backdrop in light and dark, so they match a host's other dialogs.

## [3.0.2] - 2026-09-21

### Fixed

- **The stylesheet ships.** `@linkforty/ui/styles` pointed at `dist/styles/index.css`, but no build had ever produced that file, so `import '@linkforty/ui/styles'` failed to resolve and every component rendered unstyled outside the LinkForty dashboard. The build now compiles it (Tailwind, minified, ~27 KB).
- **Surfaces are self-contained.** Panels, cards, table chrome and inputs use `surface-popover`, `surface-card`, `surface-sunken`, `surface-table` and `surface-table-header`, which only the LinkForty dashboard defined. The stylesheet now defines them, with light defaults and dark ones under `prefers-color-scheme: dark`, and reads the host's `--color-popover-bg`, `--color-popover-border`, `--color-input-bg`, `--color-input-border`, `--color-table-bg` and `--color-table-header-bg` custom properties when set — so a host can theme all of them at once.
- `OrganizationAppConfig` has a Storybook story.

## [3.0.1] - 2026-09-21

Same contents as 3.0.0. Re-released under a new version number because the registry refused `3.0.0`: a `@linkforty/ui` package had been published and unpublished earlier in 2026, and npm never reuses a version number that existed before. This is the first version of the package available on npm.

## [3.0.0] - 2026-09-21

This release brings the published package back in line with the copy that the LinkForty dashboard is built from, which had moved on without it since 2.0.0. It is a large breaking release; read the Removed and Changed sections before upgrading.

### Removed

- **BREAKING: `DeviceSimulator` and `LiveRequestInspector`** — not part of the maintained package. Stay on 2.0.0 if you depend on them.
- **BREAKING: `Link.original_url` / `CreateLinkRequest.originalUrl`** — a link's destination is its `web_fallback_url` plus the platform store URLs; there is no separate original URL.
- **BREAKING: Open Graph fields** — `og_title`, `og_description`, `og_image_url`, `og_type` on `Link` and their camelCase request counterparts. Social previews are configured outside the link form.
- **BREAKING: `LinkTemplateSettings`** — the settings shape is inlined as `LinkTemplate['settings']`; `LinkTemplate.userId` is gone.

### Changed

- **BREAKING: `LinkTable` props** — `onEdit`, `onDelete`, `onViewQRCode` and `baseUrl` are removed. The table is now read-only navigation: `onInspect(link)`, `onViewAnalytics(link)`, optional row selection (`selectedIds`, `onSelectionChange`), and the short URL is built from `defaultDomain` / `customDomain` plus the link's own `domain`.
- **BREAKING: `Link.userId` is required again** (2.0.0 made it optional).
- **BREAKING: template settings keys** — `defaultIosUrl` → `defaultIosAppStoreUrl`, `defaultAndroidUrl` → `defaultAndroidAppStoreUrl`, matching the link fields renamed in 2.0.0.
- `UpdateLinkRequest.expiresAt` accepts `null` to clear an expiration date.
- Toasts render through a portal on `document.body`, so they are no longer clipped by a transformed or overflow-hidden ancestor.
- Peer and runtime dependencies are unchanged.

### Added

- **`LinkDetail`** — read-only view of a link: basic information with copyable short URL and QR code, campaign (UTM) parameters, template, project, deep link info, fallback paths, targeting rules, and a Launchpad funnel card loaded through `fetchLaunchpadStats`. Types `LinkDetailProps`, `DiscoveredLink`, `LaunchpadLinkStats`. `renderUtmValue` lets the host overlay friendly names for UTM values.
- **`OrganizationAppConfig`** — the form for a workspace's app configuration (URI scheme, iOS team/bundle id, Android package and SHA-256 fingerprints, Universal Link / App Link domains, default store and fallback URLs, ephemeral deep links). Types `AppConfig`, `OrganizationSettings`, `Organization`.
- **Project assignment** — `CreateLinkModal` / `EditLinkModal` take `projects?: Project[]` and send `projectId` (`null` clears it). `Link` carries `project_id`, `project_name`, `project_color`; `PROJECT_COLORS` and `DEFAULT_PROJECT_COLOR` constants.
- **Custom domain assignment** — both modals take `domains?: CustomDomainOption[]` and `defaultDomain?: string`, show a Domain select when there is a real choice, and send `domainId` (`null` returns the link to the workspace default). `Link` carries `domain_id`, `domain`, `short_url`.
- `CreateLinkModal` takes `orgAppConfig?: AppConfig` to prefill deep-linking fields; `EditLinkModal` takes `templates?: LinkTemplate[]`.
- `Link` fields `custom_scheme_url`, `append_click_id`, `launchpad_mode`, `event_attribution_window_hours`; matching `customSchemeUrl`, `appendClickId`, `launchpadMode`, `eventAttributionWindowHours` on the request types.
- `DEFAULT_SHORTLINK_DOMAIN` constant.
- `CHANGELOG.md` ships in the npm package.

## [2.0.0] - 2026-02-20

### Changed

- **BREAKING: Renamed platform URL fields** to match Core v1.6.0 — `ios_url` is now `ios_app_store_url`, `android_url` is now `android_app_store_url` (types, form schemas, and submit handlers all updated)
- **BREAKING: `Link.userId` is now optional** — Core v1.5.0 made `userId` optional across the framework
- **BREAKING: Renamed camelCase API fields** — `iosUrl` → `iosAppStoreUrl`, `androidUrl` → `androidAppStoreUrl` in `CreateLinkRequest` and `UpdateLinkRequest`
- **LinkTable short URLs now include template slug** — `getShortUrl()` renders `baseUrl/templateSlug/shortCode` when `template_slug` is present
- Updated form labels: "iOS App URL" → "iOS App Store URL", "Android App URL" → "Android App Store URL"

### Added

- **Deep Linking section** in CreateLinkModal and EditLinkModal — App URI Scheme, Deep Link Path, iOS Universal Link, Android App Link fields
- `template_id`, `template_slug`, `app_scheme`, `ios_universal_link`, `android_app_link`, `deep_link_path`, `deep_link_parameters` fields to `Link` type
- `appScheme`, `iosUniversalLink`, `androidAppLink`, `deepLinkPath`, `deepLinkParameters` fields to `CreateLinkRequest`
- `LinkTemplateSettings` interface (extracted from inline type)
- `userId` field to `LinkTemplate` type
- EditLinkModal now populates OG fields and attribution window from link data

## [1.0.0] - 2025-11-20

### Added

- Initial release with LinkTable, CreateLinkModal, EditLinkModal components
- Shared TypeScript types for Link, LinkTemplate, CreateLinkRequest, UpdateLinkRequest
- Storybook component explorer
- Tailwind CSS styling
- Vite library build with ESM and CJS outputs

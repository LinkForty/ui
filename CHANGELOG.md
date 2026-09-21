# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

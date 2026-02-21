# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

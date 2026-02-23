# Changelog

This project follows [Semantic Versioning](https://semver.org/).

## [1.1.0-rc.4] - 2026-02-24
- Switched mobile panel rendering to a content-driven (natural height) layout to better match Twitch app panel behavior.
- Removed mobile fixed-height forcing that could cause content clipping/cut-off on some app screens.
- Tuned mobile section/shell overflow behavior to avoid nested scroll conflicts and improve continuity.
- Kept desktop panel behavior unchanged while applying the above adjustments only for `platform=mobile`.
- Updated cheermote data sourcing to use Helix `GET /chat/emotes` with `emote_type=bitstier` (removed dependency on `GET /bits/cheermotes`).

## [1.1.0-rc.3] - 2026-02-23
- Added `platform` detection from URL query and fallback behavior (`missing/unknown -> web`).
- Added panel DOM platform markers (`data-ed-platform`) to enable platform-specific layout behavior.
- Added mobile-specific panel layout tuning for tab density, spacing, and footer/header sizing.
- Updated render layout math to use wider shell width rules on mobile and keep web behavior unchanged.
- Improved non-Twitch mobile fallback messaging to clarify that Helix data requires Twitch extension context.

## [1.1.0-rc.2] - 2026-02-22
- Added `Labels and Interactions` settings group and moved `Stamps Names` / `Badges Names` toggles out of Visibility.
- Added adjustable name label size controls for stamps and badges.
- Added configurable hover tooltip for stamp/badge names.
- Added click-to-copy stamp name behavior with `Copy!` feedback bubble.
- Added configurable panel font family options (`Trebuchet`, `Segoe UI`, `JP Gothic`).
- Made Config preview pane sticky on desktop so the preview remains visible while scrolling long settings.
- Reordered `Visibility > Stamps` controls to `Follower`, `Tier 1`, `Tier 2`, `Tier 3`, `Cheermotes`.
- Center-aligned stamp/badge labels and enabled multiline wrapping with bounds-safe clipping inside cards.
- Made hover tooltip colors theme-aware and aligned with inactive `Stamps/Badges` tab palette.

## [1.1.0-rc.1] - 2026-02-22
- Added Cheermotes fetching via Helix `GET /bits/cheermotes` using Extension JWT (`auth.helixToken`) in both panel and config preview flows.
- Added `showCheermotes` visibility control and `cheermoteOrder` persistence support.
- Added Cheermotes section rendering inside `Stamps` tab (no extra tab), including drag-and-drop sorting and individual visibility toggles.
- Added cheermote image normalization with animated/static fallback handling.

## [1.0.1] - 2026-02-22
- Adjusted panel root/shell height handling (`100%` based) and body overflow behavior to reduce external iframe scrollbars on channel profile panel.
- Ensured footer stays at the bottom even when the number of stamps/badges is small and content height is short.
- Added a release roadmap to separate patch stabilization (`1.0.1`) from the upcoming feature release line (`1.1.0-rc.1` -> `1.1.0`).

## Roadmap
### [1.1.0] - planned
- Run final regression checks for panel/config rendering and Helix data fetch flows.
- Finalize release notes and publish as stable 1.1.0.

## [1.0.0] - 2026-02-16
- Reworked Visibility settings into parent/child groups for `Stamps` and `Badges`, with separate `Names` toggles for each.
- Updated rendering config model to support `showBadges`, `showEmoteNames`, and `showBadgeNames` with backward compatibility for legacy `showStampNames`.
- Improved column fitting behavior by tightening frame-size constraints and syncing the Config `columns` control with preview-fit limits.
- Added local demo stamp/badge SVG assets under `src/extension/demo-stamps` and switched local demo data to use bundled assets.
- Hid section scrollbars while keeping scroll behavior (`overflow-y: auto`) for both panel and config preview.
- Updated submission build scripts to exclude `demo-stamps` from `dist/extension` and final ZIP package.

## [0.1.4] - 2026-02-16
- Updated default theme colors to a neon style (`#f06d9a`, `#6cc7ef`, `#232531`) for panel and config.
- Added dedicated neon glow variables (`--primary-glow`, `--accent-glow`, `--header-glow`, `--footer-glow`) and applied them across header/footer/cards/tabs.
- Tuned default surface colors for panel, stamp, header, and footer to improve contrast on dark background.
- Increased default `glowIntensity` from `12` to `20` and aligned config default control values.
- Improved inactive tab styling to auto-adapt for both light and dark custom themes.
- Updated header/footer gradients and borders to auto-adapt for light/dark custom colors.
- Updated footer layout to single-line alignment: left `EmoteDeck Panel`, right `Developed by ksmksks` (with Twitch link).

## [0.1.3] - 2026-02-16
- Improved drag-and-drop sorting for stamps in the config preview.
- Fixed animated emote rendering by using Helix `template` + `format=animated`.
- Reorganized the config UI into bordered category groups (`fieldset`/`legend`).
- Adjusted 300x500 layout behavior: columns and emote size now scale together (2-5 columns).

## [0.1.2] - 2026-02-16
- Unified panel layout to `300 x 500`.
- Added configurable header and footer colors.
- Added stamp/panel background color settings and improved border overlap handling.

## [0.1.1] - 2026-02-16
- Initial public baseline for EmoteDeck frontend extension.
- Implemented Twitch Helix API integration (emotes/badges).
- Added config live preview and ZIP build scripts (`build.bat` / `build.ps1`).

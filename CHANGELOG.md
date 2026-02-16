# Changelog

This project follows [Semantic Versioning](https://semver.org/).

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

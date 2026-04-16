# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-04-16

First feature release. The app now has a working game mode end-to-end.

### Added
- **Domination game mode** — new bottom tab for capture-and-hold skirmishes.
  - Create, edit, and delete saved games with name, two teams (custom names + 8-color swatch picker), round duration, round count, and pre-round countdown.
  - Live match screen: pre-round countdown overlay → active round with real-time round clock and per-team domination timer → round-ended overlay with winner (or tie) → next round or match complete.
  - Pause / resume / abort mid-match with confirmation.
  - Match history on game detail, tap a past match to view the full summary (round-by-round breakdown + per-team totals).
  - Button source abstraction: `Simulated` works today with on-screen team buttons; `Switcher` (USB/BLE hardware) is stubbed — when picked, a banner shows "Switcher not connected, simulated controls active" and on-screen buttons remain usable.
- **SQLite persistence** via `expo-sqlite` with versioned migrations (`PRAGMA user_version`). Tables: `games`, `matches`, `round_results`, `app_settings`.
- **Haptic feedback** on button presses during matches (`expo-haptics`), with a toggle in Settings to disable.
- **Keep-awake** during live matches (`expo-keep-awake`) — screen doesn't sleep mid-round.
- **Airsoft reticle app icons** (main, adaptive foreground/background/monochrome, favicon, splash) replacing the wallet placeholders.
- **Release signing** — `plugins/withReleaseSigning.js` wires an app-local `release.keystore` + `keystore.properties` into the Gradle release config so every build is signed with the same key and survives `prebuild --clean`.

### Changed
- Settings screen: new haptic-feedback toggle row.
- `CLAUDE.md`: expanded Git Workflow section — Golden rule forbidding direct commits to `main`/`develop`, Branch Lifecycle, Versioning, Release Process, and signing documentation.

### Fixed
- Live match round clock and team timers now advance smoothly every 200 ms (previously only updated on state changes).
- Big clock/countdown digits no longer clip at the top on Android (added explicit `lineHeight` + `includeFontPadding: false`).
- `SettingsProvider` falls back to safe defaults when the context is missing (prevents crash after fast-refresh adds the provider mid-session).

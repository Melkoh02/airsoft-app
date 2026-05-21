# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-05-20

### Fixed
- **Switcher device couldn't connect on release builds.** Android 9+ blocks cleartext (`ws://`, `http://`) traffic by default. Adds the `expo-build-properties` config plugin with `android.usesCleartextTraffic: true` so the LAN WebSocket to the Pi is permitted. Without this, v1.1.0 release APKs never opened a TCP connection to the daemon (Pi log showed `clients=0` on every flip).

## [1.1.0] - 2026-05-20

External Switcher hardware lands. A 3-position rocker switch wired to a
Raspberry Pi Zero W can now drive Domination matches over WiFi.

### Added
- **Switcher device support over WebSocket** — point control via a physical 3-position switch on a Raspberry Pi Zero W, no more thumbing the screen mid-skirmish.
  - Pi-side daemon (`pi/switcher/main.py`) reads GPIO17 / GPIO27 with internal pull-ups, debounces, and broadcasts state changes as NDJSON on `ws://<host>:8765/`. Includes wiring identifier script (`identify_common.py`) for finding the switch's common terminal without a multimeter.
  - App-side `SwitcherButtonSource` is a WebSocket client with exponential-backoff reconnect (500 ms → 5 s) that maps `blue` / `red` / `neutral` to team A / team B / neutral owner. The existing yellow "Switcher not connected" banner is now reactive — clears within a couple seconds of the WS connecting.
  - On-screen simulated buttons remain available as a fallback when the device is configured but unreachable.
- **Settings → "Switcher device"** row + edit modal for the device host. Default `rasp314.local:8765`; falls back to a LAN IP if mDNS doesn't resolve. Persisted in `app_settings`.

### Notes
- Round start does **not** auto-read the switch's current physical position — kept as an intentional safeguard against accidental round starts. After "Start round," the first switch flip dispatches the press.

## [1.0.0] - 2026-04-17

Home and Settings are no longer placeholders. The app feels complete as an offline companion.

### Added
- **Home dashboard** replaces the placeholder welcome screen:
  - **Weather card** — current temperature, condition, wind, and sunrise/sunset for your location. Powered by Open-Meteo (no API key required), fetched at most once per hour and cached in SQLite. Falls back to a stale-but-visible state when offline.
  - **Quick start card** — most recently edited game with a one-tap "Start match"; CTA to create a game when none exist.
  - **Recent matches** — last three finished matches across all games with winner color dot; tap to open the match summary.
  - **Lifetime stats** — matches played, rounds played, total active match time, rolled up across every game.
- **Location permission** via `expo-location`, requested lazily (never on launch). A "Location" row in Settings shows current status and jumps to OS settings when permanently denied.
- **Units setting** — metric / imperial picker on Settings; drives weather card display and re-fetches on change.
- **About modal** on Settings — app name, version, short tagline, Open-Meteo credit, and a "View on GitHub" link.

### Changed
- Haptic-feedback toggle in Settings now sits alongside Units, Location, and About for a fuller settings layout.
- `useGames`, `useGlobalMatches`, and `computeGlobalStats` helpers exposed for cross-feature consumption (home cards + future widgets).

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

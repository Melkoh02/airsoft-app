# Claude Code Instructions

## Project Overview
Airsoft App — React Native (0.83) + Expo SDK 55 + TypeScript strict mode. SQLite persistence via expo-sqlite. File-based routing via Expo Router. First feature: Domination game mode.

## Git Workflow

### Golden rule
**Never commit directly to `main` or `develop`.** Before making ANY change — even a one-line edit or a single-file tweak — check the current branch with `git branch --show-current`. If it is `main` or `develop`, create and switch to a `feat/<name>` or `fix/<name>` branch first, then make the change. No exceptions for "small" or "obvious" changes. The merge commits that land on `develop`/`main` during a release are the only edits allowed on those branches.

### Branches
- `main` — stable releases only. Never commit or push directly. Only receives merges from `develop`.
- `develop` — integration branch. Never commit directly outside the release flow. Only receives merges from `feat/*` and `fix/*` branches.
- `feat/<name>` — feature branches. Branch from `develop`, merge back into `develop` via PR.
- `fix/<name>` — bug fix branches. Branch from `develop`, merge back into `develop` via PR.

### Branch Lifecycle

**For bug fixes:**
1. `git switch develop && git switch -c fix/<name>`
2. Make changes, commit.
3. Merge into `develop` (not `main`).

**For features:**
1. `git switch develop && git switch -c feat/<name>`
2. Make changes, commit.
3. Merge into `develop` (not `main`).

**Multiple branches can coexist on `develop`.** Features and fixes accumulate on `develop` until the user decides to cut a release. There is no schedule — the user explicitly says when to release.

### If you catch yourself on `develop` or `main` with uncommitted or just-committed work
Stop and tell the user. Recovery options: `git switch -c feat/<name>` (if uncommitted) or move the commit via `git branch feat/<name> && git reset --hard HEAD~N` on the protected branch. Ask before running destructive recovery commands.

### Versioning (Semantic Versioning)

The version number is decided at release time, not when creating branches. Look at everything on `develop` since the last release tag and apply:

- **Patch (X.Y.Z+1)** — only bug fixes, no new features. Example: 1.0.1 → 1.0.2.
- **Minor (X.Y+1.0)** — new features added, existing features still work. Example: 1.0.2 → 1.1.0.
- **Major (X+1.0.0)** — breaking changes that could affect user data or require manual intervention. Example: 1.1.0 → 2.0.0.

When in doubt, ask the user.

### Release Process

Only start this when the user explicitly says to release.

1. Determine version number based on changes since last release.
2. On `develop`, ensure all feature/fix branches are merged and everything is tested.
3. Update version in three places:
   - `package.json` → `"version": "X.Y.Z"`
   - `app.config.ts` → `version: "X.Y.Z"`
   - `src/app/(tabs)/settings.tsx` → the hardcoded string passed to `t("settings.version", { version: "X.Y.Z" })`
4. Commit version bump on `develop`: `git commit -m "chore: bump version to vX.Y.Z"`
5. Merge to main: `git switch main && git merge develop --no-ff -m "release: vX.Y.Z"`
6. Update `CHANGELOG.md` on main:
   - Add new section above the previous version (Keep a Changelog format).
   - Commit: `git commit -m "docs: update CHANGELOG for vX.Y.Z"`
7. Build APK: `npm run android:release` — runs prebuild WITHOUT `APP_VARIANT` (production config) then assembleRelease. Signing comes from `keystore.properties` via the `withReleaseSigning` plugin.
8. Copy APK: `cp android/app/build/outputs/apk/release/app-release.apk airsoft-app-vX.Y.Z.apk`
9. Tag main: `git tag -a vX.Y.Z -m "vX.Y.Z"`
10. Push: `git push origin main && git push origin vX.Y.Z`
11. Sync develop: `git switch develop && git merge main && git push origin develop`
12. Create GitHub release: `gh release create vX.Y.Z ./airsoft-app-vX.Y.Z.apk -t "vX.Y.Z" -F /tmp/release-notes.md`
13. Clean up: `rm airsoft-app-vX.Y.Z.apk`

### Signing

- `release.keystore` at repo root is committed so the signing key stays constant across rebuilds (prebuild --clean wipes `android/` but the keystore survives).
- `keystore.properties` at repo root is gitignored (passwords local-only).
- `plugins/withReleaseSigning.js` patches `android/app/build.gradle` on every prebuild to wire the signing config.

### Commit Messages
Conventional commits, no co-author line: `feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `chore:`.

## Code Standards

### Architecture
- Atomic design: `atoms/` → `molecules/` → `organisms/` → `templates/`
- Screens live in `src/app/` (Expo Router file-based routing)
- Feature-scoped code: `src/features/<feature>/` (types, repositories, hooks, components)
- Database: `src/db/` (schema + migrations via `PRAGMA user_version`)
- State: React Context providers (Theme, DataRefresh, Settings). No Redux/Zustand.
- Data refresh: `useDataRefresh().invalidate("entity")` after mutations (generic string keys).

### Patterns
- All user-visible strings must use `useTranslation()` from react-i18next. Keys in `src/i18n/locales/en.json`. Update all locale files when adding keys (en + es).
- All modals must have `onRequestClose` (Android back button) and `SafeAreaView`.
- Forms inside modals use `ModalLayout` (includes KeyboardAvoidingView).
- Use `AppInput`, `AppText`, `AppButton`, `AppIcon` atoms — never raw RN components for UI.
- Colors always from `useTheme().colors` — never hardcoded.
- Timers / clocks in render: use `useNow(intervalMs)` from `@/hooks/useNow` to drive re-renders. Calling `Date.now()` inline in render is not reactive.

## Quality Checklist
Before any commit:
1. `npm run format` — Prettier
2. `npm run lint` — ESLint (must be clean)
3. `npx tsc --noEmit` — TypeScript must be clean

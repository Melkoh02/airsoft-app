# Claude Code Instructions

## Project Overview
Airsoft App — React Native (0.83) + Expo SDK 55 + TypeScript strict mode. File-based routing via Expo Router. No database yet; this scaffold exists as a UI base with atomic-design components, theming, and i18n.

## Git Workflow

### Branches
- `main` — stable releases only. Never push directly. Only receives merges from `develop`.
- `develop` — integration branch. All work merges here first.
- `feat/<name>` — feature branches. Branch from `develop`, merge back into `develop`.
- `fix/<name>` — bug fix branches. Branch from `develop`, merge back into `develop`.

### Commit Messages
Conventional commits, no co-author line: `feat:`, `fix:`, `refactor:`, `perf:`, `docs:`, `chore:`.

## Code Standards

### Architecture
- Atomic design: `atoms/` → `molecules/` → `organisms/` → `templates/`
- Screens live in `src/app/` (Expo Router file-based routing)
- State: React Context providers (Theme, DataRefresh). No Redux/Zustand.
- Data refresh: `useDataRefresh().invalidate("entity")` after mutations (generic string keys).

### Patterns
- All user-visible strings must use `useTranslation()` from react-i18next. Keys in `src/i18n/locales/en.json`. Update all locale files when adding keys.
- All modals must have `onRequestClose` (Android back button) and `SafeAreaView`.
- Forms inside modals use `ModalLayout` (includes KeyboardAvoidingView).
- Use `AppInput`, `AppText`, `AppButton`, `AppIcon` atoms — never raw RN components for UI.
- Colors always from `useTheme().colors` — never hardcoded.

## Quality Checklist
Before any commit:
1. `npm run format` — Prettier
2. `npm run lint` — ESLint (must be clean)

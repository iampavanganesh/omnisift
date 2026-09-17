# @omnisift/design-system

Design tokens only, for now — not a component library.

Per [ADR-0003](../../docs/adr/ADR-0003-web-platform-split.md), this stopped being a pure
"future marker" once `apps/web` existed alongside `apps/client`: both need to render the
same brand, so the token values (color, spacing, radius) needed one source of truth
instead of drifting independently.

`tokens.json` is that source of truth. There is **no build pipeline yet** consuming it —
`apps/web/src/app/globals.css` currently mirrors these values by hand as CSS custom
properties, and `apps/client/lib/core/theme/app_colors.dart` does the same for Flutter.
If you change a value here, update the consumers too, or this file just becomes another
thing to go stale.

## Logo

- `logo-mark-light.svg` / `logo-mark-dark.svg` — the brand mark (cart + price tag),
  transparent background, for light/dark surfaces respectively. Mirrored into
  `apps/client/assets/branding/` (bundled via `flutter_svg`, see `OmnisiftMark`) and
  `apps/web/public/logo-mark.svg` + `apps/web/src/app/icon.svg` (favicon).
- `app-icon.svg` / `app-icon-1024.png` — full-bleed square version for native app
  icons. The PNG feeds `flutter_launcher_icons` (see `apps/client/pubspec.yaml`,
  scoped to Android + Web only — iOS/macOS/Windows/Linux are out of V1 scope). If the
  mark ever changes, re-rasterize this PNG and re-run
  `dart run flutter_launcher_icons` from `apps/client/`.

Usage rule: "All shops. One view." for identity/branding (app store listings,
marketing); "Buy with Confidence." for in-product copy (headlines, empty states,
about screens). Both are legitimate — they're for different situations, not
competing taglines.

Framework-specific components (buttons, cards, etc.) still live in each app — that
extraction has no second consumer yet and stays deferred per the original "boundaries,
not empty rooms" rule.

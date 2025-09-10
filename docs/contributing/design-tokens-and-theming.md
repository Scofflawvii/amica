# Design Tokens & Theming

This document explains the new semantic theming system introduced in September 2025. It replaces scattered hard‑coded Tailwind utility colors with a small, composable set of CSS variable driven tokens. This makes dark mode, future brand refreshes, and consistent UI styling much easier.

## Goals

- Single source of truth for colors (light + dark).
- Easy to add new semantic variants (e.g. success / danger) without editing many components.
- Smooth dark mode transitions without layout shift.
- Encourage semantic class usage (`panel`, `card`, variants) over raw hex / arbitrary color utilities.

## Core Concepts

### 1. CSS Variable Tokens

Defined in `src/styles/globals.css` under `:root` and the `.dark` scope:

```
--surface, --surface-alt, --border,
--text, --text-muted,
--primary, --primary-hover, --primary-press,
--secondary, --secondary-hover, --secondary-press,
--success, --success-hover, --success-press,
--danger, --danger-hover, --danger-press;
```

Each variable stores an HSL triple (NOT full css `hsl()` function). We combine them in Tailwind via `hsl(var(--token) / <alpha-value>)` so opacity utilities still work.

### 2. Tailwind Color Map

`tailwind.config.ts` exposes semantic color names:

```
colors: {
  surface: "hsl(var(--surface) / <alpha-value>)",
  'surface-alt': "hsl(var(--surface-alt) / <alpha-value>)",
  border: "hsl(var(--border) / <alpha-value>)",
  text: "hsl(var(--text) / <alpha-value>)",
  muted: "hsl(var(--text-muted) / <alpha-value>)",
  primary, primary-hover, primary-press, primary-disabled,
  secondary, secondary-hover, secondary-press, secondary-disabled,
  success, success-hover, success-press, success-disabled,
  danger, danger-hover, danger-press, danger-disabled
}
```

Use these instead of raw brand utilities (`bg-fuchsia-500`, `text-gray-900`, etc.).

### 3. Component & Utility Primitives

| Primitive                | Purpose                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------- |
| `.panel`                 | Elevated container (settings groups, side trays) with blur and border.             |
| `.card`                  | Smaller surface (chat bubbles, small info blocks).                                 |
| `.heading-gradient`      | Gradient text using `--primary` → `--secondary`.                                   |
| `.input-base`            | Shared baseline input styling (text, select, textarea).                            |
| `<TextButton variant=…>` | Unified buttons (`primary`, `secondary`, `success`, `danger`, `ghost`, `outline`). |
| `<ThemeToggle />`        | User control to set dark / light manually.                                         |

### 4. Button Variants

Defined in `src/components/textButton.tsx`.

Variant palette mapping:

- `primary` – Core brand neutral / lavender tone.
- `secondary` – Accent / highlight (replaces legacy rose/fuchsia action buttons).
- `success` – Positive actions (replaces emerald / green).
- `danger` – Destructive / irreversible actions (replaces red / rose).
- `ghost` – Minimal button on surface, subtle hover fill.
- `outline` – Text emphasis with a brand outline.

### 5. Dark Mode

Tailwind `darkMode: 'class'` + `<html class="dark">` toggle. The `<ThemeToggle />` component writes preference to `localStorage` and applies / removes the `dark` class at runtime. Tokens are overridden in the `.dark` block inside `globals.css`. Because layout uses semantic tokens, switching themes only updates CSS variable values.

### 6. Migration Guidelines

DO:

- Replace any remaining `bg-rose-*`, `bg-fuchsia-*`, `bg-emerald-*`, `bg-red-*` with the appropriate button variant or token class.
- Replace `text-gray-*` with `text`, `muted`, or explicit semantic mapping. For subtle secondary text use `text-muted` or `text-muted/80`.
- Wrap grouped setting content in `.panel`. Small inline info blocks can use `.card`.
- Use `<TextButton>` for interactive clickable actions (not plain `<button>` + utility soup).
- Use `.input-base` then layer additional spacing or width utilities as needed.

AVOID:

- Hard-coded hex colors or arbitrary inline `style={{ color: '#...' }}`.
- Mixing legacy palette utilities (e.g. `bg-indigo-600`) with semantic tokens in the same component.
- Creating new color variables directly inside components. Add new tokens centrally.

### 7. Adding a New Variant (Example: `info`)

1. Add CSS variables: `--info`, `--info-hover`, `--info-press` to both light + dark sections.
2. Add Tailwind mappings in `tailwind.config.ts` similar to success/danger.
3. Extend the `Variant` union and `variantClasses` map in `textButton.tsx`.
4. Replace any relevant legacy usages.

### 8. Accessibility Notes

- Ensure contrast ratios meet WCAG AA (target ≥ 4.5:1 for body text). The current palettes roughly align; verify any new brand hues with a contrast checker.
- `ghost` variant should rely on text color for contrast; avoid using it on highly dynamic backgrounds without a subtle surface.
- Hover / active states bump lightness to give tactile feedback; keep at least a delta of 5–8% lightness for clear state change.

### 9. Future Enhancements

- Auto system theme sync listener to live-update when the OS theme changes after initial load.
- Token tiering (e.g. `--surface-1`, `--surface-2`, `--surface-3` for richer depth hierarchy).
- Motion tokens (standardize transition durations / easing curves).
- Lint rule or codemod to flag raw disallowed color utilities (optional).

### 10. Troubleshooting

| Issue                       | Cause                                            | Fix                                                                        |
| --------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| Button looks faded          | Using `*-disabled` state classes inadvertently   | Remove `disabled` prop or override classes.                                |
| Element ignores dark mode   | Hard-coded hex or original Tailwind utility used | Replace with semantic token utility (`bg-surface-alt`, `text`)             |
| Alpha utilities not working | Direct CSS variable used incorrectly             | Ensure pattern `hsl(var(--token) / <alpha-value>)` via Tailwind color map. |
| Flicker on theme toggle     | External images or iframes reacting late         | Prefer CSS backgrounds / avoid forced reflows inside toggle.               |

### 11. Quick Reference

```
Surface: bg-surface / bg-surface-alt
Borders: border-border
Text: text-text (implicit via body) / text-muted
Buttons: <TextButton variant="primary|secondary|success|danger|ghost|outline" />
Inputs: className="input-base"
Containers: panel / card
Accent Gradient: heading-gradient
```

---

Feel free to extend this doc as new tokens or patterns emerge.

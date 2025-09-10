## Z-Index Scale

Central source of truth for layering order. Goal: keep user-facing UI reliably above the VRM (Three.js) canvas while preventing uncontrolled z-index expansion.

### Scale

| Name       | Class        | Value | Description                                               |
| ---------- | ------------ | ----- | --------------------------------------------------------- |
| background | z-background | 0     | Non-interactive background media (iframe/video/image)     |
| vrm        | z-vrm        | 2     | 3D rendering surface (avatar canvas)                      |
| base       | z-base       | 10    | Standard interactive UI (menus, buttons, chat controls)   |
| floating   | z-floating   | 20    | Floating utility UI (webcam preview, dropdowns, popovers) |
| overlay    | z-overlay    | 40    | Dim overlays, introductions, guided tour blockers         |
| modal      | z-modal      | 50    | Modal dialogs & settings containers                       |
| toast      | z-toast      | 100   | Toast notifications (non-blocking)                        |
| max        | z-max        | 1000  | Critical alerts / highest priority ephemeral UI           |

### Usage Rules

1. Use the lowest viable layer.
2. Avoid raw numeric literals unless migrating; favor semantic tokens.
3. Resolve ordering inside a layer via DOM/flex order before escalating layers.
4. Do not exceed `z-max`.

### Adding New Layers

Open a PR updating this file and `tailwind.config.ts` with rationale. Keep the scale sparse.

### Migration Strategy

Refactor opportunistically (touch components -> swap `z-10` to `z-base`, etc.). No dedicated sweep required yet.

### Debugging Overlap

Use DevTools: apply temporary style `outline:1px solid #f0f` and inspect stacking contexts (look for `position`, `z-index`, `transform`, `opacity`).

### Notes

The VRM canvas uses value 2 instead of 0 to allow a pure background layer beneath it if needed.

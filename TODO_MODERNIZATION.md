# Modernization TODO Backlog

Living backlog distilled from post-modernization recommendations (2025-09-11). Grouped + prioritized for incremental adoption.

Legend:

- Priority: P0 (Immediate / foundational), P1 (High impact), P2 (Medium), P3 (Exploratory / Nice-to-have)
- Effort: S (≤1d), M (2–4d), L (≥1 week / multi-sprint)
- Status: (blank = not started) / **WIP** / **DONE** / **DEFERRED**

---

## Quick Win Starter Set (Suggested First 5)

1. (P0 S) Enable stricter TypeScript flags (`strict`, `noUncheckedIndexedAccess`) — track any `any` cleanups. **DONE** (`strict` + `noUncheckedIndexedAccess` enabled in `tsconfig.json`; `npm run typecheck` passes with 0 errors. Remaining broad `any` usages tracked under §1 Type Safety cleanups and lint warnings.)
2. (P0 S) Introduce structured logger wrapper (levels + JSON in prod) & replace ad-hoc `console.*` in new code. **DONE** (added `src/utils/logger.ts` with debug/info/warn/error, pretty in dev and JSON in prod; migrated warn/error across viewer, chat, settings, TTS (piper/kokoro/localXTTS/rvc/coquiLocal), external API modules, pages, and utils; tests/typecheck green).
3. (P1 S) Add bundle analyzer + size thresholds in CI (warn > baseline + % delta). **DONE** (manifest-based size checker wired to postbuild and CI with shared and total caps; follow-ups: baseline deltas & per-chunk reporting).
4. (P1 M) Add accessibility smoke tests (axe + Playwright) for core views (chat, settings, viewer, overlays). **DONE** (Playwright + axe smoke tests added for main and settings overlays: `tests/e2e/accessibility*.spec.ts`; CI workflow `.github/workflows/accessibility.yml`; npm script `test:a11y`.)
5. (P1 S) Conventional commits + auto CHANGELOG (semantic-release) + deprecation removal schedule. **DONE** (commitlint + husky in place; semantic-release configured with automated changelog + GitHub release workflow.)

---

## 1. TypeScript & Type Safety

- (P0 M) Turn on strict suite: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`. — **DONE** (enabled in tsconfig; codebase adjusted for overrides and exact optional types; typecheck green.)
- (P1 M) Introduce branded/opaque types (e.g. `ChatSessionId`, `TokenId`).
- (P1 S) Eliminate remaining broad `any`; codemod `_unused` prefix for intentional ignores. — **WIP** (converted Settings UI event handlers from `ChangeEvent<any>` to specific element types; added numeric parsing for number inputs. Remaining occurrences concentrated in integration-heavy surfaces like `src/pages/share.tsx` (filepond callbacks), `src/pages/_app.tsx` (console proxy), `src/pages/debug-popout.tsx` (window bridge), and a few 3D utilities (`textureDownscaler.ts`, `transparencyOptimizer.ts`, traversal in `vrmViewer/room.ts`). Tests and `.d.ts` intentionally excluded.)
- (P2 M) Runtime schema validation at API/model boundaries (zod) with inferred TS types.
- (P2 M) Add `ts-prune` / `knip` dead symbol check in CI.

## 2. Logging, Tracing & Observability

- (P0 M) Structured logger abstraction (dev pretty, prod JSON) with child contexts (session, request, model).
- (P1 M) OpenTelemetry traces: spans for chat streaming, TTS phases, VRM load, vision inference.
- (P1 S) Error taxonomy & classification (user-facing vs internal) + standardized error codes.
- (P1 S) Enforce logger usage via ESLint: default `no-console` error with narrow per-file allowlist + autofix hints; codemod lingering `console.debug` in feature modules. — **DONE** (set `no-console: error` with targeted overrides for tests/scripts/logger; migrated console.\* to structured `logger` across chat/session, STT, AmicaLife, registries, UI; added guide `docs/contributing/logging-and-tracing.md`; lint now 0 errors, tests green.)
- (P2 M) Client perf beacon aggregator → server histograms (p50/p95 token latency, frame pacing, TTS start delay).
- (P3 L) Session replay (privacy scrub) for difficult streaming race bugs.

## 3. Performance & Bundle Budgets

- (P1 S) CI gate: fail if > X kB gz/ Brotli delta vs baseline (config file + allowlist).
- (P1 S) Lighthouse CI (PWA, performance, a11y) per main flows.
- (P2 M) Perf budget dashboard auto-published (artifact or PR comment).
- (P2 M) Bundle splitting audit: verify tree-shaking, mark side-effect-free modules.
- (P2 S) Bundle size report: add per-chunk reporting to `scripts/check_bundle_size.mjs` and persist baseline file in repo for delta checks. — (not started)
- (P3 L) Adaptive token batch flush algorithm (coalesce in busy frame windows).

## 4. Accessibility & UX Resilience

- (P1 S) Automated axe run in CI for critical routes. — **DONE** (see `.github/workflows/accessibility.yml` and `npm run test:a11y`).
- (P1 S) Focus management & trap for overlays / modals / debug pane.
- (P1 M) Reduced motion pathway for particle / viewer animations.
- (P2 M) Keyboard navigation matrix tests (inputs, session controls, debug panel).
- (P3 M) Pseudo-locale expansion & bidi layout sanity.

## 5. Testing & Quality Engineering

- (P1 M) Property-based tests (fast-check) for AsyncQueue ordering & flush invariants.
- (P1 M) Mutation testing (Stryker) on chat/session/queue core.
- (P2 S) Snapshot tests for theme tokens (prevent accidental color drift).
- (P2 M) Visual regression (Playwright + pixelmatch) Dark vs Light core surfaces.
- (P3 L) Load testing harness: synthetic high token-rate streaming under throttled CPU.

## 6. API Surface & Errors

- (P1 S) Public API report (ts-docgen) committed to repo for diffing.
- (P1 S) `@deprecated` JSDoc with planned removal versions; central removal calendar.
- (P2 M) Unified `AbortController` strategy across LLM / vision / TTS with reason codes.
- (P2 S) Error classes: `ChatStreamError`, `VisionModelError`, `SpeechPipelineError`, `TimeoutError`.
- (P3 M) Retry orchestration with exponential + jitter for transient model/vision failures.

## 7. Release & Versioning

- (P1 S) Conventional commits + automated CHANGELOG + semver publishing.
- (P2 S) Pre-release channel (next/beta tag) for architectural shifts.
- (P2 M) Deprecation policy doc (lifecycle states, timelines).
- (P3 M) Release quality gates (test + perf + a11y must pass).

## 8. Frontend Architecture (React / Next)

- (P2 L) Migrate to Next.js App Router + React Server Components for data-heavy sections.
- (P2 M) Introduce Suspense boundaries with streaming fallbacks in chat & settings.
- (P2 S) Priority hints / prefetch tuning for initial chat resources.
- (P3 L) Partial hydration / islands for viewer vs chat UI separation.

## 9. Theming & Design Tokens

- (P1 M) Single source tokens (Style Dictionary) → emit CSS vars + TS types + doc tables.
- (P2 S) Lint rule forbidding raw hex/color usage when semantic token available.
- (P2 M) Visual regression baseline for top 10 token-driven components.
- (P3 M) Dynamic theme packs / plugin token injection with validation.

## 10. Rendering / 3D / VRM

- (P1 M) Worker offload for BVH / skeleton prep (transferable buffers). — **WIP** (worker is bundled and served as `public/generateMeshBVH.worker.js`; integration in `vrmViewer/viewer.ts` is currently commented out. Next: re-enable behind a feature flag with capability checks and fallback to single-thread when SharedArrayBuffer unavailable.)
- (P2 M) GPU/Device capability diagnostics overlay (fallback heuristics).
- (P2 M) Frame budgeting scheduler that yields during large token bursts.
- (P3 L) WASM/Rust acceleration for heavy geometry or voice feature extraction.

## 11. Streaming & Concurrency

- (P1 M) Token batching with adaptive flush (CPU/frame load heuristic).
- (P1 S) Standard abort + cleanup contract (single entrypoint, reason output).
- (P2 M) Backpressure signals (queue depth, drop / coalesce strategies for extreme throughput).
- (P3 L) Streaming diff protocol (only send deltas vs full appended tokens to UI layer).

## 12. Security & Privacy

- (P1 S) CSP hardening & nonce utilities; report-only phase first.
- (P1 S) DOMPurify (or trusted types) for any residual rich text / model output.
- (P2 S) Dependency scanning: OSV + `npm audit` scheduled workflow + Renovate.
- (P2 M) Input validation schemas for all API routes (zod) with typed inference.
- (P3 M) Privacy mode flag (no telemetry; local echo only).

## 13. Build & Tooling

- (P1 S) Bundle analyzer snapshot per PR (stored artifact + delta comment).
- (P1 S) `tsc --noEmit` + ESLint + tests unified via a single `verify` script. — **DONE** (`npm run verify`).
- (P2 M) Turborepo / task pipeline for incremental caching (tests & build layers).
- (P2 S) Add `knip` / `depcheck` to catch unused deps & exports.
- (P3 M) Evaluate Biome or Rome/oxc for faster lint/format path.

## 14. Developer Experience & Maintainability

- (P1 S) Codemod: replace legacy `Chat.initialize` with `initializeWithObserver` (safe patterns). — **DONE** (migrated remaining tests to `initializeWithObserver`; legacy method retained for BC; docs flag deprecation.)
- (P1 S) Add contributor guide section for semantic layering + tokens + logging patterns. — **WIP** (logging guide added at `docs/contributing/logging-and-tracing.md`; tokens + semantic layering docs pending.)
- (P2 M) Storybook (or Ladle) for component + token documentation (dark/light variants).
- (P2 S) ESLint rule: forbid raw z-index & raw colors (already partial) – add autofixes. — **WIP** (z-index rule active via custom plugin `amica-z/no-raw-z-index`; raw color rule still pending.)
- (P3 M) Plugin API versioning & validation (registry schema).

## 15. Internationalization

- (P2 S) Missing key detector (dev overlay + build report).
- (P2 S) Pseudo-locale build to test length expansion & accent coverage.
- (P3 M) Coverage gate: fail CI if new keys missing mandatory locales.

## 16. Data, Offline & Caching

- (P2 M) Service worker streaming cache for model assets & last session context.
- (P2 S) Hash-based versioning for VRM / asset URLs (cache bust clarity).
- (P3 L) Offline/degraded mode with limited LLM stubs & last responses.

## 17. AI Abstraction & Future Enhancements

- (P2 M) Unified AI provider layer (capabilities matrix: vision, function calling, tool use, safety).
- (P2 M) Retry / fallback policy engine (model A → B on failure).
- (P3 L) Diff-based token compression protocol for high throughput models.
- (P3 L) Adaptive quality: dynamically lower avatar render complexity during heavy token storms.

---

## Tracking & Governance

- Create GitHub labels: `modernization`, `perf`, `a11y`, `observability`, `tokens`, `security`.
- Maintain a quarterly review: prune DONE / re-prioritize P2/P3.
- Add a lightweight RFC template for any P3/L changes.

## Suggested Implementation Order (Wave Planning)

Wave 1 (Foundations): TS strict, logging abstraction, bundle budgets, axe tests, conventional commits.
Wave 2 (Perf & Safety): Abort unification, token batching prototype, error taxonomy, AI provider abstraction (thin), Style Dictionary.
Wave 3 (UX & Observability): RSC/App Router spike, visual regression, OpenTelemetry traces, worker offload for BVH.
Wave 4 (Hardening & Scale): Security CSP, mutation testing, backpressure policies, plugin API versioning.
Wave 5 (Exploration): Streaming diff protocol, adaptive rendering heuristics, offline mode.

---

## Meta

This file is intentionally concise yet structured. Keep edits additive; when a line is DONE, retain it for historical context until quarterly prune.

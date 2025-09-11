# Fork Change Summary (Inclusive Range Starting at e5555d6e0e4b310eacba92c04c9af80a5e8398f8 → HEAD)

Base (inclusive) commit: e5555d6 ("Update dependencies")
Head commit: 4b44ac1 (docs(chat): add chat observer migration & LLM helper guide)
Date generated: 2025-09-11

## High-Level Overview

This range represents a large architectural, performance, theming, and developer‑experience modernization sweep. Major themes:

1. Chat & Streaming Architecture: Introduction of observer-based chat system, async queues, session abstraction, unified pipeline state, TTS & speech pipeline refactors, and LLM helper consolidation.
2. Performance & Instrumentation: Extensive perf marks, adaptive viewer optimizations, lazy/dynamic imports, debugging panels, and metrics aggregation utilities.
3. Theming & UI Semantics: Semantic z-index scale, semantic design tokens (dark mode, success/danger variants, gradients), input component refactors, and tokenized alerts/buttons.
4. VRM / 3D Viewer Stability: Reversions to last-known-good (LKG) snapshots, WebGPU/WebGL fallback logic, rendering fixes, sizing & camera safety, XR improvements, and bone/node caching.
5. Testing Expansion: Additions of chat observer tests, session & queue tests, performance tests, TTS tests, vision tests, and standalone askLLM tests (total test surface greatly expanded).
6. Tooling & Linting Modernization: ESLint 9 flat config migration, custom eslint z-index rule, stricter typing, editor & CI workflow updates, Husky + lint-staged, Prettier config adjustments.
7. Documentation & Migration Guides: Added deprecation notes, modern usage examples, theming/design token guide, z-index scale doc, and chat observer migration guide.
8. Dependency & Config Updates: Upgrades across build stack, Tailwind v4 → then TypeScript config tuning, added patches for third‑party packages, environment & instrumentation reshaping.

## Quantitative Diff Stats

Files changed: 180
Insertions: 28,171
Deletions: 32,838
Net lines changed: -4,667 (significant churn with refactors & deletions of legacy code)
Primary contributor: 94 commits by Scofflawvii

## Key Milestone Commits (Chronological Highlights)

Architectural / Chat:

- a5f71bc: Modernize chat architecture (async queues, session abstraction, registries, dynamic TTS + metrics)
- 1565898: Add ChatStreamSession & AsyncQueue tests
- 1f44fba / 5747e6f: Registry tests & CleanTalk edge case expansion
- 7e77158: Extract SpeechPipeline & StreamController; add logger + TTS edge tests
- 23330de / ba7bcbd: Observer hooks + UI provider + initializeWithObserver path
- c489e7e: Unify pipeline state transitions; rename setProcessing → setProcessingState
- de8a363 / 96118e5: Align askLLM with pipeline; standalone + vision optional Chat; add tests
- a802ae2 / 4b44ac1: Deprecation notes and migration guide docs

Performance & Instrumentation:

- 3559690 / 5760510 / 1378ca2 / 471cc25: Perf marks, adaptive pixel ratio, deferred work, disposal improvements
- 3f04a5c / 865095b / 5747e6f / 96118e5: Performance & TTS/vision test suites
- 9e92b0e: Performance metrics aggregation panel (debug feature)

Theming & UI Semantics:

- ab96573 → 5786555: Semantic theming foundation, variants, design token docs
- 404fe4a: Semantic z-index scale + custom ESLint rule enforcement
- ff b67c5 → c69bf82 (sequence): Gradients, alerts, inputs, system theme sync, token sweeps

Viewer / VRM Stability:

- 0f3b9fa base modernization; subsequent fixes: 250fc0c, fef743d, 2f0b0ef, 1493b5c, 471cc25
- Reverts / stabilization: ae48851, 797f49b, 734d32c
- Rendering & white screen fixes: fea3029, 269ed82, cb7a1c4, e945510, 9a71cca

Tooling / Config:

- d8484b2: CI + tooling modernizations (Sentry env DSN, Workbox options, Node 24, Husky)
- fc97eaf / 069afb7 / 603f39a / 1493b5c: ESLint noise reduction & typing passes
- e332826 / d478ae4 / fcdc009: Package upgrades and compatibility fixes
- aceaf12 / c156384 / 2141d90: Tailwind CSS v4 migration & three.js r180 compatibility patches
- patches/ added for eslint & three-vrm adjustments

Documentation:

- 5786555: Design tokens & theming guide
- 404fe4a: z-index scale doc
- a802ae2: Deprecation + modern usage examples in README
- 4b44ac1: Chat observer migration & LLM helper guide

## Detailed Thematic Breakdown

1. Chat System Redesign
   - Shift from multi-callback initialization to observer pattern.
   - Added ChatObserver interface with granular events (delta, flush, state, processing, speaking, session lifecycle, interrupts, thought/user messages).
   - Introduced AsyncQueue for ordered streaming consumption and ChatStreamSession abstraction.
   - Consolidated streaming logic: askLLM now reuses pipeline when a Chat instance is present; standalone path uses minimal session.
   - Unified state transitions via exported ChatState and transitionPublic helper; removed scattered boolean setters.
   - Added speech pipeline integration consistency (speaking ↔ idle transitions).
   - New React provider (ChatUIStateProvider) supplies derived UI state from observer events.

2. Performance & Lazy Loading
   - Dynamic imports added for large UI slices (Settings pages, VrmViewer, EmbeddedWebcam, DebugPane) to reduce initial bundle.
   - requestIdleCallback defers heavy viewer setup; adaptive pixel ratio & pause logic reduce off-screen cost; metrics instrumentation across STT, TTS, chat streaming.
   - Added perf utilities (marks/measures summarization) and debugging panels to visualize timing.

3. Theming & Design Tokens
   - Semantic tokens introduced (status variants, gradients, dark mode support, inputs base component) replacing ad-hoc Tailwind utility/color usage.
   - System theme auto-sync when user preference unspecified.
   - Consolidated input components (secret, range, URL, message, etc.) onto tokenized foundation.
   - Z-index semantics: defined scale and enforced via custom ESLint rule to prevent arbitrary layering values.

4. VRM Rendering & Stability
   - Robust viewer initialization: safer canvas sizing, camera defaults, material selection for WebGPU/WebGL compatibility, XR improvements, node caching.
   - Fallback to WebGL by default after exploration of WebGPU due to regressions; reverts to LKG snapshots to maintain stability.
   - Performance improvements: disposal patterns, BVH teardown, conditional stats/GUI rendering.

5. Testing Expansion
   - Added suites: observer behavior (standard & extended), chat session, async queue, registries, perf, TTS, vision, standalone askLLM.
   - Strengthened CleanTalk sanitization tests; perf metrics validated; logging and deltas ordering enforced.

6. Tooling, Linting, and Developer Workflow
   - Migration to ESLint flat config with layered overrides; Prettier config modernization; .editorconfig and .nvmrc updates.
   - Husky pre-commit + lint-staged integration and CI workflow enhancements.
   - Custom eslint-plugin-amica-zindex rule ensures semantic layering usage.
   - Added patch files to maintain compatibility with upstream dependency versions.

7. Documentation & Developer Guidance
   - README now contains deprecations and modern observer usage examples.
   - Dedicated guides for theming, z-index scale, and chat observer migration.
   - Clarified pipeline event ordering for render optimization.

8. Deprecations & Migration Path
   - Chat.initialize (multi-callback) marked deprecated; single observer path recommended.
   - Direct setter hooks considered internal bridges—migration guidance provided.
   - Planned future enforcement: lint rule to flag legacy initialize usage (not yet implemented in range).

## Notable File Additions

- src/features/chat/\* (chatObserver.ts, chatSession.ts, chatUIState.tsx, asyncQueue.ts, speechPipeline.ts, streamController.ts, registries.ts)
- **tests**/\* (numerous new test suites expanding coverage)
- docs/guides/chat-observer-migration.md, docs/z-index-scale.md, docs/contributing/design-tokens-and-theming.md
- eslint-plugin-amica-zindex.js (custom rule)
- perf & debug utilities (src/utils/perf.ts, src/components/perfMetrics.tsx, src/utils/debug.ts)

## Significant Refactors / Renames

- sentry.client.config.ts → instrumentation-client.ts (broader instrumentation approach)
- postcss.config.js → postcss.config.cjs; .prettierrc.js → .prettierrc.cjs
- Added tailwind.config.ts while preserving prior file as backup.
- Multiple component refactors consolidating tokens, layering, and state wiring (messageInput, settings pages, viewer).

## Removed / Deprecated Patterns

- Ad-hoc z-index numeric usage replaced with semantic tokens.
- Legacy multi-callback chat initialization path now guarded by one-time console warning.
- Excess per-component state setters replaced by observer-driven provider consumption.
- Unnecessary portal layering components simplified into unified GuiLayer.

## Performance-Oriented Changes (Examples)

- Lazy loading of large feature components reduces initial bundle size & TTI.
- Adaptive pixel ratio scaling adjusts rendering cost based on visibility & performance.
- requestIdleCallback defers non-critical viewer setup work.
- Perf marks inserted across chat streaming phases, STT processing, TTS playback enabling granular timing diagnostics.

## Risk / Follow-Up Considerations

- Need enforcement (ESLint rule or codemod) to block introduction of new legacy Chat.initialize usages.
- Observer event ordering contract should have automated regression test (partially covered; ensure flush/log/shown ordering fully asserted in future tests).
- Consider adding CHANGELOG entry and scheduled removal version for deprecated API.
- Evaluate memory usage of new async queue & session abstractions under long-running sessions.
- Potential future: batching deltas for very high token-rate models to reduce React re-render pressure.

## Suggested Next Steps (Out of Scope of Current Range)

1. Add lint autofixer to replace Chat.initialize with initializeWithObserver when straightforward.
2. Provide migration codemod script in docs/tools.
3. Introduce performance budget CI check (bundle size & initial load metrics).
4. Add structured CHANGELOG summarizing major architectural shift for external adopters.
5. Implement delta batching or frame-coalescing strategy for very high throughput LLM streams.

## Appendix: Full Commit List (Newest → Oldest)

4b44ac1 docs(chat): add chat observer migration & LLM helper guide
a802ae2 docs(chat): add deprecation notes and modern usage examples
96118e5 test(llm): add standalone askLLM spec + vision helper optional chat; add JSDoc
de8a363 refactor(llm): align askLLM with Chat pipeline via ChatStreamSession
c489e7e refactor(chat): unify pipeline state transitions + rename setProcessing -> setProcessingState
ba7bcbd feat(chat): observer-based UI state provider and new initializeWithObserver path
23330de feat(chat): observer hooks + tests; add jest globals and lint overrides
7e77158 refactor(chat): extract SpeechPipeline & StreamController; add logger and TTS edge tests
865095b test(vision): add isolated vision response tests without three.js deps
3f04a5c test(perf): add perf mark/measure and summary tests
5747e6f feat(cleanTalk): collapse whitespace, remove sparkle; test: expanded edge cases
1f44fba test(chat): add registry tests with isolated mocks
1565898 test(chat): add ChatStreamSession and AsyncQueue tests
a5f71bc refactor(chat): modernize architecture (async queues, session abstraction, registries, dynamic TTS + metrics)
9e92b0e feat(debug): add performance metrics aggregation panel
3559690 perf: add extended perf marks for chat stream, stt, and tts playback
5760510 perf: add instrumentation marks and fix lint errors in perf utilities & vrm viewer
1378ca2 perf(vrm): defer viewer setup with requestIdleCallback and remove unused pause/resume
18ab389 perf(bundle): lazy-load EmbeddedWebcam and Moshi components
b96ce9b perf(settings): dynamically import settings subpages to reduce initial bundle
a3a01aa perf(bundle): dynamic import VrmViewer, Settings, DebugPane to reduce initial JS
adfbf98 feat(gui): unify all UI into single GuiLayer portal; restore VrmViewer layering and remove legacy Portal component
72548d6 fix(ui): elevate DebugPane above VRM via Portal and z-max
fa2459c chore(types): replace any with precise DOM event & log types in core settings/debug components
7733982 fix(ui): render introduction overlays in body portal to ensure top layering
cfadb66 fix(ui): ensure welcome overlays sit above VRM (z-max)
ba54115 refactor(ui): elevate welcome screens & remove any types in core components
b985df1 fix(ui): elevate welcome screens above VRM (z-modal fixed overlay)
404fe4a feat(ui): add semantic z-index scale, migrate usages, enforce via custom eslint rule
c69bf82 feat(theme): complete semantic token sweep for settings pages (listboxes, banners, selects, buttons); remove legacy gray/indigo utilities
cf988bf refactor: replace legacy gray/indigo alert, addToHomescreen, chat text, icons, inputs with semantic tokens
9512094 refactor: migrate import & share legacy gray/indigo inputs to semantic input-base and tokens
19bbcf1 refactor: migrate secret/url/range/message inputs and switches to semantic input-base & tokens
812ca5f refactor(theme): introduce info/warning tokens, migrate alerts & debug pane to semantic tokens
ffb67c5 refactor(theme): replace legacy chat header colors with semantic gradients
35f455f feat(theme): auto system theme sync when no explicit preference
5786555 docs(theme): add design tokens & theming guide
854db68 feat(theme): add success & danger button variants, migrate legacy bright buttons, semantic toast
ab96573 feat(theme): introduce semantic theming + dark mode, refactor core UI components
734d32c components: revert vrmViewer.tsx to 0f3b9fa LKG to pair with viewer.ts rollback
797f49b vrmViewer: revert viewer.ts to 0f3b9fa LKG to restore rendering; keep WebGL default
ae48851 Default to WebGL: set use_webgpu="false" to match last-known-good rendering path
9a71cca Fix black screen: robust canvas sizing and aspect handling; safer camera defaults; slight ambient boost; normalize external API URL helpers
e945510 VRM viewer: robust initial load when no current VRM; WebGPU-aware material selection; safer debug console proxy; add dev API config + null-safe external API helpers
cb7a1c4 merge: apply dev white-screen fixes directly to master
269ed82 fix(dev): prevent white screen in Next dev on Firefox
fea3029 fix(app): resolve white screen issue and improve middleware docs
8ac1205 fix(dev): suppress onnxruntime warnings and handle PWA 404s
a23eb0f feat(debug): add robust debug utility + GUI wiring; fix i18n double-init; dev SW unregister; tweak onnxruntime build warning handling; add debug config defaults; add custom 404
e5fad78 fix(next): remove duplicate \_error.jsx to resolve Duplicate page detected
937fe64 chore(lint): fix empty catch by returning fallback in readBoolConfig; complete commit
2f0b0ef chore: satisfy lint in vrmViewer cleanup block
fef743d fix(settings): restore Tailwind theme colors and TextButton classes; correct WebGPU toggle; fix blank 'Load VRM' button styling
250fc0c config: default use_webgpu to auto for WebGPU when supported
0f3b9fa viewer: modernize renderer & XR, preserve adaptive pixel ratio, add dispose(); model: use MToonNodeMaterial for WebGPU (true/auto), controls damping, safer raycasting, tone mapping & color space
603f39a chore(lint): reduce warnings with safe no-op typings and unused param prefixes; type config defaults; tidy API handler payload typing
069afb7 chore(lint): reduce warnings in viewer, API handler, and config types; keep behavior unchanged
fc97eaf chore(eslint): add overrides for d.ts and API routes; simplify Husky hook; keep warnings but reduce noise in specific areas
d8484b2 chore: CI workflow; tooling modernizations (Sentry env DSN, Prettier ignore, EditorConfig, Node 24 in .nvmrc, PWA workbox options, Husky+lint-staged); ESLint plugin wiring
471cc25 perf(viewer): adaptive pixel ratio, pause heavy work when hidden, cache VRM bone nodes; conditional GUI/Stats via debug flag; SSR-safe defaults; dispose BVH on teardown
1493b5c chore(lint): reduce noisy warnings, allow console, tune TS rules; fix speecht5 worker callback; keep Next plugin flat config minimal
074bff5 fix(stats): support legacy stats.js without Panel/addPanel by falling back to no-op panels and guarding update()
4caad42 chore(vrm): replace deprecated VRMUtils.removeUnnecessaryJoints with VRMUtils.combineSkeletons
b8c05f0 fix(vrmViewer): guard stats.js DOM usage to avoid undefined .style access; handle dom/domElement and skip HTMLMesh when unavailable
8926c40 Remove package-lock.json and build artifacts for clean cloning
... (earlier commits prior to base omitted for brevity)

End of Summary

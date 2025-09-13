---
title: Structured Logging & Tracing
order: 6
---

Amica uses a small, environment‑aware structured logger to replace `console.*` in app code.

- Dev: pretty console output with contextual prefixes
- Prod: newline‑delimited JSON (NDJSON) suitable for ingest (Sentry, Cloud logs, etc.)

## Quick start

Import the shared logger and create a contextual child near the module boundary:

```ts
import { logger } from "@/utils/logger";

const log = logger.with({ mod: "chat/session" });

log.info("session start", { id });
log.debug("raw event", evt);
log.warn("slow response", { ms });
log.error("failed", err);
```

Timers map 1:1 to `console.time/console.timeEnd`:

```ts
log.time("fetch");
await doFetch();
log.timeEnd("fetch");
```

## Conventions

- Always create a `logger.with({ mod: '<area>' })` child per file/component.
- Prefer simple string messages + small structured context objects.
- Use levels: `debug` (verbose dev detail), `info` (state changes), `warn` (recoverable issues), `error` (failures).
- Don’t commit `console.*` in app code. ESLint enforces this. Allowed in tests, scripts, and the logger itself.

## Controlling verbosity

- URL: add `?log=debug` to force debug in the browser.
- Local storage: set `LOG_LEVEL=debug`.
- Env vars: `NEXT_PUBLIC_LOG_LEVEL=info` (or `LOG_LEVEL`).

## Error objects

If an Error is passed among the args, stack/message are extracted automatically in prod JSON output:

```ts
try { ... } catch (err) {
  log.error('download failed', err, { url });
}
```

## Why structured logs?

- Greppable, machine‑readable (JSON in prod)
- Stable keys for dashboards and alerts
- Lower noise: centralized level control

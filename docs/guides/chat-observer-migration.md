# Chat Observer Migration & Modern LLM Helpers

This guide explains the ongoing migration of Amica's chat system from multiple setter callbacks to a single observer-driven architecture, plus how to use the new `askLLM` / `askVisionLLM` helpers.

## Why Migrate?

Old pattern:

- Pass 8–9 setter callbacks into `Chat.initialize`.
- UI components manually coordinated state updates.
- Hard to extend (adding a new event required new props everywhere).

New pattern:

- A `ChatObserver` interface with additive optional hooks.
- Central notification fan-out managed by `Chat`.
- Stable event ordering for assistant message streaming.
- React UI can subscribe once via a provider (`ChatUIStateProvider`).

## Deprecations

| Legacy                                                       | Status     | Replacement                                                        |
| ------------------------------------------------------------ | ---------- | ------------------------------------------------------------------ |
| `Chat.initialize(amicaLife, viewer, alert, setChatLog, ...)` | Deprecated | `chat.initializeWithObserver(amicaLife, viewer, alert, observer?)` |
| Direct manual stream handling                                | Deprecated | `chat.makeAndHandleStream(messages)`                               |
| Custom token loop (manual reader.read)                       | Deprecated | `ChatStreamSession` (internal) or `askLLM`                         |
| Manual processing / speaking flags                           | Deprecated | Observer events (`onProcessingChange`, `onSpeakingChange`)         |

A one-time console warning fires when the legacy initialize signature is used.

## Event Hooks

`ChatObserver` (subset shown):

```ts
interface ChatObserver {
  onChatLog?(messages: Message[]): void;
  onUserMessage?(text: string): void;
  onAssistantMessage?(text: string): void; // flushed aggregate
  onAssistantDelta?(delta: string): void; // streaming token/segment
  onAssistantFlush?(full: string): void; // flush cycle complete
  onThoughtMessage?(text: string): void; // reasoning / thinking bubble
  onProcessingChange?(processing: boolean): void;
  onSpeakingChange?(speaking: boolean): void;
  onStateChange?(next: string, prev: string): void;
  onSessionStart?(idx: number): void;
  onSessionEnd?(idx: number, result: "completed" | "aborted"): void;
  onInterrupt?(): void;
}
```

### Assistant Message Ordering

```
(onAssistantDelta)* → onAssistantFlush → onChatLog → onShownMessage
```

Use this to perform cheap incremental rendering during deltas and heavier formatting (e.g. markdown) after a flush.

## Quick Start (React)

```tsx
// _app.tsx already wraps <ChatUIStateProvider chat={chat}> ...
import { useChatUIState } from "@/features/chat/chatUIState";

export function StatusBar() {
  const { processing, speaking, state } = useChatUIState();
  return <div>{processing ? "Thinking…" : speaking ? "Speaking…" : state}</div>;
}
```

Custom observer attachment:

```ts
useEffect(() => {
  const observer: ChatObserver = {
    onAssistantDelta: (d) => (bufferRef.current += d),
    onAssistantFlush: (full) => setRendered(full),
    onProcessingChange: (p) => setBusy(p),
  };
  chat.addObserver(observer);
  return () => chat.removeObserver(observer);
}, [chat]);
```

## LLM Helpers

### askLLM

```ts
// Full pipeline (streaming + TTS + observers)
await askLLM("You are helpful", "Explain quantum tunneling simply", chat);

// Standalone (no TTS / observers)
await askLLM("You are helpful", "Explain quantum tunneling simply", null);
```

### askVisionLLM

```ts
// Obtain vision description then contextual reply; chat optional
await askVisionLLM(base64Jpeg, chat);
```

## Migration Steps

1. Wrap your app with `ChatUIStateProvider` (already done in core app).
2. Remove individual setter prop usages; read state via `useChatUIState()`.
3. Replace manual streaming logic with `askLLM` or `chat.makeAndHandleStream`.
4. Add any new UI reactions using a lightweight `ChatObserver`.
5. Delete legacy initialize calls; adopt `initializeWithObserver`.

## Design Notes

- Observer array kept simple (no priority). If you need ordering, chain inside one observer.
- No backpressure: deltas emitted synchronously; expensive work should be deferred (e.g. via `requestIdleCallback`).
- Stable string states exported via `ChatState` enum for type safety.

## FAQ

**Can I have multiple observers?** Yes—each receives every event; remove when unmounting.

**Will legacy setters be removed?** After a grace period (next minor). They currently just bridge to observer notifications.

**How do I track session latency?** Use `onSessionStart` + `onSessionEnd` or performance marks (`chat:stream:firstToken`, `chat:stream:firstSentence`).

## Next Planned Enhancements

- Batched delta coalescing option.
- Analytics observer example.
- Lint rule to forbid direct usage of deprecated initialize signature.

---

Feel free to open an issue if you need additional hooks or lifecycle signals.

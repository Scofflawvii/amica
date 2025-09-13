import { config, defaults, prefixed } from "@/utils/config";
import isDev from "@/utils/isDev";
import {
  MAX_STORAGE_TOKENS,
  TimestampedPrompt,
} from "../amicaLife/eventHandler";
import { Message } from "../chat/messages";
import { logger } from "@/utils/logger";
const xlog = logger.with({ subsystem: "externalAPI", module: "externalAPI" });

// Build URLs lazily and safely to avoid ReferenceError/TypeError in SSR or
// when NEXT_PUBLIC_DEVELOPMENT_BASE_URL is unset.
function getBaseOrigin(): string | null {
  if (typeof window !== "undefined") return window.location.origin;
  const base = process.env.NEXT_PUBLIC_DEVELOPMENT_BASE_URL ?? "";
  if (/^https?:\/\//i.test(base)) return base;
  return null; // no safe base on server without absolute env
}

function makeApiUrl(type: string): string | null {
  const base = getBaseOrigin();
  if (!base) return null;
  const url = new URL("/api/dataHandler", base);
  url.searchParams.set("type", type);
  return url.toString();
}

export const configUrl = () => makeApiUrl("config");
export const userInputUrl = () => makeApiUrl("userInputMessages");
export const subconsciousUrl = () => makeApiUrl("subconscious");
export const logsUrl = () => makeApiUrl("logs");
export const chatLogsUrl = () => makeApiUrl("chatLogs");

// Cached server config
export let serverConfig: Record<string, string> = {};

export type FetchMethod = "POST" | "GET";
export async function fetcher(
  method: FetchMethod,
  urlStr: string | null,
  data?: unknown,
): Promise<void> {
  if (!urlStr) return; // Nothing to do without a valid absolute URL
  let response: Response | undefined;
  switch (method) {
    case "POST":
      try {
        response = await fetch(urlStr, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (error: unknown) {
        xlog.error("Failed to POST server config", error);
      }
      break;

    case "GET":
      try {
        response = await fetch(urlStr);
        if (response.ok) {
          serverConfig = await response.json();
        }
      } catch (error: unknown) {
        xlog.error("Failed to fetch server config", error);
      }
      break;

    default:
      break;
  }
}

export async function handleConfig(
  type: string,
  data?: Record<string, string>,
) {
  if (!isDev) {
    return;
  }

  switch (type) {
    // Call this function at the beginning of your application to load the server config and sync to localStorage if needed.
    case "init": {
      let localStorageData: Record<string, string> = {};

      for (const key in defaults) {
        const localKey = prefixed(key);
        const value = localStorage.getItem(localKey);

        if (value !== null) {
          localStorageData[key] = value;
        } else {
          // Append missing keys with default values
          const k = key as keyof typeof defaults;
          localStorageData[key] = defaults[k]!;
        }
      }

      // Sync update to server config
      await fetcher("POST", configUrl(), localStorageData);

      break;
    }
    case "fetch": {
      // Sync update to server config cache
      await fetcher("GET", configUrl());

      break;
    }

    case "update": {
      await fetcher("POST", configUrl(), data);

      break;
    }

    default:
      break;
  }
}

export async function handleUserInput(message: string) {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  const url = userInputUrl();
  if (!url) return;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemPrompt: config("system_prompt"),
      message: message,
    }),
  });
}

export async function handleChatLogs(messages: Message[]) {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  const url = chatLogsUrl();
  if (!url) return;
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
}

export async function handleSubconscious(
  timestampedPrompt: TimestampedPrompt,
): Promise<void> {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  const subUrl = subconsciousUrl();
  if (!subUrl) return;
  const data = await fetch(subUrl);
  if (!data.ok) {
    throw new Error("Failed to get subconscious data");
  }

  const currentStoredSubconscious: TimestampedPrompt[] = await data.json();
  currentStoredSubconscious.push(timestampedPrompt);

  let totalStorageTokens = currentStoredSubconscious.reduce(
    (totalTokens, prompt) => totalTokens + prompt.prompt.length,
    0,
  );
  while (totalStorageTokens > MAX_STORAGE_TOKENS) {
    const removed = currentStoredSubconscious.shift();
    totalStorageTokens -= removed!.prompt.length;
  }

  const response = await fetch(subUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subconscious: currentStoredSubconscious }),
  });

  if (!response.ok) {
    throw new Error("Failed to update subconscious data");
  }

  // appended subcon has been persisted; function contract is void
  return;
}

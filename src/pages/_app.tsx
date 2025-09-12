// Initialize i18n only on the client to avoid SSR-time browser dependency issues
import { useEffect } from "react";

import "@/styles/globals.css";
import "@charcoal-ui/icons";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";
import { ViewerContext } from "@/features/vrmViewer/viewerContext";
import { ChatContext } from "@/features/chat/chatContext";
import { AlertContext } from "@/features/alert/alertContext";
import { AmicaLifeContext } from "@/features/amicaLife/amicaLifeContext";
import { Viewer } from "@/features/vrmViewer/viewer";
import { Chat } from "@/features/chat/chat";
import { ChatUIStateProvider } from "@/features/chat/chatUIState";
import { Alert } from "@/features/alert/alert";
import { AmicaLife } from "@/features/amicaLife/amicaLife";

// Create instances for context providers
const viewer = new Viewer();
const chat = new Chat();
const alert = new Alert();
const amicaLife = new AmicaLife();

export default function App({ Component, pageProps }: AppProps) {
  // Client-only i18n init
  useEffect(() => {
    // Dynamic import to ensure browser-only libs are loaded on client
    import("@/i18n").catch(() => {});
  }, []);
  // Patch console methods once to collect logs for DebugPane popout
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as any;
    if (w.__amicaConsolePatched) return;
    w.__amicaConsolePatched = true;
    if (!Array.isArray(w.error_handler_logs)) w.error_handler_logs = [];
    const cap = 5000; // max retained
    type Method = "debug" | "info" | "log" | "warn" | "error";
    const methods: Method[] = ["debug", "info", "log", "warn", "error"];
    const originals: Partial<Record<Method, any>> = {};
    methods.forEach((m) => {
      originals[m] = (console as any)[m];
      (console as any)[m] = (...args: unknown[]) => {
        try {
          const mappedType = m === "log" ? "info" : m; // collapse log->info
          w.error_handler_logs.push({
            ts: Date.now(),
            type: mappedType,
            arguments: args,
          });
          if (w.error_handler_logs.length > cap) {
            w.error_handler_logs.splice(0, w.error_handler_logs.length - cap);
          }
        } catch {
          /* swallow capture errors */
        }
        try {
          originals[m]?.(...args);
        } catch {
          /* ignore original errors */
        }
      };
    });
  }, []);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {process.env.NODE_ENV !== "production" ? (
        // Safely unregister any SW during dev to avoid workbox 404 noise
        <Script src="/debug-sw-unregister.js" strategy="afterInteractive" />
      ) : null}
      <ViewerContext.Provider value={{ viewer }}>
        <ChatContext.Provider value={{ chat }}>
          <ChatUIStateProvider chat={chat}>
            <AlertContext.Provider value={{ alert }}>
              <AmicaLifeContext.Provider value={{ amicaLife }}>
                <Component {...pageProps} />
              </AmicaLifeContext.Provider>
            </AlertContext.Provider>
          </ChatUIStateProvider>
        </ChatContext.Provider>
      </ViewerContext.Provider>
    </>
  );
}

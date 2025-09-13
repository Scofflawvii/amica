import { useEffect, useState } from "react";
import Head from "next/head";
import { DebugPane } from "@/components/debugPane";

// Lightweight popout page that reuses the existing DebugPane in "popout" mode.
// Guard against SSR (DebugPane references window).
export default function DebugPopoutPage() {
  const [client, setClient] = useState(false);
  useEffect(() => setClient(true), []);
  // If opened from main window, mirror its log buffer so existing logs are visible immediately
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.opener) return;
    try {
      const anyOpener = window.opener as unknown as {
        error_handler_logs?: Array<{
          ts: number;
          type: "debug" | "info" | "log" | "warn" | "error";
          arguments: unknown[];
        }>;
      };
      if (Array.isArray(anyOpener.error_handler_logs)) {
        // Point local buffer to opener's array so updates flow through
        (
          window as unknown as {
            error_handler_logs?: typeof anyOpener.error_handler_logs;
          }
        ).error_handler_logs = anyOpener.error_handler_logs;
      }
    } catch {
      /* cross-origin or other issue; ignore */
    }
  }, []);

  return (
    <>
      <Head>
        <title>Debug Popout</title>
        <meta name="robots" content="noindex" />
      </Head>
      <div style={{ height: "100vh", width: "100vw", overflow: "hidden" }}>
        {client && (
          <DebugPane
            mode="popout"
            onClickClose={() => {
              try {
                window.close();
              } catch {
                /* ignore */
              }
            }}
          />
        )}
      </div>
    </>
  );
}

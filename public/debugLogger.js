if (typeof window !== "undefined") {
  if (!window.error_handler_installed) {
    window.error_handler_logs = [];

    const handler = ((old) => ({
      get: (_target, name) => {
        // Preserve symbols and unknown properties without wrapping
        if (typeof name === "symbol") return Reflect.get(old, name);

        const original = old?.[name];

        // If the original property doesn't exist, return undefined
        if (typeof original === "undefined") return undefined;

        // Helper to send logs to the local dev API (only on localhost when enabled)
        const maybeSendLog = (entry) => {
          try {
            const apiEnabled =
              window.localStorage?.getItem("chatvrm_external_api_enabled");
            if (window.location.hostname === "localhost" && apiEnabled === "true") {
              const url = new URL("/api/dataHandler", window.location.origin);
              url.searchParams.set("type", "logs");
              fetch(url.toString(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(entry),
              }).catch(() => {});
            }
          } catch {}
        };

        // Only wrap known logging functions; otherwise bind function or return value
        if (["log", "debug", "info", "warn", "error"].includes(name)) {
          if (typeof original !== "function") return original;
          return function (...args) {
            try {
              const logEntry = { type: name, ts: Date.now(), arguments: args };
              window.error_handler_logs.push(logEntry);
              maybeSendLog(logEntry);
            } catch {}
            try {
              return original.apply(old, args);
            } catch {
              // best-effort fallback
              try {
                return old?.log?.apply(old, args);
              } catch {}
            }
          };
        }

        // For other functions, preserve correct this binding
        if (typeof original === "function") {
          return original.bind(old);
        }

        // Plain properties: forward through
        return original;
      },
    }))(window.console);
    // Proxy the existing console, not an empty object
    window.console = new Proxy(window.console, handler);

    window.addEventListener("error", (e) => {
      try {
        const msg = e?.error ? `${e.error.message} ${e.error.stack}` : String(e.message || e);
        // Use original console via proxy wrapper
        console.error(`Error occurred: ${msg}`);
      } catch {}
      return false;
    });

    window.addEventListener("unhandledrejection", (e) => {
      try {
        console.error(`Unhandled rejection: ${e?.reason?.message || e?.message || e}`);
      } catch {}
      return false;
    });

    window.error_handler_installed = true;
  }
}

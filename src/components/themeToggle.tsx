import { useEffect, useRef, useState } from "react";
import { MoonIcon, SunIcon } from "@heroicons/react/20/solid";
import { TextButton } from "./textButton";

// Simple dark mode toggle persisting preference in localStorage
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // Track whether user explicitly chose a theme; if not, we stay in "system" mode and live-sync.
  const explicitPrefRef = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
      explicitPrefRef.current = true;
    } else if (saved === "light") {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
      explicitPrefRef.current = true;
    } else {
      // system mode (no explicit preference)
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const apply = (val: boolean) => {
        if (val) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        setIsDark(val);
      };
      apply(media.matches);
      const handler = (e: MediaQueryListEvent) => {
        if (!explicitPrefRef.current) apply(e.matches);
      };
      try {
        media.addEventListener("change", handler);
      } catch {
        // Safari <14 fallback
        (
          media as MediaQueryList & {
            addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
          }
        ).addListener?.(handler);
      }
      return () => {
        try {
          media.removeEventListener("change", handler);
        } catch {
          (
            media as MediaQueryList & {
              removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
            }
          ).removeListener?.(handler);
        }
      };
    }
  }, []);

  function toggle() {
    // User explicitly toggled -> lock preference (break out of system auto mode)
    explicitPrefRef.current = true;
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  }

  return (
    <TextButton
      variant="ghost"
      aria-label="Toggle theme"
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 text-sm font-normal">
      {isDark ? (
        <SunIcon className="h-4 w-4" />
      ) : (
        <MoonIcon className="h-4 w-4" />
      )}
      <span className="sr-only">
        {isDark ? "Switch to light theme" : "Switch to dark theme"}
      </span>
    </TextButton>
  );
}

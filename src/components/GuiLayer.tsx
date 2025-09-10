import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// GuiLayer: single top-level GUI mounting root appended to document.body.
// Pointer events default disabled so each child opts in with pointer-events-auto.
export function GuiLayer({ children }: { children: ReactNode }) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  if (!elRef.current && typeof document !== "undefined") {
    const el = document.createElement("div");
    el.className = "amica-gui-layer"; // style hook (could set isolation if needed)
    elRef.current = el;
  }

  useEffect(() => {
    if (!elRef.current) return;
    document.body.appendChild(elRef.current);
    setMounted(true);
    return () => {
      if (elRef.current?.parentNode)
        elRef.current.parentNode.removeChild(elRef.current);
    };
  }, []);

  if (!mounted || !elRef.current) return null;
  return createPortal(children, elRef.current);
}

import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Lightweight client-only portal to append children to document.body.
// Avoids accidental stacking-context issues inside page layout wrappers.
export function Portal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  if (!elRef.current && typeof document !== "undefined") {
    const el = document.createElement("div");
    if (className) el.className = className;
    elRef.current = el;
  }

  useEffect(() => {
    if (!elRef.current || typeof document === "undefined") return;
    document.body.appendChild(elRef.current);
    setMounted(true);
    return () => {
      if (elRef.current && elRef.current.parentNode) {
        elRef.current.parentNode.removeChild(elRef.current);
      }
    };
  }, []);

  if (!mounted || !elRef.current) return null;
  return createPortal(children, elRef.current);
}

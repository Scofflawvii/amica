import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { config } from "@/utils/config";
import { IconButton } from "./iconButton";

export const ThoughtText = ({ message }: { message: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // Remove emotion tags
  const cleanMessage = message.replace(/\[(.*?)\]/g, "");

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });

  return (
    <div
      className={clsx(
        "absolute top-4 right-3 z-40 -translate-y-4 opacity-70 transition-all duration-500 ease-in-out",
      )}
      style={{
        filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
        maxWidth: "280px",
        minWidth: "220px",
      }}>
      <div className="card border-border/40 overflow-hidden border">
        <div className="flex items-center justify-between bg-blue-500/90 px-3 py-1.5 text-xs text-white">
          <span className="font-medium tracking-wide">
            {`${config("name").toUpperCase()} THINKS`}
          </span>
          <IconButton
            iconName="24/FrameSize"
            className="scale-75 rounded-full bg-transparent p-0.5 transition-colors hover:bg-blue-600/80 active:bg-blue-700/80 disabled:bg-transparent"
            isProcessing={false}
            onClick={() => setExpanded(!expanded)}
          />
        </div>
        <div
          className={clsx(
            "text overflow-y-auto px-3 py-2 transition-all duration-300 ease-in-out",
            expanded ? "max-h-48" : "max-h-20",
          )}>
          <p
            className={clsx(
              "text-xs leading-relaxed opacity-90 transition-opacity",
            )}>
            {cleanMessage}
          </p>
          <div ref={scrollRef} />
        </div>
      </div>
    </div>
  );
};

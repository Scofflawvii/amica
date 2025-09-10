import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { config } from "@/utils/config";
import { IconButton } from "./iconButton";

export const AssistantText = ({ message }: { message: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unlimited, setUnlimited] = useState(false);

  // Replace all of the emotion tag in message with ""
  message = message.replace(/\[(.*?)\]/g, "");

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  });

  return (
    <div className="fixed bottom-0 left-0 mb-20 w-full">
      <div className="mx-auto w-full max-w-4xl px-4 md:px-16">
        <div className="rounded-lg backdrop-blur-lg">
          <div className="card">
            <div className="from-primary to-secondary/90 rounded-t-lg bg-gradient-to-r px-8 py-3 pr-1 font-bold tracking-wider text-white">
              <span className="bg-primary/80 rounded-lg rounded-tl-none rounded-tr-none p-4 shadow-sm">
                {config("name").toUpperCase()}
              </span>
              <IconButton
                iconName="24/FrameSize"
                className="float-right bg-transparent hover:bg-transparent active:bg-transparent disabled:bg-transparent"
                isProcessing={false}
                onClick={() => setUnlimited(!unlimited)}
              />
            </div>
            <div
              className={clsx(
                "overflow-y-auto px-8 py-4",
                unlimited ? "max-h-[calc(75vh)]" : "max-h-32",
              )}>
              <div className="typography-16 max-h-full min-h-8 font-bold text-gray-700">
                {message.replace(/\[([a-zA-Z]*?)\]/g, "")}
                <div ref={scrollRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

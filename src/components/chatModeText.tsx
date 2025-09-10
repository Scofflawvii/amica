import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import { config } from "@/utils/config";
import { IconButton } from "./iconButton";
import { useTranslation } from "react-i18next";
import { Message } from "@/features/chat/messages";

export const ChatModeText = ({ messages }: { messages: Message[] }) => {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [messages]);

  return (
    <div className="fixed bottom-0 mb-20 flex h-[90%] w-full flex-col justify-end">
      <div className="flex h-full w-full flex-col-reverse overflow-y-auto">
        <div className="mx-auto flex w-full max-w-full flex-col px-4 md:px-16">
          {messages.map((msg, i) => {
            return (
              <div
                key={i}
                ref={messages.length - 1 === i ? chatScrollRef : null}>
                <Chat
                  role={msg.role}
                  message={(msg.content as string).replace(/\[(.*?)\]/g, "")}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function Chat({ role, message }: { role: string; message: string }) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unlimited, setUnlimited] = useState(false);

  // useEffect(() => {
  //     scrollRef.current?.scrollIntoView({
  //         behavior: "smooth",
  //         block: "center",
  //     });
  // });

  return (
    <div
      className={clsx(
        "mx-auto my-2 max-w-4xl",
        role === "assistant" ? "pr-10 sm:pr-20" : "pl-10 sm:pl-20",
      )}>
      <div className="rounded-lg backdrop-blur-lg">
        <div className="card">
          <div
            className={clsx(
              "rounded-t-lg py-3 pr-1 font-bold tracking-wider text-white",
              role === "assistant"
                ? "from-primary to-secondary/90 bg-gradient-to-r px-8"
                : "from-secondary to-primary/80 bg-gradient-to-r px-8",
            )}>
            <span
              className={clsx(
                "rounded-lg rounded-tl-none rounded-tr-none p-4 shadow-sm",
                role === "assistant" ? "bg-primary/80" : "bg-secondary/80",
              )}>
              {role === "assistant" && config("name").toUpperCase()}
              {role === "user" && t("YOU")}
            </span>

            {role === "assistant" && (
              <IconButton
                iconName="24/FrameSize"
                className="float-right bg-transparent hover:bg-transparent active:bg-transparent disabled:bg-transparent"
                isProcessing={false}
                onClick={() => setUnlimited(!unlimited)}
              />
            )}
          </div>
          {role === "assistant" && (
            <div
              className={clsx(
                "overflow-y-auto px-8 py-4",
                unlimited ? "max-h-32" : "max-h-[calc(75vh)]",
              )}>
              <div className="typography-16 max-h-full min-h-8 font-bold text-gray-600">
                {message.replace(/\[([a-zA-Z]*?)\]/g, "")}
                <div ref={scrollRef} />
              </div>
            </div>
          )}
          {role === "user" && (
            <div className="max-h-32 overflow-y-auto px-8 py-4">
              <div className="typography-16 max-h-full min-h-8 font-bold text-gray-600">
                {message.replace(/\[([a-zA-Z]*?)\]/g, "")}
                <div ref={scrollRef} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";

export const UserText = ({ message }: { message: string }) => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

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
            <div className="from-secondary to-primary/80 rounded-t-lg bg-gradient-to-r px-8 py-3 pr-1 font-bold tracking-wider text-white">
              <span className="bg-secondary/80 rounded-lg rounded-tl-none rounded-tr-none p-4 shadow-sm">
                {t("YOU")}
              </span>
            </div>

            <div className="max-h-32 overflow-y-auto px-8 py-4">
              <div className="typography-16 max-h-full min-h-8 font-bold text-gray-600">
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

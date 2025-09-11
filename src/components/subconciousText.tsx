import { useEffect, useRef } from "react";
import { TimestampedPrompt } from "@/features/amicaLife/eventHandler";
import { useTranslation } from "react-i18next";
import { IconBrain } from "@tabler/icons-react";

export const SubconciousText = ({
  messages,
}: {
  messages: TimestampedPrompt[];
}) => {
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [messages]);

  return (
    <div className="w-col-span-6 fixed h-full max-w-full pb-16">
      <div className="scroll-hidden max-h-full overflow-y-auto px-16 pt-20 pb-4">
        {messages.map((msg, i) => {
          return (
            <div key={i} ref={messages.length - 1 === i ? chatScrollRef : null}>
              <Chat
                timeStamp={msg.timestamp}
                prompt={msg.prompt.replace(/\[(.*?)\]/g, "")}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

function Chat({ timeStamp, prompt }: { timeStamp: string; prompt: string }) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mx-auto my-8 max-w-sm">
      <div className="rounded-lg backdrop-blur-lg">
        <div className="card">
          <div className="from-primary to-secondary/90 top-0 flex items-center justify-between rounded-t-lg bg-gradient-to-r px-8 pr-1 font-bold tracking-wider text-white">
            <div className="flex items-center space-x-6">
              <span className="bg-primary/80 rounded-lg rounded-tl-none rounded-tr-none p-2 shadow-sm">
                <IconBrain
                  className="h-7 w-7 text-xs text-white opacity-100"
                  aria-hidden="true"
                  stroke={2}
                />
              </span>

              <div className="typography-16 text-muted float-right mt-1 ml-2 max-h-full min-h-8 text-sm font-bold">
                {timeStamp}
              </div>
            </div>
          </div>

          <div className="max-h-[calc(75vh)] overflow-y-auto px-8 py-4">
            <div className="typography-16 text-muted max-h-full min-h-8 font-bold">
              {prompt}
              <div ref={scrollRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { clsx } from "clsx";
import { useCallback, useContext, useEffect, useRef } from "react";
import FlexTextarea from "@/components/flexTextarea/flexTextarea";
import { Message } from "@/features/chat/messages";
import { logger } from "@/utils/logger";
import { IconButton } from "@/components/iconButton";
import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { config } from "@/utils/config";
import { ChatContext } from "@/features/chat/chatContext";
import { saveAs } from "file-saver";

export const ChatLog = ({ messages }: { messages: Message[] }) => {
  const { t } = useTranslation();
  const { chat: bot } = useContext(ChatContext);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const handleResumeButtonClick = (num: number, newMessage: string) => {
    bot.setMessageList(messages.slice(0, num));
    bot.receiveMessageFromUser(newMessage, false);
  };

  const txtFileInputRef = useRef<HTMLInputElement>(null);
  const handleClickOpenTxtFile = useCallback(() => {
    txtFileInputRef.current?.click();
  }, []);

  const handleChangeTxtFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const file = files[0];
      if (!file) return;

      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const content = e.target?.result as string;
        const lines = content.split("\n");
        const parsedChat: Message[] = lines.reduce((acc: Message[], line) => {
          const match = line.match(/^(user|assistant)\s*:\s*(.*)$/);
          if (!match) return acc;
          const role = match[1] as Message["role"];
          const content = match[2] ?? ""; // ensure plain string content
          acc.push({ role, content });
          return acc;
        }, []);

        try {
          if (parsedChat.length === 0) {
            logger.error("Please attach the correct file format.");
            return;
          }
          const lastMessage = parsedChat[parsedChat.length - 1];
          if (!lastMessage) {
            logger.error("No last message parsed.");
            return;
          }
          bot.setMessageList(parsedChat.slice(0, -1));
          const content =
            (typeof lastMessage.content === "string"
              ? lastMessage.content
              : lastMessage.content
                  .map((p) => (p.type === "text" ? p.text : p.image_url.url))
                  .join(" ")) || "";
          if (lastMessage.role === "user")
            bot.receiveMessageFromUser(content, false);
          else bot.bubbleMessage(lastMessage.role, content);
        } catch (e) {
          const err = e instanceof Error ? e : new Error(String(e));
          logger.error("chatLog export error", err);
        }
      };

      fileReader.readAsText(file);

      event.target.value = "";
    },
    [bot],
  );

  const exportMessagesToTxt = (messages: Message[]) => {
    const blob = new Blob(
      [
        messages
          .map(
            (msg) =>
              `${msg.role} : ${typeof msg.content === "string" ? msg.content : msg.content.map((p) => (p.type === "text" ? p.text : p.image_url.url)).join(" ")}`,
          )
          .join("\n\n"),
      ],
      { type: "text/plain" },
    );
    saveAs(blob, "chat_log.txt");
  };

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "auto",
      block: "center",
    });
  }, []);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [messages]);

  return (
    <>
      {/* Use semantic z-index: base controls sit on floating layer for prominence above base UI. */}
      <div
        className="z-floating absolute top-4 left-[72px]"
        /* Shifted right to avoid covering sidebar buttons (reserved ~72px gutter) */
      >
        <IconButton
          iconName="24/ReloadLoop"
          label={t("Restart")}
          isProcessing={false}
          className="bg-slate-600 shadow-xl hover:bg-slate-500 active:bg-slate-500"
          onClick={() => {
            bot.setMessageList([]);
          }}></IconButton>
        <IconButton
          iconName="24/UploadAlt"
          label={t("Load Chat")}
          isProcessing={false}
          className="bg-slate-600 shadow-xl hover:bg-slate-500 active:bg-slate-500"
          onClick={handleClickOpenTxtFile}></IconButton>
        <IconButton
          iconName="24/Save"
          label={t("Save")}
          isProcessing={false}
          className="bg-slate-600 shadow-xl hover:bg-slate-500 active:bg-slate-500"
          onClick={() => exportMessagesToTxt(messages)}></IconButton>
      </div>

      <div
        className="w-col-span-6 z-background pointer-events-none fixed h-full max-w-full pb-16 pl-[72px]"
        /* Pointer events disabled across full overlay; inner scroller re-enables to avoid blocking sidebar */
      >
        <div className="scroll-hidden pointer-events-auto max-h-full overflow-y-auto px-16 pt-20 pb-4">
          {messages.map((msg, i) => {
            return (
              <div
                key={i}
                ref={messages.length - 1 === i ? chatScrollRef : null}>
                <Chat
                  role={msg.role}
                  message={(typeof msg.content === "string"
                    ? msg.content
                    : msg.content
                        .map((p) =>
                          p.type === "text" ? p.text : p.image_url.url,
                        )
                        .join(" ")
                  ).replace(/\[(.*?)\]/g, "")}
                  num={i}
                  onClickResumeButton={handleResumeButtonClick}
                />
              </div>
            );
          })}
        </div>
      </div>
      <input
        type="file"
        accept=".txt"
        ref={txtFileInputRef}
        onChange={handleChangeTxtFile}
        className="hidden"
      />
    </>
  );
};

function Chat({
  role,
  message,
  num,
  onClickResumeButton,
}: {
  role: string;
  message: string;
  num: number;
  onClickResumeButton: (num: number, message: string) => void;
}) {
  const { t } = useTranslation();
  // const [textAreaValue, setTextAreaValue] = useState(message);

  const onClickButton = () => {
    const newMessage = message;
    onClickResumeButton(num, newMessage);
  };

  return (
    <div
      className={clsx(
        "mx-auto my-8 max-w-sm",
        role === "assistant" ? "pr-10 sm:pr-20" : "pl-10 sm:pl-20",
      )}>
      <div
        className={clsx(
          "flex justify-between rounded-t-lg px-8 py-2 font-bold tracking-wider text-white shadow-inner backdrop-blur-lg",
          role === "assistant"
            ? "from-primary to-secondary/90 bg-gradient-to-r"
            : "from-secondary to-primary/80 bg-gradient-to-r",
        )}>
        <div className="text-bold">
          {role === "assistant" && config("name").toUpperCase()}
          {role === "user" && t("YOU")}
        </div>
        <button className="text-right" onClick={onClickButton}>
          {role === "user" && (
            <div className="ml-16 rounded-full p-1">
              <ArrowPathIcon
                className="h-5 w-5 text-white hover:animate-spin"
                aria-hidden="true"
              />
            </div>
          )}
        </button>
      </div>
      <div className="card rounded-b-lg px-4 py-2">
        <div className="typography-16 font-M_PLUS_2 text font-bold">
          {role === "assistant" ? (
            <div>{message}</div>
          ) : (
            <FlexTextarea
              value={message}
              // onChange={setTextAreaValue}
            />
          )}
        </div>
      </div>
    </div>
  );
}

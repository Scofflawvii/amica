import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Chat } from "./chat";
import { Message, Role } from "./messages";
import { ChatObserver, ChatStateString } from "./chatObserver";

export interface ChatUIState {
  chatLog: Message[];
  userMessage: string;
  assistantMessage: string;
  thoughtMessage: string;
  shownMessage: Role;
  processing: boolean;
  speaking: boolean;
  // raw state for consumers wanting fine-grained updates
  state: string;
  // helpers
  reset(): void;
}

const ChatUIStateContext = createContext<ChatUIState | null>(null);
export const useChatUIState = () => {
  const ctx = useContext(ChatUIStateContext);
  if (!ctx) throw new Error("ChatUIStateContext missing provider");
  return ctx;
};

interface ProviderProps {
  chat: Chat;
  children: React.ReactNode;
}

export const ChatUIStateProvider: React.FC<ProviderProps> = ({
  chat,
  children,
}) => {
  const [chatLog, setChatLog] = useState<Message[]>([]);
  const [userMessage, setUserMessage] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [thoughtMessage, setThoughtMessage] = useState("");
  const [shownMessage, setShownMessage] = useState<Role>("system");
  const [processing, setProcessing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [state, setState] = useState<ChatStateString | string>(
    chat.getState() as ChatStateString | string,
  );

  // stable refs to avoid re-subscribing
  const observerRef = useRef<ChatObserver | null>(null);
  if (!observerRef.current) {
    observerRef.current = {
      onChatLog: (m) => setChatLog(m),
      onUserMessage: (m) => setUserMessage(m),
      onAssistantMessage: (m) => setAssistantMessage(m),
      onThoughtMessage: (m) => setThoughtMessage(m),
      onShownMessage: (r) => setShownMessage(r),
      onProcessingChange: (p) => setProcessing(p),
      onSpeakingChange: (s) => setSpeaking(s),
      onStateChange: (next) => setState(next),
    };
  }

  useEffect(() => {
    chat.addObserver(observerRef.current!);
    return () => {
      if (observerRef.current) chat.removeObserver(observerRef.current);
    };
  }, [chat]);

  const value = useMemo<ChatUIState>(
    () => ({
      chatLog,
      userMessage,
      assistantMessage,
      thoughtMessage,
      shownMessage,
      processing,
      speaking,
      state,
      reset() {
        setChatLog([]);
        setUserMessage("");
        setAssistantMessage("");
        setThoughtMessage("");
        setShownMessage("system");
      },
    }),
    [
      chatLog,
      userMessage,
      assistantMessage,
      thoughtMessage,
      shownMessage,
      processing,
      speaking,
      state,
    ],
  );

  return (
    <ChatUIStateContext.Provider value={value}>
      {children}
    </ChatUIStateContext.Provider>
  );
};

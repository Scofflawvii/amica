/**
 * Unified lightweight LLM helper utilities.
 *
 * askLLM:
 *  - If provided a Chat instance, delegates fully to the Chat streaming pipeline
 *    (observer notifications, audio TTS, metrics).
 *  - If chat is null, performs a standalone streaming session using ChatStreamSession
 *    for consistent token->sentence parsing but without audio generation.
 *
 * askVisionLLM:
 *  - Obtains a textual description of an image via configured vision backend, then
 *    funnels that description back through askLLM for normal processing.
 */
import { Message } from "@/features/chat/messages";
import { Chat } from "@/features/chat/chat";
import { ChatStreamSession } from "@/features/chat/chatSession";
import { getEchoChatResponseStream } from "@/features/chat/echoChat";
import { getOpenAiChatResponseStream } from "@/features/chat/openAiChat";
import {
  getLlamaCppChatResponseStream,
  getLlavaCppChatResponse,
} from "@/features/chat/llamaCppChat";
import { getWindowAiChatResponseStream } from "@/features/chat/windowAiChat";
import {
  getOllamaChatResponseStream,
  getOllamaVisionChatResponse,
} from "@/features/chat/ollamaChat";
import { getKoboldAiChatResponseStream } from "@/features/chat/koboldAiChat";
import { config } from "@/utils/config";

// Function to ask llm with custom system prompt, if doesn't want it to speak provide the chat in params as null.
/**
 * Ask the language model with an explicit system + user prompt.
 *
 * @param systemPrompt System role instructions.
 * @param userPrompt   User content / query.
 * @param chat         Active Chat instance (full pipeline) or null (standalone).
 * @returns Final assistant text (concatenated sentences) without leading emotion tags trimmed.
 */
export async function askLLM(
  systemPrompt: string,
  userPrompt: string,
  chat: Chat | null,
): Promise<string> {
  const messages: Message[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // If a Chat instance is provided, delegate to its pipeline for consistency.
  if (chat) {
    return (await chat.makeAndHandleStream(messages)) as string;
  }

  // Standalone path: create a raw stream and process via ChatStreamSession to reuse token -> sentence parsing.
  const backend = config("chatbot_backend");
  let stream: ReadableStream<Uint8Array>;
  switch (backend) {
    case "chatgpt":
      stream = await getOpenAiChatResponseStream(messages);
      break;
    case "llamacpp":
      stream = await getLlamaCppChatResponseStream(messages);
      break;
    case "windowai":
      stream = await getWindowAiChatResponseStream(messages);
      break;
    case "ollama":
      stream = await getOllamaChatResponseStream(messages);
      break;
    case "koboldai":
      stream = await getKoboldAiChatResponseStream(messages);
      break;
    default:
      stream = await getEchoChatResponseStream(messages);
  }

  // Minimal session emulation.
  let currentIdx = 1;
  const session = new ChatStreamSession(currentIdx, stream, {
    enqueueScreenplay: () => {}, // no audio generation in standalone mode
    thought: () => {},
    appendError: () => {},
    isCurrent: (i) => i === currentIdx,
    setProcessingState: () => {},
  });
  return await session.process();
}

/**
 * Multimodal vision helper: converts image -> textual description -> contextual follow-up query.
 * Falls back gracefully if backend unsupported.
 */
export async function askVisionLLM(
  imageData: string,
  chat?: Chat | null,
): Promise<string> {
  try {
    const visionBackend = config("vision_backend");

    console.debug("vision_backend", visionBackend);

    const messages: Message[] = [
      { role: "system", content: config("vision_system_prompt") },
      {
        role: "user",
        content: "Describe the image as accurately as possible",
      },
    ];

    let res = "";
    if (visionBackend === "vision_llamacpp") {
      res = await getLlavaCppChatResponse(messages, imageData);
    } else if (visionBackend === "vision_ollama") {
      res = await getOllamaVisionChatResponse(messages, imageData);
    } else {
      console.warn("vision_backend not supported", visionBackend);
      return "vision_backend not supported";
    }

    let content = `This is a picture I just took from my webcam (described between [[ and ]] ): [[${res}]] Please respond accordingly and as if it were just sent and as though you can see it.`;
    const result = await askLLM(config("system_prompt"), content, chat ?? null);

    return result;
  } catch (e: any) {
    console.error("getVisionResponse", e.toString());
    // alert?.error("Failed to get vision response", e.toString());
    return "Failed to get vision response";
  }
}

export default askLLM;

import { Message } from "./messages";
import { Output } from "window.ai";
import { config } from "@/utils/config";

export async function getWindowAiChatResponseStream(messages: Message[]) {
  // Window.ai expects plain text messages; flatten multimodal content
  const flattened = messages.map((m) => ({
    role: m.role,
    content:
      typeof m.content === "string"
        ? m.content
        : m.content
            .map((p) => (p.type === "text" ? p.text : p.image_url.url))
            .join(" "),
  }));
  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      try {
        const [response]: Output[] = await window.ai.generateText(
          {
            messages: flattened as any,
          },
          {
            maxTokens: 400,
            temperature: 0.7,
            stopSequences: ["</s>", `${config("name")}:`, "User:"],
            onStreamResult: (
              res: Output | null,
              error: string | null,
            ): void => {
              if (res === null) {
                throw new Error("null result from window.ai");
              }

              if (error) {
                throw new Error(error);
              }

              const piece = (res as any).text || (res as any).message?.content;
              if (piece) {
                controller.enqueue(piece);
              }

              return;
            },
          },
        );
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}

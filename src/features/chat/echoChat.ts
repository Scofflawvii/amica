import { Message } from "./messages";

export async function getEchoChatResponseStream(messages: Message[]) {
  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      try {
        const last = messages[messages.length - 1];
        let lastMessage = (last?.content ?? "").toString();
        const lastChar =
          lastMessage.length > 0 ? lastMessage[lastMessage.length - 1] : " ";
        if (lastChar !== "." && lastChar !== "?" && lastChar !== "!") {
          lastMessage += ".";
        }

        lastMessage
          .split(" ")
          .map((word) => word + " ")
          .forEach((word) => {
            controller.enqueue(word);
          });
      } catch (error) {
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}

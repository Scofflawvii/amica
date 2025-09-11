import { handleNews } from "../plugins/news";
import { logger } from "@/utils/logger";

export async function expandPrompt(prompt: string, values: any) {
  for (const key in values) {
    prompt = prompt.replace(`{${key}}`, values[key]);
  }
  return prompt;
}

export async function handleFunctionCalling(event: string) {
  switch (event) {
    case "news": {
      const newsSummary = await handleNews();
      return newsSummary;
    }

    default:
      logger.debug("Unknown function-calling event", { event });
  }
}

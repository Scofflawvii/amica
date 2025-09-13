import { askLLM } from "@/utils/askLlm";
import { config } from "@/utils/config";
import { handleSocialMediaActions } from "@/features/externalAPI/utils/socialMediaHandler";
import { sendToClients } from "@/features/externalAPI/utils/apiHelper";

type SocialMedia = "twitter" | "tg" | "none";

export interface TriggerPayload {
  text?: string;
  socialMedia?: SocialMedia;
  playback?: boolean;
  reprocess?: boolean;
  // Pass-through payload to animation channel; shape not enforced here
  animation?: unknown;
}

export const processNormalChat = async (message: string): Promise<string> => {
  return await askLLM(config("system_prompt"), message, null);
};
export const triggerAmicaActions = async (
  payload: TriggerPayload,
): Promise<void> => {
  const {
    text,
    socialMedia = "none",
    playback = false,
    reprocess = false,
    animation,
  } = payload ?? {};

  if (typeof text === "string" && text.length > 0) {
    const message = reprocess
      ? await askLLM(config("system_prompt"), text, null)
      : text;
    await handleSocialMediaActions(message, socialMedia);
  }

  if (playback === true) {
    sendToClients({ type: "playback", data: 10000 });
  }

  if (typeof animation !== "undefined") {
    sendToClients({ type: "animation", data: animation });
  }
};

export interface UpdateSystemPromptPayload {
  prompt: string;
}

export const updateSystemPrompt = async (
  payload: UpdateSystemPromptPayload,
): Promise<void> => {
  const { prompt } = payload;
  sendToClients({ type: "systemPrompt", data: prompt });
};

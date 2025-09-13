import { twitterClientInstance as twitterClient } from "../socialMedia/twitterClient";
import { telegramClientInstance as telegramClient } from "../socialMedia/telegramClient";
import { sendToClients } from "./apiHelper";

export type SocialMedia = "twitter" | "tg" | "none";

export const handleSocialMediaActions = async (
  message: string,
  socialMedia: SocialMedia,
): Promise<string | void> => {
  switch (socialMedia) {
    case "twitter":
      await twitterClient.postTweet(message);
      return "Tweet posted";
    case "tg":
      await telegramClient.postMessage(message);
      return "Telegram message sent";
    case "none":
      sendToClients({ type: "normal", data: message });
      return "Broadcasted to clients";
    default:
      throw new Error("No action taken for social media.");
  }
};

import type { NextApiRequest, NextApiResponse } from "next";
import { logger } from "@/utils/logger";

import { config } from "@/utils/config";
import {
  handleConfig,
  handleSubconscious,
} from "@/features/externalAPI/externalAPI";

import {
  generateSessionId,
  sendError,
  ApiLogEntry,
  ApiResponse,
} from "@/features/externalAPI/utils/apiHelper";
import {
  requestMemory,
  requestLogs,
  requestUserInputMessages,
  requestChatHistory,
} from "@/features/externalAPI/utils/requestHandler";
import {
  processNormalChat,
  triggerAmicaActions,
  updateSystemPrompt,
  type TriggerPayload,
  type UpdateSystemPromptPayload,
} from "@/features/externalAPI/processors/chatProcessor";
import type { TimestampedPrompt } from "@/features/amicaLife/eventHandler";

export const apiLogs: ApiLogEntry[] = [];
export const sseClients: Array<{ res: NextApiResponse }> = [];

// Main Amica Handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  // Syncing config to be accessible from server side
  await handleConfig("fetch");

  if (req.method === "GET") {
    handleSSEConnection(req, res);
    return;
  }

  if (config("external_api_enabled") !== "true") {
    return sendError(res, "", "API is currently disabled.", 503);
  }

  const { sessionId, inputType, payload } = req.body as {
    sessionId?: string;
    inputType?: string;
    payload?: unknown;
  };
  const currentSessionId = generateSessionId(sessionId);
  const timestamp = new Date().toISOString();

  if (!inputType) {
    return sendError(res, currentSessionId, "inputType are required.");
  }

  try {
    const { response, outputType } = await processRequest(inputType, payload);
    apiLogs.push({
      sessionId: currentSessionId,
      timestamp,
      inputType,
      outputType,
      response,
    });
    res.status(200).json({ sessionId: currentSessionId, outputType, response });
  } catch (error) {
    apiLogs.push({
      sessionId: sessionId ?? currentSessionId,
      timestamp,
      inputType,
      outputType: "Error",
      error: String(error),
    });
    sendError(res, currentSessionId, String(error), 500);
  }
}

const processRequest = async (inputType: string, payload: unknown) => {
  switch (inputType) {
    case "Normal Chat Message":
      return {
        response: await processNormalChat(String(payload ?? "")),
        outputType: "Chat",
      };
    case "Memory Request":
      return { response: await requestMemory(), outputType: "Memory" };
    case "RPC Logs":
      return { response: await requestLogs(), outputType: "Logs" };
    case "RPC User Input Messages":
      return {
        response: await requestUserInputMessages(),
        outputType: "User Input",
      };
    case "Update System Prompt":
      return {
        response: await updateSystemPrompt(
          (payload as UpdateSystemPromptPayload) ?? { prompt: "" },
        ),
        outputType: "Updated system prompt",
      };
    case "Brain Message":
      return {
        response: await handleSubconscious(
          payload as TimestampedPrompt as TimestampedPrompt,
        ),
        outputType: "Added subconscious stored prompt",
      };
    case "Chat History":
      return {
        response: await requestChatHistory(),
        outputType: "Chat History",
      };
    case "Reasoning Server":
      return {
        response: await triggerAmicaActions((payload as TriggerPayload) ?? {}),
        outputType: "Actions",
      };
    default:
      throw new Error("Invalid input type");
  }
};

// Sub-functions
const handleSSEConnection = (
  _req: NextApiRequest,
  res: NextApiResponse,
): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Connection", "keep-alive");

  const client = { res };
  sseClients.push(client);

  _req.on("close", () => {
    logger.debug("SSE client disconnected");
    sseClients.splice(sseClients.indexOf(client), 1);
    res.end();
  });
};

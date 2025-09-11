import { NextApiRequest, NextApiResponse } from "next";

import { TimestampedPrompt } from "@/features/amicaLife/eventHandler";
import { config as configs } from "@/utils/config";
import { apiLogs } from "./amicaHandler";

import { handleConfig } from "@/features/externalAPI/externalAPI";
import {
  ApiResponse,
  generateSessionId,
  sendError,
} from "@/features/externalAPI/utils/apiHelper";
import { transcribeVoice } from "@/features/externalAPI/processors/voiceProcessor";
import { processImage } from "@/features/externalAPI/processors/imageProcessor";

import {
  parseMultipart,
  getMultipartBoundary,
  FormidablePart,
} from "formidable";

// Configure body parsing: disable only for multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

// Main API handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  // Syncing config to be accessible from server side
  await handleConfig("fetch");

  if (configs("external_api_enabled") !== "true") {
    return sendError(res, "", "API is currently disabled.", 503);
  }

  const currentSessionId = generateSessionId();
  const timestamp = new Date().toISOString();

  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    try {
      // Handle form-data using new formidable v4 API
      const contentType = req.headers["content-type"] || "";
      const boundary = getMultipartBoundary(contentType);

      if (!boundary) {
        return sendError(
          res,
          currentSessionId,
          "Invalid Content-Type: missing boundary",
        );
      }

      const fields: Record<string, string[]> = {};
      const files: Record<string, FormidablePart[]> = {};

      await parseMultipart(req, { boundary }, async (part: FormidablePart) => {
        if (part.isFile()) {
          if (!files[part.name]) files[part.name] = [];
          files[part.name]!.push(part);
        } else {
          if (!fields[part.name]) fields[part.name] = [];
          const value = await part.text();
          fields[part.name]!.push(value);
        }
      });

      await handleRequest(currentSessionId, timestamp, fields, files, res);
    } catch (error) {
      console.error("Form parsing error:", error);
      return sendError(res, currentSessionId, "Failed to parse form data.");
    }
  } else {
    return sendError(res, currentSessionId, "Incorrect type");
  }
}

async function handleRequest(
  sessionId: string,
  timestamp: string,
  fields: Record<string, string[]>,
  files: Record<string, FormidablePart[]>,
  res: NextApiResponse<ApiResponse>,
) {
  let response: string | undefined | TimestampedPrompt[];
  let outputType: string | undefined;

  const inputType = fields?.inputType?.[0] || null;
  const payload = files?.payload?.[0] || null;

  if (!inputType) {
    throw new Error("Missing or invalid inputType field.");
  }

  if (!payload) {
    throw new Error("Payload file is missing.");
  }

  try {
    switch (inputType) {
      case "Voice":
        if (payload) {
          // Get the file data as ArrayBuffer from FormidablePart
          const fileBuffer = await payload.arrayBuffer();
          const audioFile = new File(
            [fileBuffer],
            payload.filename || "input.wav",
            {
              type: payload.type || "audio/wav",
            },
          );
          response = await transcribeVoice(audioFile);
          outputType = "Text";
        } else {
          throw new Error("Voice input file missing.");
        }
        break;

      case "Image":
        if (payload) {
          // Get the file data as ArrayBuffer from FormidablePart
          const imageBuffer = await payload.arrayBuffer();
          const buffer = Buffer.from(imageBuffer);
          response = await processImage(buffer);
          outputType = "Text";
        } else {
          throw new Error("Image input file missing.");
        }
        break;

      default:
        return sendError(res, sessionId, "Unknown input type.");
    }

    apiLogs.push({
      sessionId: sessionId,
      timestamp,
      inputType,
      outputType,
      response,
    });
    res.status(200).json({ sessionId, outputType, response });
  } catch (error) {
    apiLogs.push({
      sessionId: sessionId,
      timestamp,
      inputType,
      outputType: "Error",
      error: String(error),
    });
    sendError(res, sessionId, String(error), 500);
  }
}

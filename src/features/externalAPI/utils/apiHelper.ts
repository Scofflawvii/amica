import { randomBytes } from "crypto";
import type { NextApiResponse } from "next";
import fs from "fs";
import { logger } from "@/utils/logger";
const xlog = logger.with({ subsystem: "externalAPI", module: "apiHelper" });
import { sseClients } from "@/pages/api/amicaHandler";

export interface ApiResponse<T = unknown> {
  sessionId?: string;
  outputType?: string;
  response?: T;
  error?: string;
}

export interface ApiLogEntry<T = unknown> {
  sessionId: string;
  timestamp: string;
  inputType: string;
  outputType: string;
  response?: T;
  error?: string;
}

export const generateSessionId = (sessionId?: string): string =>
  sessionId || randomBytes(8).toString("hex");

export const sendError = (
  res: NextApiResponse,
  sessionId: string,
  message: string,
  status = 400,
) => res.status(status).json({ sessionId, error: message });

export interface SSEMessage<T = unknown> {
  type: string;
  data: T;
}
export const sendToClients = <T>(message: SSEMessage<T>) => {
  const formattedMessage = JSON.stringify(message);
  sseClients.forEach((client) =>
    client.res.write(`data: ${formattedMessage}\n\n`),
  );
};

export const readFile = (filePath: string): unknown => {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    xlog.error(`Error reading file at ${filePath}`, error);
    throw new Error(`Failed to read file: ${error}`);
  }
};

export const writeFile = (filePath: string, content: unknown): void => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), "utf8");
  } catch (error) {
    xlog.error(`Error writing file at ${filePath}`, error);
    throw new Error(`Failed to write file: ${error}`);
  }
};

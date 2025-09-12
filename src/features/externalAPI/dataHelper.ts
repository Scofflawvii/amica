import isDev from "@/utils/isDev";
import { readFile, writeFile } from "./utils/apiHelper";
import path from "path";
import { config } from "@/utils/config";

// Define file paths
export const configFilePath = path.resolve(
  "src/features/externalAPI/dataHandlerStorage/config.json",
);
export const subconsciousFilePath = path.resolve(
  "src/features/externalAPI/dataHandlerStorage/subconscious.json",
);
export const logsFilePath = path.resolve(
  "src/features/externalAPI/dataHandlerStorage/logs.json",
);
export const userInputMessagesFilePath = path.resolve(
  "src/features/externalAPI/dataHandlerStorage/userInputMessages.json",
);
export const chatLogsFilePath = path.resolve(
  "src/features/externalAPI/dataHandlerStorage/chatLogs.json",
);

// GET Request Handlers
export const handleGetConfig = () => readFile(configFilePath);
export const handleGetSubconscious = () => readFile(subconsciousFilePath);
export const handleGetLogs = () => readFile(logsFilePath);
export const handleGetUserInputMessages = () =>
  readFile(userInputMessagesFilePath);
export const handleGetChatLogs = () => readFile(chatLogsFilePath);

// Domain types
export interface ConfigMap {
  [key: string]: string;
}
export interface UpdateConfigBody {
  key?: string;
  value?: string;
} // single key update
export type UpdateConfigPayload = UpdateConfigBody | ConfigMap;

export interface SubconsciousBody {
  subconscious: string[];
}
export interface UserInputMessage {
  message: string;
  ts?: number;
}
export interface LogBody {
  type: string;
  ts: number;
  arguments: unknown[];
}
export type ChatLogEntry = { role: string; content: string; ts?: number };

// POST Request Handlers (typed)
export const handlePostConfig = (body: UpdateConfigPayload) =>
  updateConfig(body);
export const handlePostSubconscious = (body: SubconsciousBody) =>
  updateSubconscious(body);
export const handlePostUserInputMessages = (body: UserInputMessage) =>
  updateUserInputMessages(body);
export const handlePostLogs = (body: LogBody) => updateLogs(body);
export const handlePostChatLogs = (body: ChatLogEntry[]) =>
  updateChatLogs(body);

// Update Functions
const updateConfig = (body: UpdateConfigPayload) => {
  const current = (readFile(configFilePath) as ConfigMap) || {};
  if (
    typeof body === "object" &&
    body !== null &&
    "key" in body &&
    Object.prototype.hasOwnProperty.call(body, "value")
  ) {
    const { key, value } = body as UpdateConfigBody & { value: string };
    if (typeof key !== "string") {
      throw new Error("Config key must be a string.");
    }
    if (!Object.prototype.hasOwnProperty.call(current, key)) {
      throw new Error(`Config key "${key}" not found.`);
    }
    current[key] = value;
    writeFile(configFilePath, current);
    return { message: "Config updated successfully." };
  }
  // treat as bulk map update
  for (const [k, v] of Object.entries(body as ConfigMap)) {
    current[k] = v;
  }
  writeFile(configFilePath, current);
  return { message: "Config updated successfully." };
};

const updateSubconscious = (body: SubconsciousBody) => {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  if (!Array.isArray(body.subconscious)) {
    throw new Error("Subconscious data must be an array.");
  }
  writeFile(subconsciousFilePath, body.subconscious);
  return { message: "Subconscious data updated successfully." };
};

const updateUserInputMessages = (body: UserInputMessage) => {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  const existing = readFile(userInputMessagesFilePath);
  const arr: UserInputMessage[] = Array.isArray(existing)
    ? (existing as UserInputMessage[])
    : [];
  arr.push(body);
  writeFile(userInputMessagesFilePath, arr);
  return { message: "User input messages updated successfully." };
};

const updateLogs = (body: LogBody) => {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  const { type, ts, arguments: logArguments } = body;
  const logEntry = { type, ts, arguments: logArguments };
  const existing = readFile(logsFilePath);
  const logs: LogBody[] = Array.isArray(existing)
    ? (existing as LogBody[])
    : [];
  logs.push(logEntry as unknown as LogBody);
  writeFile(logsFilePath, logs);
  return { message: "Logs updated successfully." };
};

const updateChatLogs = (body: ChatLogEntry[]) => {
  if (!isDev || config("external_api_enabled") !== "true") {
    return;
  }

  if (!Array.isArray(body)) {
    throw new Error("Chat logs data must be an array.");
  }
  writeFile(chatLogsFilePath, body);
  return { message: "Chat logs data updated successfully." };
};

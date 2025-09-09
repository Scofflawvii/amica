import {
  subconsciousUrl,
  userInputUrl,
  logsUrl,
  chatLogsUrl,
} from "@/features/externalAPI/externalAPI";

function normalizeUrl(u: string | null | undefined): string | null {
  return u ?? null;
}

export const requestMemory = async () => {
  const url = normalizeUrl(subconsciousUrl());
  if (!url) return [] as any[];
  const response = await fetch(url);
  return response.json();
};

export const requestLogs = async () => {
  const url = normalizeUrl(logsUrl());
  if (!url) return [] as any[];
  const response = await fetch(url);
  return response.json();
};

export const requestUserInputMessages = async () => {
  const url = normalizeUrl(userInputUrl());
  if (!url) return [] as any[];
  const response = await fetch(url);
  return response.json();
};

export const requestChatHistory = async () => {
  const url = normalizeUrl(chatLogsUrl());
  if (!url) return [] as any[];
  const response = await fetch(url);
  return response.json();
};

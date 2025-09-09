import {
  subconsciousUrl,
  userInputUrl,
  logsUrl,
  chatLogsUrl,
} from "@/features/externalAPI/externalAPI";

export const requestMemory = async () => {
  const url = subconsciousUrl();
  if (!url) return [];
  const response = await fetch(url);
  return response.json();
};

export const requestLogs = async () => {
  const url = logsUrl();
  if (!url) return [];
  const response = await fetch(url);
  return response.json();
};

export const requestUserInputMessages = async () => {
  const url = userInputUrl();
  if (!url) return [];
  const response = await fetch(url);
  return response.json();
};

export const requestChatHistory = async () => {
  const url = chatLogsUrl();
  if (!url) return [];
  const response = await fetch(url);
  return response.json();
};

import { expandPrompt } from "../functionCalling/eventHandler";
import { logger } from "@/utils/logger";
const nlog = logger.with({ subsystem: "plugins", module: "news" });

const prompt = `You are a newscaster specializing in providing news. Use the following context from The New York Times News to commented on. [{context_str}]`;

export async function handleNews(): Promise<string> {
  try {
    const response = await fetch(
      "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const text = await response.text();
    const items = text.split("<item>").slice(1); // Split and remove the first non-item part
    const fullNews = getRandomArticle(items);

    const result = await expandPrompt(prompt, { context_str: fullNews });

    console.log("News function calling result: ", fullNews);
    return result;
  } catch (error) {
    nlog.error("Error in handleNews", error);
    return "An error occurred while fetching and processing the news.";
  }
}

function getRandomArticle(items: string[]) {
  const randomItem = items[Math.floor(Math.random() * items.length)] ?? "";

  const extractContent = (item: string, tag: string) => {
    const open = `<${tag}>`;
    const close = `</${tag}>`;
    const startIdx = item.indexOf(open);
    if (startIdx === -1) return "";
    const start = startIdx + open.length;
    const end = item.indexOf(close, start);
    if (end === -1) return "";
    return item.substring(start, end);
  };

  const title = extractContent(randomItem, "title");
  const description = extractContent(randomItem, "description");
  return `${title}: ${description}`;
}

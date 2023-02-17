import { z } from "zod";
import getNodeEnv from "samepage/internal/getNodeEnv";
import { Client as NotionClient } from "@notionhq/client";
import { AppData } from "./utils/types";

const getApiUrl = () => {
  const env = getNodeEnv();
  const defaultUrl =
    env === "development" || env === "test"
      ? "http://localhost:3003"
      : "https://api.samepage.network";
  try {
    return process.env.API_URL || defaultUrl;
  } catch {
    return defaultUrl;
  }
};

const notion = new NotionClient({
  auth: process.env.NOTION_INTEGRATION_TOKEN,
  fetch: (url, info) => {
    return fetch(`${getApiUrl()}/proxy`, {
      method: "POST",
      body: JSON.stringify({
        url,
        ...info,
      }),
      headers: { "Content-Type": "application/json" },
    });
  },
});

const SUPPORTED_APPS = [
  {
    test: /notion\.so/,
    // TODO: will probably want to pass in token here in the future
    transform: async (_: string): Promise<AppData> => {
      const response = await notion.users.me({}).catch(() => false as const);
      return (
        response &&
        response.type === "bot" &&
        !!response.bot.workspace_name && {
          app: "Notion" as const,
          workspace: response.bot.workspace_name,
        }
      );
    },
  },
];

const zMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SETUP"), data: z.object({ href: z.string() }) }),
  z.object({ type: z.literal("GET"), data: z.object({}) }),
]);

let globalAppData: AppData = false;

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  const { type, data } = zMessage.parse(msg);
  switch (type) {
    case "SETUP": {
      const appInfo = SUPPORTED_APPS.find((a) => a.test.test(data.href));
      if (appInfo) {
        appInfo.transform(data.href).then((appData) => {
          console.log("transformers", appData);
          globalAppData = appData;
          sendResponse(appData);
          chrome.action.setBadgeText({
            text: appData ? "ON" : "OFF",
          });
        });
      } else {
        globalAppData = false;
        sendResponse(false);
        chrome.action.setBadgeText({
          text: "OFF",
        });
      }
      break;
    }
    case "GET": {
      sendResponse(globalAppData);
      break;
    }
  }
  // this return true allows for async sendResponse.
  return true;
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});
export {};

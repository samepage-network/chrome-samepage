import { z } from "zod";

const SUPPORTED_APPS = [
  {
    test: /notion\.so/,
    transform: async (href: string) => {
      const id = /notion\.so\/(.+)+$/.exec(href)?.[1];
      // TODO - use Notion API to get workspace from id
      return {
        app: "Notion",
        workspace: id,
      };
    },
  },
];

const zMessage = z.discriminatedUnion("type", [
  z.object({ type: z.literal("SETUP"), data: z.object({ href: z.string() }) }),
  z.object({ type: z.literal("TODO"), data: z.object({ href: z.string() }) }),
]);

chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
  const { type, data } = zMessage.parse(msg);
  switch (type) {
    case "SETUP": {
      const appInfo = SUPPORTED_APPS.find((a) => a.test.test(data.href));
      if (appInfo) {
        appInfo.transform(data.href).then((appData) => {
          sendResponse(appData);
          chrome.action.setBadgeText({
            text: "ON",
          });
        });
      } else {
        sendResponse(false);
        chrome.action.setBadgeText({
          text: "OFF",
        });
      }
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

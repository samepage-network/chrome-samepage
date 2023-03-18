chrome.runtime.onMessage.addListener((_msg, _, _sendResponse) => {
  // this return true allows for async sendResponse.
  return true;
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});
export {};

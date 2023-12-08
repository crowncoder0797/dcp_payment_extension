"use strict";

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

var tabUrl = "";

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Check if the message has the expected data
  if (request.tagData) {
    // Do something with the received data
    // console.log("Received tag data:", request.tagData);

    const tagData = request.tagData;

    if (tagData.tabUrl) tabUrl = new URL(tagData.tabUrl);

    if (
      tagData["msg_path"] &&
      (tagData["msg_path"] === tabUrl.pathname ||
        (tagData["msg_path"].includes("*") &&
          checkUrlMatch(tagData["msg_path"], tabUrl.pathname)))
    ) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "open_dialog_box",
          message: tagData["msg_text"],
          pageType: "index",
        });
      });
    }
    
    if (
      tagData["payment_path"] &&
      (tagData["payment_path"] === tabUrl.pathname ||
        (tagData["payment_path"].includes("*") &&
          checkUrlMatch(tagData["payment_path"], tabUrl.pathname)))
    ) {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "open_dialog_box",
          message: tagData["payment_text"],
          pageType: "payment",
          tagData: tagData,
        });
      });
    }
  }
});

function checkUrlMatch(target, value) {
  if (!target.includes("*")) return false;
  let patternStr = "";
  patternStr = target.split("*").join(`[A-Za-z0-9_-]+`) + "$";
  let pattern = new RegExp(patternStr);
  return pattern.test(value);
}

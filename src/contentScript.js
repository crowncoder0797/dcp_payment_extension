"use strict";

// Content script file will run in the context of web page.
// With content script you can manipulate the web pages using
// Document Object Model (DOM).
// You can also pass information to the parent extension.

// We execute this script by making an entry in manifest.json file
// under `content_scripts` property

// For more information on Content Scripts,
// See https://developer.chrome.com/extensions/content_scripts

var attrs = null;

if (localStorage.getItem("dcp_tag_data"))
  attrs = JSON.parse(localStorage.getItem("dcp_tag_data"));
else {
  const dcpTag = document.querySelector("dcp-payment");

  if (!dcpTag) console.log("DCP cash payment is not available in this page.");
  else {
    // Get all attributes
    attrs = dcpTag.getAttributeNames().reduce((val, name) => {
      return { ...val, [name]: dcpTag.getAttribute(name) };
    }, {});

    localStorage.setItem("dcp_tag_data", JSON.stringify(attrs));
  }
}

// Send the data to the background script
if (attrs !== null)
  chrome.runtime.sendMessage({
    tagData: { ...attrs, tabUrl: window.location.href },
  });

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action == "open_dialog_box") {
    var messageWindow = document.createElement("div");
    messageWindow.id = `dcp-message-window-${request.pageType}`;

    messageWindow.style.position = "fixed";
    messageWindow.style.backgroundColor = "rgb(71,71,71)";
    messageWindow.style.top = "50px";
    messageWindow.style.left = "50%";
    messageWindow.style.transform = "translateX(-50%)";
    messageWindow.style.width = "100%";
    messageWindow.style.maxWidth = "500px";
    messageWindow.style.borderRadius = "10px";
    messageWindow.style.padding = "15px";
    messageWindow.style.textAlign = "center";
    messageWindow.style.boxShadow = "0px 10px 15px -3px rgba(0,0,0,0.8)";
    if (request.pageType.toLowerCase() == "payment")
      messageWindow.style.zIndex = "999";

    var msgContent = document.createTextNode(
      request.message
        ? request.message
        : "Payment with DCP Cash is available on this site"
    );
    var msgBlock = document.createElement("p");
    msgBlock.appendChild(msgContent);

    msgBlock.style.color = "white";
    msgBlock.style.fontSize = "25px";

    var payBtn = document.createElement("button");
    var payBtnText = document.createTextNode("Pay by DCP");
    payBtn.appendChild(payBtnText);
    payBtn.id = `dcp-window-pay-btn-${request.pageType}`;

    payBtn.style.border = "none";
    payBtn.style.borderRadius = "10px";
    payBtn.style.padding = "10px 30px";
    payBtn.style.backgroundColor = "rgb(56 174 0)";
    payBtn.style.color = "white";
    payBtn.style.fontSize = "20px";
    payBtn.style.boxShadow = "0 0 24px #38ae00";
    payBtn.style.marginRight = "25px";

    var closeBtn = document.createElement("button");
    var closeBtnText = document.createTextNode("Close");
    closeBtn.appendChild(closeBtnText);
    closeBtn.id = `dcp-window-close-btn-${request.pageType}`;

    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "10px";
    closeBtn.style.padding = "10px 30px";
    closeBtn.style.backgroundColor = "#dc3545";
    closeBtn.style.color = "white";
    closeBtn.style.fontSize = "20px";

    var btnWrapper = document.createElement("div");
    btnWrapper.style.display = "flex";
    btnWrapper.style.alignItems = "center";
    btnWrapper.style.justifyContent = "center";

    if (request.pageType.toLowerCase() === "payment")
      btnWrapper.appendChild(payBtn);
    btnWrapper.appendChild(closeBtn);

    messageWindow.appendChild(msgBlock);
    messageWindow.appendChild(btnWrapper);

    setTimeout(() => {
      document.body.appendChild(messageWindow);
    }, 10000);

    payBtn.addEventListener("click", (e) => {
      var amount =
        getLocalStorageDataByPath(
          window.localStorage,
          request.tagData.localstorage_amount_path
        ) || 0;
      var currency =
        getLocalStorageDataByPath(
          window.localStorage,
          request.tagData.localstorage_currency_path
        ) || null;
      var purchaseId =
        window.localStorage.getItem(
          request.tagData.localstorage_purchaseid_path
        ) || null;
      var paymentUrl = `https://www.wallet.site.democraticcooperative.cash/payment?Id=${request.tagData.wallet_id}&Sum=${amount}&ReportUrl=${request.tagData.reporting_path}&ReportUsername=${request.tagData.wallet_owners_name}&PurchaseId=${purchaseId}&ReturnUrl=${request.tagData.returned_path}&Arbitrator=${request.tagData.arbitrator}&Currency=${currency}`;
      window.open(paymentUrl, `${separate_window == 'true' ? "_blank" : "_self"}`);
      document.getElementById(
        `dcp-message-window-${request.pageType}`
      ).style.display = "none";
    });

    closeBtn.addEventListener("click", (e) => {
      document.getElementById(
        `dcp-message-window-${request.pageType}`
      ).style.display = "none";
    });
  }
});

function getLocalStorageDataByPath(data, path) {
  return path.split(".").reduce((prev, val, i) => {
    if (!prev) return null;
    if (i == 0) {
      return val.split("[").reduce((prev1, val1, idx) => {
        if (idx == 0) return JSON.parse(prev1.getItem(val1.trim()));
        else return prev1[+val1.slice(0, -1)];
      }, prev);
    } else {
      return val.split("[").reduce((prev1, val1, idx) => {
        if (idx == 0) return prev1[val1.trim()];
        else return prev1[+val1.slice(0, -1)];
      }, prev);
    }
  }, data);
}

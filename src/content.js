const EXTENSION_ID = "algkhhfaciplhfnkmecpmdfampkppndj"; 

window.addEventListener("message", (event) => {
  if (event.source !== window || !event.isTrusted) return;

  if (event.data.action === "open-did-popup" || event.data.action === "did-selected" || event.data.action === "sign-nonce") {
    chrome.runtime.sendMessage(
      EXTENSION_ID,
      {
        ...event.data,
        origin: event.origin,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Failed to send to extension:", chrome.runtime.lastError.message);
        }else{
          // console.log("Content script forwarded message to extension:", response);
        }
      }
    );
  }
});

chrome.runtime.onMessage.addListener((message) => {
  // console.log("Content script forwarding message to website:", message);
  if (message.action === "did-selected" || message.action === "nonce-signed") {
    window.postMessage(message, message.origin || window.location.origin);
  }
});

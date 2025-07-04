let currentRequestOrigin = null;
import CryptoJS from 'crypto-js';
import bs58 from 'bs58';
import * as ed from '@stablelib/ed25519';

chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.action === "open-did-popup") {
      currentRequestOrigin = sender.origin;

      chrome.action.openPopup((popupId) => {
        if (chrome.runtime.lastError || !popupId) {
          chrome.windows.create(
            {
              url: chrome.runtime.getURL("index.html") + "#/keys",
              type: "popup",
              width: 500,
              height: 600,
              focused: false,
            },
            (window) => {
              if (chrome.runtime.lastError) {
                sendResponse({ error: "Failed to open popup" });
              } else {
                sendResponse({ status: "popup-opened" });
              }
            }
          );
        } else {
          sendResponse({ status: "popup-opened" });
        }
      });

      return true;
    }

    if (request.action === "sign-nonce") {
      console.log("Received sign-nonce request:", request);

      chrome.storage.local.get(["didKeyPairs"], (result) => {
        console.log("Retrieved didKeyPairs from storage:", result.didKeyPairs);
        const stored = JSON.parse(result.didKeyPairs);
        console.log("Stored DID key pairs:", stored);
        const entry = stored[request.did];

        if (!entry) {
          console.error("DID not found in storage");
          sendResponse({ error: "DID not found" });
          return;
        }

        const password = request.password ;
        console.log("Using password for decryption:", password);

        try {
          const decrypted = CryptoJS.AES.decrypt(
            entry.secretKey,
            password
          ).toString(CryptoJS.enc.Utf8);
          if (!decrypted)
            throw new Error("Incorrect password or decryption failed");

          const secretKeyBytes = bs58.decode(decrypted);
          if (secretKeyBytes.length !== 64)
            throw new Error("Invalid private key length");

          const nonceBytes = new TextEncoder().encode(request.nonce);
          const sigBytes = ed.sign(secretKeyBytes, nonceBytes);
          const signature = bs58.encode(sigBytes);

          console.log("Signature generated:", signature);

          chrome.tabs.query({}, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, {
                action: "nonce-signed",
                signature,
                origin: currentRequestOrigin,
              });
            });
          });

          sendResponse({ status: "nonce-signed" });
        } catch (err) {
          console.error("Error signing nonce:", err.message);
          sendResponse({ error: err.message });
        }
      });

      return true;
    }
  }
);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "did-auth-complete" && currentRequestOrigin) {
    chrome.tabs.query({ url: currentRequestOrigin + "/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, message);
      });
    });
    sendResponse({ status: "forwarded" });
  }
});

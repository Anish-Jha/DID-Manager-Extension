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
        
        } else {
          sendResponse({ status: "popup-opened" });
        }
      });

      return true;
    }

    if (request.action === "sign-nonce") {
      console.log("Received sign-nonce request:", request);

      // Store the request details for later use
      const nonceRequest = {
        nonce: request.nonce,
        did: request.did,
        password: request.password,
        sender: sender,
        sendResponse: sendResponse,
      };

      // Send message to UI to show confirmation modal
      chrome.runtime.sendMessage({
        action: "show-nonce-confirm-modal",
        nonce: request.nonce,
        origin: sender.origin,
      });

      // Store the request to handle the response later
      chrome.storage.local.set({ pendingNonceRequest: nonceRequest });

      return true; // Keep the message channel open for async response
    }
  }
);

// Handle confirmation response from the UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "nonce-confirm-response") {
    chrome.storage.local.get(["pendingNonceRequest", "didKeyPairs"], (result) => {
      const nonceRequest = result.pendingNonceRequest;
      if (!nonceRequest) {
        console.error("No pending nonce request found");
        nonceRequest.sendResponse({ error: "No pending nonce request" });
        return;
      }

      if (message.confirmed) {
        // User confirmed, proceed with signing
        console.log("User confirmed nonce signing");
        const stored = JSON.parse(result.didKeyPairs);
        const entry = stored[nonceRequest.did];

        if (!entry) {
          console.error("DID not found in storage");
          nonceRequest.sendResponse({ error: "DID not found" });
          return;
        }

        const password = nonceRequest.password;
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

          const nonceBytes = new TextEncoder().encode(nonceRequest.nonce);
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

          nonceRequest.sendResponse({ status: "nonce-signed" });
        } catch (err) {
          console.error("Error signing nonce:", err.message);
          nonceRequest.sendResponse({ error: err.message });
        }
      } else {
        // User canceled
        console.log("User canceled nonce signing");
        nonceRequest.sendResponse({ error: "User canceled nonce signing" });
      }

      // Clear the pending request
      chrome.storage.local.remove("pendingNonceRequest");
    });

    return true;
  }

  if (message.action === "did-auth-complete" && currentRequestOrigin) {
    chrome.tabs.query({ url: currentRequestOrigin + "/*" }, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, message);
      });
    });
    sendResponse({ status: "forwarded" });
  }
});
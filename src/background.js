// background.js
import CryptoJS from "crypto-js";
import bs58 from "bs58";
import * as ed from "@stablelib/ed25519";

let currentRequestOrigin = null;
let decryptedPassword = null;

chrome.runtime.onMessageExternal.addListener(
  (request, sender, sendResponse) => {
    if (request.action === "open-did-popup") {
      currentRequestOrigin = sender.origin;

      chrome.action.openPopup(() => {
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: "show-did-selector",
            origin: sender.origin,
          });
        }, 200); // wait for the popup to mount
      });

      return true;
    }

    if (request.action === "sign-nonce") {
      // console.log("Received sign-nonce request:", request);

      const nonceRequest = {
        nonce: request.nonce,
        did: request.did,
        sender: sender,
        sendResponse: sendResponse,
      };

      // console.log("Storing nonce request:", nonceRequest);

      chrome.runtime.sendMessage({
        action: "show-nonce-confirm-modal",
        nonce: request.nonce,
        origin: sender.origin,
      });

      chrome.storage.local.set({ pendingNonceRequest: nonceRequest }, () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error storing nonce request:",
            chrome.runtime.lastError.message
          );
          sendResponse({ error: "Failed to store nonce request" });
        }
      });

      return true; 
    }
  }
);

// Handle confirmation response from the UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "password-unlocked") {
    decryptedPassword = message.decryptedPassword; // Store in memory
    // console.log("Decrypted password received and stored");
    sendResponse({ status: "password-stored" });
    return true;
  }

  if (message.action === "nonce-confirm-response") {
    chrome.storage.local.get(
      ["pendingNonceRequest", "didKeyPairs"],
      (result) => {
        const nonceRequest = result.pendingNonceRequest;
        if (!nonceRequest) {
          // console.error("No pending nonce request found");
          sendResponse({ error: "No pending nonce request" });
          return;
        }

        if (message.confirmed) {
          // console.log("User confirmed nonce signing");

          let stored = result.didKeyPairs;
          if (typeof stored === "string") {
            try {
              stored = JSON.parse(stored);
            } catch (e) {
              console.error("Error parsing didKeyPairs JSON:", e);
              sendResponse({ error: "Corrupted DID storage" });
              return;
            }
          }
          // console.log("Available DIDs in storage:", Object.keys(stored));
          // console.log("Requested DID:", nonceRequest.did);

          const didKey =
            typeof nonceRequest.did === "object"
              ? nonceRequest.did.did
              : nonceRequest.did;
          const entry = stored[didKey];

          console.log("Entry for DID:", entry);

          if (!entry) {
            // console.error("DID not found in storage");
            nonceRequest.sendResponse({ error: "DID not found" });
            return;
          }

          if (!decryptedPassword) {
            // console.error("Extension password not found in storage");
            nonceRequest.sendResponse({
              error: "Extension password not found",
            });
            return;
          }
          // console.log("Decrypting secret key for DID:", decryptedPassword);
          try {
            // console.log("Decrypting secret key for DID:", decryptedPassword);
            const decrypted = CryptoJS.AES.decrypt(
              entry.secretKey,
              decryptedPassword
            ).toString(CryptoJS.enc.Utf8);
            if (!decrypted) {
              throw new Error("Incorrect password or decryption failed");
            }

            const secretKeyBytes = bs58.decode(decrypted);
            if (secretKeyBytes.length !== 64) {
              throw new Error("Invalid private key length");
            }

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
            // console.error("Error signing nonce:", err.message);
            nonceRequest.sendResponse({
              error: `Failed to sign nonce: ${err.message}`,
            });
          }
        } else {
          // console.log("User canceled nonce signing");
          nonceRequest.sendResponse({ error: "User canceled nonce signing" });
        }

        chrome.storage.local.remove("pendingNonceRequest", () => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error clearing pending nonce request:",
              chrome.runtime.lastError.message
            );
          }
        });
      }
    );

    return true;
  }

  if (message.action === "did-auth-complete" && currentRequestOrigin) {
    chrome.tabs.query({ url: currentRequestOrigin + "/*" }, (tabs) => {
      if (chrome.runtime.lastError) {
        // console.error("Error querying tabs:", chrome.runtime.lastError.message);
        sendResponse({ error: "Failed to query tabs" });
        return;
      }
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, message);
      });
      sendResponse({ status: "forwarded" });
    });
    return true;
  }
});

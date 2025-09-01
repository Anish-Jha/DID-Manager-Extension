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
      const nonceRequest = {
        nonce: request.nonce,
        did: request.did,
        sender: sender,
        sendResponse: sendResponse,
      };

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "password-unlocked") {
    decryptedPassword = message.decryptedPassword;
    chrome.storage.session.set(
      {
        isUnlocked: true,
        decryptedPassword: message.decryptedPassword,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error("Error storing session data:", chrome.runtime.lastError.message);
          sendResponse({ status: "error", error: "Failed to store session data" });
        } else {
          console.log("Decrypted password stored in session");
          sendResponse({ status: "password-stored" });
        }
      }
    );
    return true;
  }

  if (message.action === "is-unlocked") {
    chrome.storage.session.get(["isUnlocked"], (result) => {
      sendResponse({ unlocked: Boolean(result.isUnlocked) });
    });
    return true;
  }

  if (message.action === "lock") {
    decryptedPassword = null;
    chrome.storage.session.remove(["isUnlocked", "decryptedPassword"], () => {
      if (chrome.runtime.lastError) {
        console.error("Error clearing session data:", chrome.runtime.lastError.message);
        sendResponse({ status: "error", error: "Failed to clear session data" });
      } else {
        sendResponse({ status: "locked" });
      }
    });
    return true;
  }

  if (message.action === "nonce-confirm-response") {
    chrome.storage.local.get(
      ["pendingNonceRequest", "didKeyPairs"],
      (result) => {
        const nonceRequest = result.pendingNonceRequest;
        if (!nonceRequest) {
          sendResponse({ error: "No pending nonce request" });
          return;
        }

        if (message.confirmed) {
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

          const didKey =
            typeof nonceRequest.did === "object"
              ? nonceRequest.did.did
              : nonceRequest.did;
          const entry = stored[didKey];

          if (!entry) {
            nonceRequest.sendResponse({ error: "DID not found" });
            return;
          }

          if (!decryptedPassword) {
            // Try to retrieve from session storage as fallback
            chrome.storage.session.get(["decryptedPassword"], (sessionResult) => {
              if (sessionResult.decryptedPassword) {
                decryptedPassword = sessionResult.decryptedPassword;
                signNonce(entry, nonceRequest, sendResponse);
              } else {
                nonceRequest.sendResponse({
                  error: "Extension password not found",
                });
              }
            });
            return;
          }

          signNonce(entry, nonceRequest, sendResponse);
        } else {
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

  if (message.action === "get-current-origin") {
    sendResponse({ origin: currentRequestOrigin });
    return true;
  }
});

function signNonce(entry, nonceRequest, sendResponse) {
  try {
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
    nonceRequest.sendResponse({
      error: `Failed to sign nonce: ${err.message}`,
    });
  }
}
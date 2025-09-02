import CryptoJS from "crypto-js";
import bs58 from "bs58";
import * as ed from "@stablelib/ed25519";

let currentRequestOrigin = null;
let decryptedPassword = null;

const MAX_NONCE_LENGTH = 64;
const MIN_NONCE_LENGTH = 1;
const HEX_REGEX = /^[0-9a-fA-F]+$/;

function validateNonce(nonce) {
  if (typeof nonce !== "string") {
    return { valid: false, error: "Nonce must be a string" };
  }
  if (nonce.length < MIN_NONCE_LENGTH) {
    return { valid: false, error: "Nonce is too short" };
  }
  if (nonce.length > MAX_NONCE_LENGTH) {
    return { valid: false, error: `Nonce exceeds maximum length of ${MAX_NONCE_LENGTH} characters` };
  }
  if (!HEX_REGEX.test(nonce)) {
    return { valid: false, error: "Nonce must contain only hexadecimal characters (0-9, a-f, A-F)" };
  }
  if (/[\x00-\x1F\x7F]/.test(nonce)) {
    return { valid: false, error: "Nonce contains invalid control characters" };
  }
  return { valid: true };
}

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log("External message received:", request);
  if (request.action === "open-did-popup") {
    currentRequestOrigin = sender.origin;
    chrome.action.openPopup(() => {
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: "show-did-selector",
          origin: sender.origin,
        });
      }, 200);
    });
    sendResponse({ status: "popup-opened" });
    return true;
  }

  if (request.action === "sign-nonce") {
    const nonceValidation = validateNonce(request.nonce);
    if (!nonceValidation.valid) {
      console.error("Nonce validation failed:", nonceValidation.error);
      sendResponse({ error: `Invalid nonce: ${nonceValidation.error}` });
      return true;
    }

    const nonceRequest = {
      nonce: request.nonce,
      did: request.did,
      sender: sender,
      sendResponse: sendResponse,
    };
    console.log("Storing nonce request:", nonceRequest);
    chrome.runtime.sendMessage({
      action: "show-nonce-confirm-modal",
      nonce: request.nonce,
      origin: sender.origin,
    });
    chrome.storage.local.set({ pendingNonceRequest: nonceRequest }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error storing nonce request:", chrome.runtime.lastError.message);
        sendResponse({ error: "Failed to store nonce request" });
      }
    });
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Internal message received:", message);
  if (message.action === "password-unlocked") {
    decryptedPassword = message.decryptedPassword;
    console.log("Password-unlocked: decryptedPassword set in memory");
    sendResponse({ status: "password-stored" });
    return true;
  }

  if (message.action === "is-unlocked") {
    chrome.storage.session.get(["isUnlocked"], (result) => {
      console.log("is-unlocked check:", result);
      sendResponse({ unlocked: Boolean(result.isUnlocked) });
    });
    return true;
  }

  if (message.action === "lock") {
    decryptedPassword = null;
    console.log("Locking extension, clearing session storage");
    chrome.storage.session.clear(() => {
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
    console.log("Nonce confirm response:", message);
    chrome.storage.local.get(["pendingNonceRequest", "didKeyPairs"], (result) => {
      console.log("Retrieved from chrome.storage.local:", result);
      const nonceRequest = result.pendingNonceRequest;
      if (!nonceRequest) {
        console.error("No pending nonce request found");
        sendResponse({ error: "No pending nonce request" });
        return;
      }

      if (message.confirmed) {
        let stored = {};
        if (result.didKeyPairs) {
          if (!decryptedPassword) {
            console.log("decryptedPassword not in memory, attempting to retrieve from session");
            chrome.storage.session.get(["encryptedPassword", "passwordSalt"], (sessionResult) => {
              console.log("Session storage data:", sessionResult);
              if (sessionResult.encryptedPassword && sessionResult.passwordSalt) {
                try {
                  decryptedPassword = CryptoJS.AES.decrypt(
                    sessionResult.encryptedPassword,
                    sessionResult.passwordSalt
                  ).toString(CryptoJS.enc.Utf8);
                  console.log("Decrypted password from session:", !!decryptedPassword);
                  if (decryptedPassword) {
                    try {
                      const decryptedDidKeyPairs = CryptoJS.AES.decrypt(
                        result.didKeyPairs,
                        decryptedPassword,
                        { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
                      ).toString(CryptoJS.enc.Utf8);
                      stored = JSON.parse(decryptedDidKeyPairs || "{}");
                      processNonce(stored, nonceRequest, sendResponse);
                    } catch (error) {
                      console.error("Error decrypting didKeyPairs:", error.message);
                      sendResponse({ error: "Failed to decrypt DID data: invalid password or corrupted storage" });
                    }
                  } else {
                    console.error("Failed to decrypt password: empty result");
                    sendResponse({ error: "Failed to decrypt password" });
                  }
                } catch (error) {
                  console.error("Decryption error:", error.message);
                  sendResponse({ error: "Failed to decrypt password: " + error.message });
                }
              } else {
                console.error("Session data missing: encryptedPassword or passwordSalt not found");
                sendResponse({ error: "Extension password not found" });
              }
            });
            return;
          }
          try {
            const decryptedDidKeyPairs = CryptoJS.AES.decrypt(
              result.didKeyPairs,
              decryptedPassword,
              { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            ).toString(CryptoJS.enc.Utf8);
            stored = JSON.parse(decryptedDidKeyPairs || "{}");
          } catch (error) {
            console.error("Error decrypting didKeyPairs:", error.message);
            sendResponse({ error: "Failed to decrypt DID data: invalid password or corrupted storage" });
            return;
          }
        }
        processNonce(stored, nonceRequest, sendResponse);
      } else {
        console.log("Nonce signing canceled by user");
        nonceRequest.sendResponse({ error: "User canceled nonce signing" });
      }

      chrome.storage.local.remove("pendingNonceRequest", () => {
        if (chrome.runtime.lastError) {
          console.error("Error clearing pending nonce request:", chrome.runtime.lastError.message);
        }
      });
    });
    return true;
  }

  if (message.action === "did-auth-complete" && currentRequestOrigin) {
    console.log("DID auth complete, forwarding to tabs");
    chrome.tabs.query({ url: currentRequestOrigin + "/*" }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error("Error querying tabs:", chrome.runtime.lastError.message);
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
    console.log("Returning current origin:", currentRequestOrigin);
    sendResponse({ origin: currentRequestOrigin });
    return true;
  }
});

function processNonce(stored, nonceRequest, sendResponse) {
  const didKey = typeof nonceRequest.did === "object" ? nonceRequest.did.did : nonceRequest.did;
  const entry = stored[didKey];
  console.log("DID entry for signing:", entry);

  if (!entry) {
    console.error("DID not found for key:", didKey);
    nonceRequest.sendResponse({ error: "DID not found" });
    return;
  }

  signNonce(entry, nonceRequest, sendResponse);
}

function signNonce(entry, nonceRequest, sendResponse) {
  console.log("Attempting to sign nonce with entry:", entry);
  try {
    const nonceValidation = validateNonce(nonceRequest.nonce);
    if (!nonceValidation.valid) {
      throw new Error(`Invalid nonce: ${nonceValidation.error}`);
    }

    const decrypted = CryptoJS.AES.decrypt(
      entry.secretKey,
      decryptedPassword,
      { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
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
      console.log("Sending nonce-signed message to tabs:", tabs.length);
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "nonce-signed",
          signature,
          origin: currentRequestOrigin,
        });
      });
    });

    nonceRequest.sendResponse({ status: "nonce-signed", signature });
  } catch (err) {
    console.error("Error signing nonce:", err.message);
    nonceRequest.sendResponse({ error: `Failed to sign nonce: ${err.message}` });
  }
}
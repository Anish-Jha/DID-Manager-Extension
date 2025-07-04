# 🛠 **Decast DID Authentication Extension**

A secure Chrome Extension to enable **DID-based authentication** for [Decast](https://did.decast.live). This extension allows users to:

✔ Generate and manage Decentralized Identifiers (DIDs)
✔ Securely store encrypted private keys
✔ Perform DID login with nonce-signing flow
✔ Communicate seamlessly with the Decast website

---

## 🚀 **Features**

✅ Generate new DID key pairs (Ed25519)
✅ Encrypted storage of private keys using user-defined password
✅ DID selection and private key restoration
✅ Nonce signing with user confirmation
✅ Full integration with [did.decast.live](https://did.decast.live) login flow
✅ Transparent UI with confirmation prompts for all sensitive actions

---

## ⚙️ **Tech Requirements**

* **Node.js** version `20.x` or higher (required for development/build process)
* Chrome version supporting Manifest V3
* NPM or Yarn

---

## 🗂 **Folder Structure**

```
/decast-extension
├── manifest.json            # Chrome extension manifest (Manifest V3)
├── icons/                   # Extension icons (favicon, browser icons, etc.)
│   └── icon.png
├── package.json             # Project dependencies
├── vite.config.js           # Vite config for building the popup UI
├── README.md                # Project documentation

├── src/                     # All extension source files
│   ├── background.js        # Background service worker logic
│   ├── content.js           # Content script injected into Decast website
│   ├── main.js              # Vue 3 entry point for the popup UI
│   ├── style.css            # Global styles for popup UI

│   ├── App.vue              # Root component for popup UI
│
│   ├── assets/              # Static assets (logos, images)
│   │   └── logo.png
│
│   ├── components/          # Reusable Vue components
│   │   ├── KeyManager.vue
│   │   ├── DidSelector.vue
│   │   ├── ConfirmModal.vue
│   │   ├── PromptModal.vue
│   │   ├── BackupModal.vue
│   │   ├── ResponseDisplay.vue
│   │   └── OnboardingModal.vue
│
└── ...other config files 

```

---

## 📦 **Installation (For Developers)**

1. Clone the repo:

```bash
git clone https://github.com/Anish-Jha/DID-Manager-Extension.git
cd decast-extension
```

2. Install dependencies:

```bash
npm install
```

3. Build the popup UI:

```bash
npm run build
```

4. Load the extension in Chrome:

* Open `chrome://extensions`
* Enable **Developer Mode**
* Click **Load Unpacked**
* Select the project folder

5. Run live changes:

```bash
npm run dev
```

---

## 🔑 **Complete DID Login Flow**

**1.** User clicks `Login with DID` on Decast website
**2.** Website sends `open-did-popup` message to extension
**3.** Extension popup opens, user selects a DID and enters password
**4.** Selected DID is securely sent back to the website
**5.** Website calls Decast API to fetch a nonce
**6.** Website sends `sign-nonce` request to extension with nonce and DID
**7.** Extension opens confirmation modal showing nonce details
**8.** User approves the Signing.
**9.** Extension signs nonce with private key
**10.** Signature is sent back to website
**11.** Website finalizes login via DID API

✅ All private key operations stay within the extension
✅ Nonce signing requires explicit user confirmation

---

## 🛡 **Security Considerations**

* Private keys are encrypted with user password using AES
* DID key pairs stored in `chrome.storage.local`
* Password is never stored
* All sensitive actions require user confirmation

---

## 🧩 **Dependencies**

* `@stablelib/ed25519` — Ed25519 key generation and signing
* `bs58` — Base58 encoding for keys and signatures
* `crypto-js` — AES encryption for private key storage
* `Vue 3` — Popup UI
* `Vite` — Fast build tool for popup frontend

---

## ✨ **Contributing**

Pull requests are welcome! For major changes, please open an issue first to discuss your proposal.

---

## 📄 **License**

This project is licensed under the MIT License.

---

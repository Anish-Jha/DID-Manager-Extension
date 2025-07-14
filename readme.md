# 🛠 **Decast DID Authentication Extension**

A secure Chrome Extension enabling **DID-based authentication** for [Decast](https://did.decast.live). It provides users with capabilities to:

✔ Generate and manage Decentralized Identifiers (DIDs)
✔ Securely store encrypted private keys
✔ Execute DID login with nonce-signing flow
✔ Seamlessly integrate with the Decast platform

---

## 🚀 **Key Features**

* ✅ Generate DID key pairs (Ed25519)
* ✅ Secure private key storage encrypted with user-defined password
* ✅ Easy DID selection and private key restoration
* ✅ Nonce signing with explicit user confirmation
* ✅ Direct integration with [did.decast.live](https://did.decast.live)
* ✅ Transparent user interface with confirmation prompts for sensitive actions

---

## ⚙️ **Technical Requirements**

* **Node.js:** v20.x or higher
* Chrome with Manifest V3 support
* NPM or Yarn package manager

---

## 🗂 **Folder Structure**

```
/decast-extension
├── manifest.json            # Chrome extension manifest (Manifest V3)
├── icons/                   # Extension icons
│   └── icon.png
├── package.json             # Project dependencies
├── vite.config.js           # Vite build configuration
├── README.md                # Project documentation

├── src/                     # Extension source files
│   ├── background.js        # Background service worker logic
│   ├── content.js           # Content script for Decast website
│   ├── main.js              # Vue 3 entry point for popup UI
│   ├── style.css            # Global popup UI styles
│   ├── App.vue              # Root Vue component
│   ├── Icons/              # Static Icons
│   │   └── logo.png
│   └── components/          # Reusable Vue components
│       ├── KeyManager.vue
│       ├── DidSelector.vue
│       ├── ConfirmModal.vue
│       ├── PromptModal.vue
│       ├── BackupModal.vue
│       ├── ResponseDisplay.vue
│       └── OnboardingModal.vue
└── ...other config files
```

---

## 📦 **Installation (Developer Guide)**

**1. Clone Repository:**

```bash
git clone https://github.com/Anish-Jha/DID-Manager-Extension.git
cd decast-extension
```

**2. Install Dependencies:**

```bash
npm install
```

**3. Build the Popup UI:**

```bash
npm run build
```

**4. Load the Extension in Chrome:**

* Navigate to `chrome://extensions`
* Enable **Developer Mode**
* Select **Load Unpacked**
* Choose the `decast-extension/dist` folder

**4. Update EXTENSION_ID:**

* Navigate to `Content.js`
* update **EXTENSION_ID**
* Check **EXTENSION_ID** in your browser `chrome://extensions`.
* Look for **DID-Manager**.

**5. Run Live Development Server:**

```bash
npm run dev
```

---

## 🔑 **Complete DID Login Flow**

1. User clicks `Login with DID` on Decast
2. Website triggers `open-did-popup` message to extension
3. Extension popup opens for DID selection and password entry
4. Selected DID securely returned to the website
5. Website fetches nonce from Decast API
6. Website requests `sign-nonce` from extension
7. Extension prompts user confirmation
8. User confirms, extension signs nonce
9. Signature returned securely to website
10. Website finalizes DID-based login

✅ All private key operations stay within the extension
✅ Explicit user confirmation required for nonce signing

---

## 🛡 **Security Practices**

* AES-encrypted private keys
* Keys stored securely in `chrome.storage.local`
* Password never stored or transmitted
* Explicit confirmation prompts for sensitive actions

---

## 🧩 **Dependencies**

* `@stablelib/ed25519` — Key generation and signing
* `bs58` — Base58 encoding
* `crypto-js` — AES encryption
* `Vue 3` — Popup UI framework
* `Vite` — Frontend build tool

---

## ✨ **Contributing**

Pull requests are welcome! For major changes, please open an issue first to discuss.

---

## 📄 **License**

MIT License.

---

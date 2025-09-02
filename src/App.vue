<!-- App.vue -->
<template>
  <div id="app"
    class="bg-[#15161E] text-white pt-4 pl-4 pr-4 w-[450px] h-[600px] flex flex-col items-center justify-start">
    <UnlockModal v-if="state.showUnlockModal" @unlock="handleUnlock" @response="addResponse"
      @forgot-password="handleForgotPasswordModal" />
    <ForgotPassword v-if="state.showForgotPasswordModal" @response="addResponse" @wallet-reset="handleWalletReset"
      @close="state.showForgotPasswordModal = false" />
    <PasswordSetup v-if="state.showPasswordSetup" @close="state.showPasswordSetup = false" @response="addResponse"
      @password-set="handlePasswordSet" />
    <SettingsContainer v-if="state.showSettingsContainer" @close="state.showSettingsContainer = false"
      @generate-did="handleGenerateDid" @restore-did="handleRestoreDid" @settings-did="showSettings"
      @delete-did="promptDeleteKeyPair" @response="addResponse" @lock="handleLock" />
    <template v-else>
      <header class="flex items-center justify-between gap-3 mb-4 w-full border-b border-gray-700 pb-2 sticky top-0">
        <div class="flex items-center gap-2 justify-start">
          <img src="./icons/logot.svg" alt="DID:Decast Logo" class="w-auto h-8" />
        </div>
        <div>
          <img src="./icons/settings.svg" alt="Settings" class="cursor-pointer w-6 h-6" @click="handleSettings">
        </div>
      </header>

      <div class="main_container flex flex-col items-center justify-between mx-auto mt-4 p-2 w-full h-full">
        <div class="tab-content flex-grow w-full overflow-y-auto">
          <div v-if="state.activeTab === 'profile'" class="space-y-4">
            <DidProfile v-if="state.storedDids.length > 0 && !state.showDidSelector"
              v-model:selected-did="state.selectedDid" :responses="state.responses" :stored-dids="state.storedDids"
              @update:selectedDid="updateSelectedDid" @response="addResponse"
              :extensionPassword="state.extensionPassword" @clear-responses="clearResponses" />
            <DidSelector v-if="state.showDidSelector" :dids="state.storedDids"
              :extensionPassword="state.extensionPassword" @did-selected="handleDidSelected" />
            <div v-else-if="state.storedDids.length === 0" class="text-gray-500 text-center">
              No DIDs available. Please generate or restore a DID.
            </div>
          </div>
          <div v-if="state.activeTab === 'generate'">
            <DidGenerate :extension-password="state.extensionPassword || 'temp'" :from-settings="state.fromSettings"
              @key-generated="handleKeyGenerated" @response="addResponse" @back="handleClaimSuccessContinue" />
          </div>
          <div v-if="state.activeTab === 'restore'">
            <DidRestore :extension-password="state.extensionPassword" @key-generated="handleKeyGenerated"
              @response="addResponse" @back="handleClaimSuccessContinue" />
          </div>
          <div v-if="state.activeTab === 'responses'">
            <ResponseDisplay :responses="state.responses" @clear-responses="clearResponses" />
          </div>
          <div v-if="state.activeTab === 'claim-success'">
            <DidClaimSuccess :name="state.tempDidData?.name || ''" :did="state.tempDidData?.did || ''"
              @continue="handleClaimSuccessContinue" />
          </div>
          <div v-if="state.activeTab === 'settings' && state.storedDids.length > 0" class="space-y-4">
            <Settings v-model:selected-did="state.selectedDid" :extensionPassword="state.extensionPassword" :selectedDid="state.selectedDid"
              @key-generated="handleKeyGenerated" @response="addResponse" @show-backup="showBackupModal"
              @show-confirm="showConfirmModal" @delete-did="promptDeleteKeyPair" @back="handleClaimSuccessContinue" />
          </div>
        </div>
      </div>

      <OnboardingModal v-if="state.showOnboarding" :dont-show-again="state.dontShowOnboarding"
        :is-first-time="state.isFirstTime" @update:dont-show-again="updateDontShowOnboarding" @close="closeOnboarding"
        @generate-did="handleGenerateDid" @restore-did="handleRestoreDid" @response="addResponse" />
      <SaveBackupKey v-if="state.showSaveBackupKey" :backupKey="state.backupKey" @download="downloadBackup"
        @response="addResponse" @continue="handleBackupContinue" @close="handleBackupClose" />
      <BackupModal v-if="state.showBackupModal" :backupKey="state.backupKey" @download="downloadBackupFromSettings"
        @response="addResponse" @close="state.showBackupModal = false" />
      <PromptModal v-if="state.showPromptModal" :title="state.promptModal.title"
        :placeholder="state.promptModal.placeholder" @submit="handlePromptSubmit" @close="closePromptModal" />
      <ConfirmModal v-if="state.showConfirmModal" :title="state.confirmModal.title"
        :message="state.confirmModal.message" @confirm="handleConfirm" @close="closeConfirmModal"
        :source="state.confirmModal.source" />
    </template>
  </div>
</template>

<script>
import { toast } from "vue3-toastify";
import DidSelector from "./components/DidSelector.vue";
import ResponseDisplay from "./components/ResponseDisplay.vue";
import OnboardingModal from "./components/OnboardingModal.vue";
import BackupModal from "./components/BackupModal.vue";
import SaveBackupKey from "./components/SaveBackupKey.vue";
import PromptModal from "./components/PromptModal.vue";
import ConfirmModal from "./components/ConfirmModal.vue";
import DidGenerate from "./components/DidGenerate.vue";
import DidRestore from "./components/DidRestore.vue";
import Settings from "./components/Settings.vue";
import UnlockModal from "./components/UnlockModal.vue";
import DidClaimSuccess from "./components/DidClaimSuccess.vue";
import DidProfile from "./components/DidProfile.vue";
import ForgotPassword from "./components/ForgotPassword.vue";
import PasswordSetup from "./components/PasswordSetup.vue";
import SettingsContainer from "./components/SettingsContainer.vue";
import CryptoJS from "crypto-js";
import bs58 from "bs58";
import * as ed from "@stablelib/ed25519";
import axios from "axios";

export default {
  components: {
    DidSelector,
    ResponseDisplay,
    OnboardingModal,
    BackupModal,
    SaveBackupKey,
    PromptModal,
    ConfirmModal,
    DidGenerate,
    DidRestore,
    Settings,
    UnlockModal,
    DidClaimSuccess,
    DidProfile,
    ForgotPassword,
    PasswordSetup,
    SettingsContainer,
  },
  data() {
    return {
      state: {
        storedDids: [],
        selectedDid: "",
        selectedDidData: null,
        responses: [],
        showBackupModal: false,
        showSaveBackupKey: false,
        backupKey: "",
        showOnboarding: false,
        dontShowOnboarding: false,
        activeTab: "profile",
        showPromptModal: false,
        promptModal: { title: "", placeholder: "", callback: null },
        showConfirmModal: false,
        confirmModal: { title: "", message: "", callback: null },
        websiteOrigin: "",
        showUnlockModal: false,
        isFirstTime: false,
        extensionPassword: "",
        showDidSelector: false,
        showForgotPasswordModal: false,
        tempDidData: null,
        showPasswordSetup: false,
        showSettingsContainer: false,
        fromSettings: false,
      },
    };
  },
  mounted() {
    chrome.runtime.sendMessage({ action: "is-unlocked" }, (response) => {
      if (response?.unlocked) {
        chrome.storage.session.get(["encryptedPassword", "passwordSalt"], (result) => {
          if (result.encryptedPassword && result.passwordSalt) {
            try {
              const decryptedPassword = CryptoJS.AES.decrypt(
                result.encryptedPassword,
                result.passwordSalt
              ).toString(CryptoJS.enc.Utf8);
              if (decryptedPassword) {
                this.state.extensionPassword = decryptedPassword;
                this.state.showUnlockModal = false;
                this.loadStoredDids(() => {
                  this.state.showOnboarding = !this.state.dontShowOnboarding && this.state.storedDids.length === 0;
                  this.loadSettings(() => {
                    // this.addResponse("Extension unlocked from session!");
                    chrome.runtime.sendMessage({ action: "get-current-origin" }, (response) => {
                      if (response?.origin) {
                        this.state.websiteOrigin = response.origin;
                        chrome.storage.local.get(["activeTab"], (result) => {
                          this.state.activeTab = result.activeTab || "profile";
                        });
                      }
                    });
                  });
                });
              } else {
                this.checkFirstTime();
                this.addResponse("Failed to decrypt password from session.");
              }
            } catch (error) {
              console.error("Decryption error:", error.message);
              this.checkFirstTime();
              this.addResponse("Error decrypting password from session.");
            }
          } else {
            this.checkFirstTime();
          }
        });
      } else {
        this.checkFirstTime();
      }
    });

    window.addEventListener("message", (event) => {
      if (event.data?.action === "did-selected") {
        const { did } = event.data;
        this.handleDidSelected(did);
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "show-nonce-confirm-modal") {
        this.state.showConfirmModal = true;
        this.state.confirmModal = {
          title: "Confirm Nonce Signing",
          message: `The website ${message.origin} is requesting to sign a nonce: ${message.nonce}. <span style="text-decoration:underline; color: whitesmoke"><br/>Do you want to proceed?</span> `,
          source: "nonce",
          callback: (confirmed) => {
            chrome.runtime.sendMessage({ action: "nonce-confirm-response", confirmed });
            this.state.showConfirmModal = false;
            chrome.storage.local.set({ activeTab: "profile" });
            window.close();
          },
        };
      }
    });

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "show-did-selector") {
        console.log("Received show-did-selector message:", message);
        this.state.showDidSelector = true;
      }
    });
  },
  methods: {
    checkFirstTime() {
      chrome.storage.local.get(["extensionPasswordHash"], (result) => {
        if (!result.extensionPasswordHash) {
          this.state.isFirstTime = true;
          this.state.showOnboarding = true;
          this.state.showUnlockModal = false;
          this.state.showPasswordSetup = false;
          this.state.showSaveBackupKey = false;
          this.loadSettings();
          this.loadStoredDids();
        } else {
          this.state.isFirstTime = false;
          this.loadStoredDids(() => {
            this.state.showUnlockModal = true;
            this.state.showOnboarding = false;
            this.state.showPasswordSetup = false;
            this.state.showSaveBackupKey = false;
            this.loadSettings();
          });
        }
      });
    },
    loadStoredDids(callback) {
      chrome.storage.local.get(["didKeyPairs"], (result) => {
        let stored = {};
        if (result.didKeyPairs) {
          try {
            if (this.state.extensionPassword) {
              const decrypted = CryptoJS.AES.decrypt(
                result.didKeyPairs,
                this.state.extensionPassword,
                { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
              ).toString(CryptoJS.enc.Utf8);
              stored = JSON.parse(decrypted || "{}");
            } else if (this.state.isFirstTime) {
              // For first-time users, didKeyPairs may be unencrypted
              stored = JSON.parse(result.didKeyPairs || "{}");
            }
          } catch (error) {
            console.error("Error decrypting didKeyPairs:", error.message);
            this.addResponse("Error loading DID data: invalid password or corrupted storage.");
          }
        }
        this.state.storedDids = Object.keys(stored).map(did => ({
          did,
          name: stored[did].name,
        }));
        if (!this.state.storedDids.some(d => d.did === this.state.selectedDid)) {
          this.state.selectedDid = this.state.storedDids.length > 0 ? this.state.storedDids[0].did : "";
        }
        if (callback) callback();
      });
    },
    loadSettings(callback) {
      chrome.storage.local.get(["dontShowOnboarding"], (result) => {
        this.state.dontShowOnboarding = result.dontShowOnboarding ? JSON.parse(result.dontShowOnboarding) : false;
        if (callback) callback();
      });
    },
    handleUnlock(password) {
      const salt = CryptoJS.lib.WordArray.random(16).toString();
      const encryptedPassword = CryptoJS.AES.encrypt(
        password,
        salt,
        { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      ).toString();
      chrome.storage.session.set(
        {
          isUnlocked: true,
          encryptedPassword: encryptedPassword,
          passwordSalt: salt,
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Error storing session data:", chrome.runtime.lastError.message);
            this.addResponse("Error storing session data.");
            return;
          }
          chrome.runtime.sendMessage(
            { action: "password-unlocked", decryptedPassword: password },
            (response) => {
              if (response?.status === "password-stored") {
                this.state.extensionPassword = password;
                this.state.showUnlockModal = false;
                this.loadStoredDids(() => {
                  this.state.showOnboarding = !this.state.dontShowOnboarding && this.state.storedDids.length === 0;
                  // this.addResponse("Extension unlocked successfully!");
                });
              } else {
                this.addResponse("Error storing password in session.");
              }
            }
          );
        }
      );
    },
    handleLock() {
      chrome.runtime.sendMessage({ action: "lock" }, (response) => {
        if (response?.status === "locked") {
          this.state.extensionPassword = "";
          this.state.showUnlockModal = true;
          this.state.showSettingsContainer = false;
          this.addResponse("Extension locked successfully!");
        } else {
          this.addResponse("Error locking extension.");
        }
      });
    },
    handleSettings() {
      this.state.showSettingsContainer = true;
    },
    handleGenerateDid() {
      this.state.showOnboarding = false;
      this.state.showSettingsContainer = false;
      this.state.fromSettings = true;
      this.state.activeTab = "generate";
      this.state.showDidGenerate = true;
      this.state.showDidRestore = false;
      chrome.storage.local.set({ activeTab: "generate" });
    },
    showSettings() {
      this.state.activeTab = "settings";
      this.state.showOnboarding = false;
      this.state.showSettingsContainer = false;
      this.state.showDidGenerate = false;
      this.state.showDidRestore = false;
      chrome.storage.local.set({ activeTab: "settings" });
    },
    handleRestoreDid() {
      this.state.showOnboarding = false;
      this.state.showSettingsContainer = false;
      this.state.activeTab = "restore";
      this.state.showDidGenerate = false;
      this.state.showDidRestore = true;
      chrome.storage.local.set({ activeTab: "restore" });
    },
    handlePasswordSet(password) {
      this.state.extensionPassword = password;
      this.state.isFirstTime = false;
      const passwordHash = CryptoJS.SHA256(password).toString();
      const salt = CryptoJS.lib.WordArray.random(16).toString();
      const encryptedPassword = CryptoJS.AES.encrypt(
        password,
        salt,
        { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      ).toString();
      chrome.storage.session.set(
        {
          encryptedPassword: encryptedPassword,
          passwordSalt: salt,
          isUnlocked: true,
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error("Error storing session password:", chrome.runtime.lastError.message);
            this.addResponse("Error setting extension password.");
            return;
          }
          chrome.storage.local.set(
            { extensionPasswordHash: passwordHash },
            () => {
              if (chrome.runtime.lastError) {
                console.error("Error storing password hash:", chrome.runtime.lastError.message);
                this.addResponse("Error setting extension password.");
                return;
              }
              if (this.state.tempDidData) {
                chrome.storage.local.get(["didKeyPairs"], (result) => {
                  if (chrome.runtime.lastError) {
                    console.error("Error retrieving didKeyPairs:", chrome.runtime.lastError.message);
                    this.addResponse("Error storing DID data.");
                    return;
                  }
                  let stored = {};
                  if (result.didKeyPairs) {
                    try {
                      stored = JSON.parse(result.didKeyPairs || "{}");
                    } catch (error) {
                      console.error("Error parsing didKeyPairs:", error.message);
                      this.addResponse("Error parsing DID data.");
                      return;
                    }
                  }
                  const encryptedSecretKey = CryptoJS.AES.encrypt(
                    this.state.tempDidData.rawSecretKey,
                    password,
                    { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
                  ).toString();
                  const didData = {
                    name: this.state.tempDidData.name,
                    publicKey: this.state.tempDidData.publicKey,
                    secretKey: encryptedSecretKey,
                    createdAt: this.state.tempDidData.createdAt,
                  };
                  stored[this.state.tempDidData.did] = didData;
                  const encryptedDidKeyPairs = CryptoJS.AES.encrypt(
                    JSON.stringify(stored),
                    password,
                    { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
                  ).toString();
                  chrome.storage.local.set({ didKeyPairs: encryptedDidKeyPairs }, () => {
                    if (chrome.runtime.lastError) {
                      console.error("Error storing didKeyPairs:", chrome.runtime.lastError.message);
                      this.addResponse("Error storing DID data.");
                      return;
                    }
                    this.loadStoredDids();
                    this.addResponse(`DID "${this.state.tempDidData.name}" stored successfully!`);
                    this.state.showPasswordSetup = false;
                    this.state.activeTab = "claim-success";
                    chrome.storage.local.set({ activeTab: "claim-success" });
                  });
                });
              } else {
                this.state.showPasswordSetup = false;
                this.state.activeTab = "claim-success";
                chrome.storage.local.set({ activeTab: "claim-success" });
                this.addResponse("Extension password set successfully!");
              }
            }
          );
        }
      );
    },
    handleClaimSuccessContinue() {
      this.state.selectedDid = this.state.tempDidData?.did || '';
      this.state.activeTab = "profile";
      chrome.storage.local.set({ activeTab: "profile" });
      this.state.tempDidData = null;
    },
    updateSelectedDid(did) {
      this.state.selectedDid = did;
      // this.addResponse(`Selected DID: ${did}`);
    },
    handleDidSelected(did) {
      if (!did) {
        this.addResponse("DID is missing");
        return;
      }
      this.state.selectedDid = did;
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, { action: "did-selected", did });
        });
      });
    },
    addResponse(message) {
      const response = {
        message,
        timestamp: new Date().toLocaleString(),
        type: message.includes("Error") ? "error" : "success",
      };
      this.state.responses.unshift(response);
      chrome.storage.local.set({ responses: JSON.stringify(this.state.responses) }, () => {
        console.log("Responses saved:", this.state.responses);
      });
      toast[message.includes("Error") ? "error" : "success"](message);
    },
    showBackupModal(key) {
      this.state.backupKey = key;
      this.state.showBackupModal = true;
    },
    showSaveBackupKey(key) {
      this.state.backupKey = key;
      this.state.showSaveBackupKey = true;
    },
    handleBackupContinue() {
      this.state.showSaveBackupKey = false;
      if (this.state.isFirstTime) {
        this.state.showPasswordSetup = true;
      }
    },
    handleBackupClose() {
      this.state.showSaveBackupKey = false;
      if (this.state.isFirstTime) {
        this.state.showPasswordSetup = true;
      }
    },
    showConfirmModal(payload) {
      this.state.showConfirmModal = true;
      this.state.confirmModal = {
        title: payload.title,
        message: payload.message,
        callback: (confirmed) => {
          try {
            if (typeof payload.callback === 'function') payload.callback(confirmed);
          } finally {
            this.state.showConfirmModal = false;
          }
        },
      };
    },
    downloadBackup() {
      const blob = new Blob([this.state.backupKey], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `did-private-key-${this.state.tempDidData?.did || 'backup'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      this.state.showSaveBackupKey = false;
      this.addResponse("Secret recovery key downloaded successfully!");
      if (this.state.isFirstTime) {
        this.state.showPasswordSetup = true;
      }
    },
    downloadBackupFromSettings() {
      const blob = new Blob([this.state.backupKey], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `did-private-key-${this.state.selectedDid}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      this.state.showBackupModal = false;
      this.addResponse("Private key downloaded successfully!");
    },
    promptDeleteKeyPair() {
      console.log("Prompting delete for DID:", this.state.selectedDid);
      if (!this.state.selectedDid) {
        this.addResponse("Please select a DID first.");
        return;
      }
      chrome.storage.local.get(["didKeyPairs"], (result) => {
        let stored = {};
        if (result.didKeyPairs && this.state.extensionPassword) {
          try {
            const decrypted = CryptoJS.AES.decrypt(
              result.didKeyPairs,
              this.state.extensionPassword,
              { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            ).toString(CryptoJS.enc.Utf8);
            stored = JSON.parse(decrypted || "{}");
          } catch (error) {
            console.error("Error decrypting didKeyPairs:", error.message);
            this.addResponse("Error accessing DID data: invalid password or corrupted storage.");
            return;
          }
        }
        const keyPair = stored[this.state.selectedDid];
        if (!keyPair) {
          this.addResponse(`No key pair found for DID ${this.truncateDid(this.state.selectedDid)}`);
          return;
        }
        this.state.showConfirmModal = true;
        this.state.confirmModal = {
          title: "Delete DID",
          message: `Are you sure you want to delete DID "${keyPair.name || this.truncateDid(this.state.selectedDid)}"? <span class="text_small" style="color:red"><br/>This cannot be undone.</span>`,
          source: "delete",
          callback: (confirmed) => {
            if (confirmed) this.deleteKeyPair();
            this.state.showConfirmModal = false;
          },
        };
      });
    },
    deleteKeyPair() {
      chrome.storage.local.get(["didKeyPairs"], (result) => {
        let stored = {};
        if (result.didKeyPairs && this.state.extensionPassword) {
          try {
            const decrypted = CryptoJS.AES.decrypt(
              result.didKeyPairs,
              this.state.extensionPassword,
              { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            ).toString(CryptoJS.enc.Utf8);
            stored = JSON.parse(decrypted || "{}");
          } catch (error) {
            console.error("Error decrypting didKeyPairs:", error.message);
            this.addResponse("Error deleting DID: invalid password or corrupted storage.");
            return;
          }
        }
        const keyPair = stored[this.state.selectedDid];
        if (!keyPair) {
          this.addResponse(`No key pair found for DID ${this.truncateDid(this.state.selectedDid)}`);
          return;
        }
        delete stored[this.state.selectedDid];
        const encryptedDidKeyPairs = CryptoJS.AES.encrypt(
          JSON.stringify(stored),
          this.state.extensionPassword,
          { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        ).toString();
        chrome.storage.local.set({ didKeyPairs: encryptedDidKeyPairs }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error storing didKeyPairs:", chrome.runtime.lastError.message);
            this.addResponse("Error deleting DID.");
            return;
          }
          this.loadStoredDids();
          this.addResponse(`DID "${keyPair.name || this.truncateDid(this.state.selectedDid)}" deleted successfully.`);
          this.state.selectedDid = this.state.storedDids.length > 0 ? this.state.storedDids[0].did : "";
        });
      });
    },
    truncateDid(did) {
      return did.length > 30 ? `${did.slice(0, 12)}...${did.slice(-12)}` : did;
    },
    handleKeyGenerated(didData) {
      console.log('Handling key-generated:', didData);
      this.loadStoredDids();
      this.addResponse(`DID "${didData.name}" generated successfully!`);
      if (this.state.isFirstTime) {
        this.state.tempDidData = didData;
        this.showSaveBackupKey(didData.rawSecretKey);
      } else {
        chrome.storage.local.get(["didKeyPairs"], (result) => {
          let stored = {};
          if (result.didKeyPairs && this.state.extensionPassword) {
            try {
              const decrypted = CryptoJS.AES.decrypt(
                result.didKeyPairs,
                this.state.extensionPassword,
                { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
              ).toString(CryptoJS.enc.Utf8);
              stored = JSON.parse(decrypted || "{}");
            } catch (error) {
              console.error("Error decrypting didKeyPairs:", error.message);
              this.addResponse("Error accessing DID data: invalid password or corrupted storage.");
              return;
            }
          }
          stored[didData.did] = {
            name: didData.name,
            publicKey: didData.publicKey,
            secretKey: didData.secretKey, // Already encrypted
            createdAt: didData.createdAt,
          };
          const encryptedDidKeyPairs = CryptoJS.AES.encrypt(
            JSON.stringify(stored),
            this.state.extensionPassword,
            { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
          ).toString();
          console.log('Storing encrypted didKeyPairs:', encryptedDidKeyPairs);
          chrome.storage.local.set({ didKeyPairs: encryptedDidKeyPairs }, () => {
            if (chrome.runtime.lastError) {
              console.error("Error storing didKeyPairs:", chrome.runtime.lastError.message);
              this.addResponse("Error storing DID data.");
              return;
            }
            this.loadStoredDids();
            this.state.activeTab = "profile";
            this.state.fromSettings = false;
            chrome.storage.local.set({ activeTab: "profile" });
          });
        });
      }
    },
    handlePromptSubmit(value) {
      if (this.state.promptModal.callback) this.state.promptModal.callback(value);
      this.state.showPromptModal = false;
    },
    closePromptModal() {
      this.state.showPromptModal = false;
    },
    closeConfirmModal() {
      const cb = this.state.confirmModal?.callback;
      if (typeof cb === 'function') cb(false);
      this.state.showConfirmModal = false;
    },
    handleConfirm() {
      const cb = this.state.confirmModal?.callback;
      if (typeof cb === 'function') cb(true);
    },
    updateDontShowOnboarding(value) {
      this.state.dontShowOnboarding = value;
      chrome.storage.local.set({ dontShowOnboarding: JSON.stringify(value) });
    },
    closeOnboarding() {
      this.state.showOnboarding = false;
      this.updateDontShowOnboarding(this.state.dontShowOnboarding);
      this.state.activeTab = "profile";
      chrome.storage.local.set({ activeTab: "profile" });
      this.addResponse("Welcome! You are now in the DID Profile tab.");
    },
    handleForgotPasswordModal() {
      this.state.showUnlockModal = false;
      this.state.showForgotPasswordModal = true;
    },
    handleWalletReset() {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          console.error("Error clearing storage:", chrome.runtime.lastError.message);
          this.addResponse("Error resetting wallet.");
          return;
        }
        chrome.storage.session.clear(() => {
          this.state.storedDids = [];
          this.state.selectedDid = "";
          this.state.responses = [];
          this.state.showForgotPasswordModal = false;
          this.state.isFirstTime = true;
          this.state.showOnboarding = true;
          this.state.extensionPassword = "";
          this.addResponse("Wallet reset successfully!");
        });
      });
    },
    clearResponses() {
      this.state.responses = [];
      chrome.storage.local.set({ responses: JSON.stringify(this.state.responses) }, () => {
        console.log("Responses cleared");
      });
    },
  },
};
</script>

<style scoped>
* {
  font-family: "Rethink Sans", sans-serif !important;
}

.main_container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: calc(100% - 64px);
}

.tab-content {
  flex-grow: 1;
  overflow-y: auto;
  padding-bottom: 10px;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #1a1b24;
}

::-webkit-scrollbar-thumb {
  background: #4b4e6d;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #d7df23;
}
</style>
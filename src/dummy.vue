<!-- App.vue -->
<template>
    <div id="app"
        class="bg-[#15161E] text-white pt-4 pl-4 pr-4 w-[450px] h-[600px] flex flex-col items-center justify-start">
        <UnlockModal v-if="state.showUnlockModal" @unlock="handleUnlock" @response="addResponse" />
        <template v-else>
            <header class="flex items-center justify-between gap-3 mb-4 w-full border-b border-gray-700 pb-2">
                <div class="flex items-center gap-2 justify-start">
                    <img src="./icons/logot.svg" alt="DID:Decast Logo" class="w-auto h-8" />
                </div>
                <div class="basic_child_2 cursor-pointer hover:opacity-80 transition-opacity">
                    <img src="./icons/settings.svg" />
                </div>
            </header>

            <div class="main_container flex flex-col items-center justify-between mx-auto mt-4 p-2 w-full h-full">
                <div class="tab-content flex-grow w-full overflow-y-auto">
                    <div v-if="state.activeTab === 'profile'" class="space-y-4">

                        <DidProfile v-if="state.storedDids.length && !state.showDidSelector > 0"
                            v-model:selected-did="state.selectedDid" :responses="state.responses"
                            @update:selectedDid="updateSelectedDid" @response="addResponse"
                            @clear-responses="clearResponses" />
                        <DidSelector v-if="state.showDidSelector" :dids="state.storedDids"
                            @did-selected="handleDidSelected" />
                        <div v-else class="text-gray-500 text-center">
                            No DIDs available. Please generate or restore a DID.
                        </div>
                    </div>
                    <div v-if="state.activeTab === 'generate'">
                        <DidGenerate :extension-password="state.extensionPassword" @key-generated="handleKeyGenerated"
                            @response="addResponse" @back="handleBack" />
                    </div>
                    <div v-if="state.activeTab === 'restore'">
                        <DidRestore :extension-password="state.extensionPassword" @key-generated="handleKeyGenerated"
                            @response="addResponse" @back="handleBack" />
                    </div>
                    <div v-if="state.activeTab === 'settings' && state.storedDids.length > 0" class="space-y-4">
                        <Settings v-model:selected-did="state.selectedDid" :extension-password="state.extensionPassword"
                            @key-generated="handleKeyGenerated" @response="addResponse" @show-backup="showBackupModal"
                            @show-confirm="showConfirmModal" />
                    </div>
                    <div v-if="state.activeTab === 'responses'">
                        <ResponseDisplay :responses="state.responses" @clear-responses="clearResponses" />
                    </div>
                </div>

                <footer class="flex justify-around items-center w-full border-t border-gray-700 pt-1 mt-2">
                    <button v-for="tab in tabs" :key="tab.id"
                        class="button_ch relative py-2 text-sm font-medium text-center transition-colors flex flex-col items-center"
                        :class="{
                            'text-[#d7df23] text-center':
                                state.activeTab === tab.id,
                            'text-gray-400 hover:text-[#d7df23]': state.activeTab !== tab.id,
                            'opacity-50 cursor-not-allowed':
                                tab.disabled && state.storedDids.length === 0,
                        }" :disabled="tab.disabled && state.storedDids.length === 0" @click="setActiveTab(tab.id)"
                        :aria-selected="state.activeTab === tab.id" role="tab">
                        <span class="icon-wrapper mb-1" :class="{
                            'icon-active': state.activeTab === tab.id,
                            'icon-hover': state.activeTab !== tab.id,
                        }" v-html="tab.icon"></span>
                        <span class="tooltip text-center" :data-tooltip="tab.tooltip">
                            {{ tab.label }}
                            <span v-if="tab.id === 'responses' && state.responses.length"
                                class="absolute -top-1 -right-1 bg-[#d7df23] text-gray-900 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                {{ state.responses.length }}
                            </span>
                        </span>
                    </button>
                </footer>
            </div>


            <OnboardingModal v-if="state.showOnboarding" :dont-show-again="state.dontShowOnboarding"
                :is-first-time="state.isFirstTime" @update:dont-show-again="updateDontShowOnboarding"
                @close="closeOnboarding" @generate-did="handleGenerateDid" @restore-key="handleRestoreKey"
                @response="addResponse" @password-set="handlePasswordSet" />
            <BackupModal v-if="state.showBackupModal" :backup-key="state.backupKey" @download="downloadBackup"
                @response="addResponse" @close="closeBackupModal" />
            <PromptModal v-if="state.showPromptModal" :title="state.promptModal.title"
                :placeholder="state.promptModal.placeholder" @submit="handlePromptSubmit" @close="closePromptModal" />
            <ConfirmModal v-if="state.showConfirmModal" :title="state.confirmModal.title"
                :message="state.confirmModal.message" @confirm="handleConfirm" @close="closeConfirmModal" />
        </template>
    </div>
</template>

<script>
import { toast } from "vue3-toastify";
import DidSelector from "./components/DidSelector.vue";
import ResponseDisplay from "./components/ResponseDisplay.vue";
import OnboardingModal from "./components/OnboardingModal.vue";
import BackupModal from "./components/BackupModal.vue";
import PromptModal from "./components/PromptModal.vue";
import ConfirmModal from "./components/ConfirmModal.vue";
import DidGenerate from "./components/DidGenerate.vue";
import DidRestore from "./components/DidRestore.vue";
import Settings from "./components/Settings.vue";
import UnlockModal from "./components/UnlockModal.vue";
import CryptoJS from "crypto-js";
import bs58 from "bs58";
import * as ed from "@stablelib/ed25519";
import axios from "axios";
import DidProfile from "./components/DidProfile.vue";

export default {
    components: {
        DidSelector,
        ResponseDisplay,
        OnboardingModal,
        BackupModal,
        PromptModal,
        ConfirmModal,
        DidGenerate,
        DidRestore,
        Settings,
        UnlockModal,
        DidProfile
    },
    data() {
        return {
            state: {
                storedDids: [],
                selectedDid: "",
                selectedDidData: null,
                responses: [],
                showBackupModal: false,
                backupKey: "",
                showOnboarding: false,
                dontShowOnboarding: false,
                activeTab: "profile",
                showPromptModal: false,
                promptModal: { title: "", placeholder: "", callback: null },
                showConfirmModal: false,
                confirmModal: { title: "", message: "", callback: null },
                websiteOrigin: "",
                showDidGenerate: false,
                showDidRestore: false,
                showUnlockModal: false,
                isFirstTime: false,
                extensionPassword: "",
                showDidSelector: false,
            },
            tabs: [
                {
                    id: "profile",
                    label: "DID Profile",
                    tooltip: "View all your DID key pairs",
                    disabled: false,
                    icon: `
      
          `,
                    hoverColor: "#D7DF23",
                },
                {
                    id: "generate",
                    label: "Generate DID",
                    tooltip: "Generate a new DID key pair",
                    disabled: false,
                    icon: `
          

          `,
                    hoverColor: "#4CAF50",
                },
                {
                    id: "restore",
                    label: "Restore Key",
                    tooltip: "Restore a DID using a private key",
                    disabled: false,
                    icon: `
           
          `,
                    hoverColor: "#2196F3",
                },
                {
                    id: "settings",
                    label: "Settings",
                    tooltip: "Configure extension settings",
                    disabled: false,
                    icon: `
          

          `,
                    hoverColor: "#FF9800",
                },
            ],
        };
    },
    mounted() {
        this.checkFirstTime();
        this.loadSettings();
        this.loadStoredDids();

        chrome.runtime.sendMessage({ action: "get-current-origin" }, (response) => {
            if (response?.origin) {
                this.state.websiteOrigin = response.origin;
                this.state.activeTab = "profile";
                localStorage.setItem("activeTab", "profile");
            }
        });

        window.addEventListener("message", (event) => {
            if (event.data?.action === "did-selected") {
                const { did } = event.data;
                this.handleDidSelected(did);
            }
        });

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === 'show-nonce-confirm-modal') {
                this.state.showConfirmModal = true;
                this.state.confirmModal = {
                    title: 'Confirm Nonce Signing',
                    message: `The website ${message.origin} is requesting to sign a nonce: ${message.nonce}. Do you want to proceed?`,
                    callback: (confirmed) => {
                        chrome.runtime.sendMessage({
                            action: 'nonce-confirm-response',
                            confirmed,
                        });
                        this.state.showConfirmModal = false;
                    },
                };
            }
        });

        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.action === "show-did-selector") {
                console.log('Received show-did-selector message:', message);
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
                } else {
                    this.state.isFirstTime = false;
                    this.state.showUnlockModal = true;
                    this.state.showOnboarding = false;
                }
            });
        },

        handleUnlock(password) {
            this.state.extensionPassword = password;
            this.state.showUnlockModal = false;
            this.state.showOnboarding =
                !this.state.dontShowOnboarding && this.state.storedDids.length === 0;
            this.addResponse("Extension unlocked successfully!");
        },

        handlePasswordSet(password) {
            this.state.extensionPassword = password;
            this.state.isFirstTime = false;
            this.state.showOnboarding = true;
            this.addResponse("Extension password set successfully!");
        },

        handleDidSelected(did) {
            if (!did) {
                this.addResponse("DID is missing");
                return;
            }
            this.state.selectedDid = did;
            this.addResponse("✅ DID selected");
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach((tab) => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "did-selected",
                        did,
                    });
                });
            });

            this.addResponse('DID selected and sent to website');
        },

        loadStoredDids() {
            const stored = localStorage.getItem("didKeyPairs");
            this.state.storedDids = stored ? Object.keys(JSON.parse(stored)) : [];
            if (!this.state.storedDids.includes(this.state.selectedDid)) {
                this.state.selectedDid =
                    this.state.storedDids.length > 0 ? this.state.storedDids[0] : "";
            }
        },

        loadSettings() {
            const dontShow = localStorage.getItem("dontShowOnboarding");
            this.state.dontShowOnboarding = dontShow ? JSON.parse(dontShow) : false;
            const savedTab = localStorage.getItem("activeTab");
            if (savedTab && this.tabs.some((tab) => tab.id === savedTab)) {
                this.state.activeTab = savedTab;
            } else {
                this.state.activeTab = "profile";
                localStorage.setItem("activeTab", "profile");
            }
        },

        addResponse(message) {
            const response = {
                message,
                timestamp: new Date().toLocaleString(),
                type: message.includes('Error') ? 'error' : 'success',
            };
            this.state.responses.unshift(response);
            // Save responses to chrome.storage.local
            chrome.storage.local.set(
                { responses: JSON.stringify(this.state.responses) },
                () => {
                    console.log('Responses saved:', this.state.responses);
                }
            );
            toast[message.includes('Error') ? 'error' : 'success'](message);
        },

        showBackupModal(key) {
            this.state.backupKey = key;
            this.state.showBackupModal = true;
        },

        showPromptModal({ title, placeholder, callback }) {
            this.state.promptModal = { title, placeholder, callback };
            this.state.showPromptModal = true;
        },

        showConfirmModal({ title, message, callback }) {
            this.state.confirmModal = { title, message, callback };
            this.state.showConfirmModal = true;
        },

        setActiveTab(tab) {
            this.state.activeTab = tab;
            this.state.showDidGenerate = tab === "generate";
            this.state.showDidRestore = tab === "restore";
            localStorage.setItem("activeTab", tab);
            toast.info(
                `Switched to ${this.tabs.find((t) => t.id === tab).label} tab.`
            );
        },

        persistDontShowOnboarding() {
            localStorage.setItem(
                "dontShowOnboarding",
                JSON.stringify(this.state.dontShowOnboarding)
            );
        },

        closeOnboarding() {
            this.state.showOnboarding = false;
            this.persistDontShowOnboarding();
            this.state.activeTab = "profile";
            localStorage.setItem("activeTab", "profile");
            toast.info("Welcome! You are now in the DID Profile tab.");
        },

        handleKeyGenerated() {
            this.loadStoredDids();
            this.addResponse("Key pair created or restored!");
            if (this.state.storedDids.length > 0) {
                toast.success("Key pair created or restored!");
            }
            this.state.showDidGenerate = false;
            this.state.showDidRestore = false;
            this.state.activeTab = "profile";
            localStorage.setItem("activeTab", "profile");
        },

        handleGenerateDid() {
            this.state.showOnboarding = false;
            this.state.activeTab = "generate";
            this.state.showDidGenerate = true;
            this.state.showDidRestore = false;
            localStorage.setItem("activeTab", "generate");
        },

        handleRestoreKey() {
            this.state.showOnboarding = false;
            this.state.activeTab = "restore";
            this.state.showDidGenerate = false;
            this.state.showDidRestore = true;
            localStorage.setItem("activeTab", "restore");
        },

        handleBack() {
            this.state.showDidGenerate = false;
            this.state.showDidRestore = false;
            this.state.showOnboarding = true;
        },

        clearResponses() {
            //    no need to update
        },

        downloadBackup() {
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

        handlePromptSubmit(value) {
            if (this.state.promptModal.callback)
                this.state.promptModal.callback(value);
            this.state.showPromptModal = false;
        },

        closePromptModal() {
            this.state.showPromptModal = false;
        },

        closeBackupModal() {
            this.state.showBackupModal = false;
        },

        handleConfirm() {
            if (this.state.confirmModal.callback)
                this.state.confirmModal.callback(true);
            this.state.showConfirmModal = false;
        },

        closeConfirmModal() {
            this.state.showConfirmModal = false;
        },

        updateDontShowOnboarding(value) {
            this.state.dontShowOnboarding = value;
            this.persistDontShowOnboarding();
        },
    },
};
</script>

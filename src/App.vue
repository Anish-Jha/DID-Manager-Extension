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
                <!-- <div class="basic_child_2 cursor-pointer hover:opacity-80 transition-opacity">
                    <img src="./icons/settings.svg" />
                </div> -->
            </header>

            <div class="main_container flex flex-col items-center justify-between mx-auto mt-4 p-2 w-full h-full">
                <div class="tab-content flex-grow w-full overflow-y-auto">
                    <div v-if="state.activeTab === 'profile'" class="space-y-4">

                        <DidProfile v-if="state.storedDids.length > 0 && !state.showDidSelector"
                            v-model:selected-did="state.selectedDid" :responses="state.responses"
                            @update:selectedDid="updateSelectedDid" @response="addResponse"
                            @clear-responses="clearResponses" />
                        <DidSelector v-if="state.showDidSelector" :dids="state.storedDids"
                            @did-selected="handleDidSelected" />
                        <div v-else-if="state.storedDids.length == 0" class="text-gray-500 text-center">
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
            <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 12.9831C15.2886 12.9831 16.3333 11.9384 16.3333 10.6497C16.3333 9.36108 15.2886 8.31641 14 8.31641C12.7113 8.31641 11.6666 9.36108 11.6666 10.6497C11.6666 11.9384 12.7113 12.9831 14 12.9831Z" stroke="white" stroke-width="2"/>
              <path d="M18.6667 17.6497C18.6667 18.9384 18.6667 19.9831 14 19.9831C9.33337 19.9831 9.33337 18.9384 9.33337 17.6497C9.33337 16.361 11.4227 15.3164 14 15.3164C16.5773 15.3164 18.6667 16.361 18.6667 17.6497Z" stroke="white" stroke-width="2"/>
              <path d="M3.5 12.3029C3.5 8.57231 3.5 6.70706 3.94044 6.07954C4.38087 5.45203 6.13471 4.85169 9.64239 3.65099L10.3107 3.42224C12.1392 2.79634 13.0534 2.4834 14 2.4834C14.9466 2.4834 15.8608 2.79634 17.6893 3.42224L18.3576 3.65099C21.8653 4.85169 23.6192 5.45203 24.0596 6.07954C24.5 6.70706 24.5 8.57231 24.5 12.3029C24.5 12.8663 24.5 13.4774 24.5 14.14C24.5 20.7177 19.5545 23.9098 16.4516 25.2652C15.61 25.6329 15.1892 25.8167 14 25.8167C12.8108 25.8167 12.39 25.6329 11.5483 25.2652C8.44545 23.9098 3.5 20.7177 3.5 14.14C3.5 13.4774 3.5 12.8663 3.5 12.3029Z" stroke="white" stroke-width="2"/>
            </svg>
          `,
                    hoverColor: "#D7DF23",
                },
                {
                    id: "generate",
                    label: "Generate DID",
                    tooltip: "Generate a new DID key pair",
                    disabled: false,
                    icon: `
            <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20.6373 13.497C23.6911 13.497 26.1666 11.0314 26.1666 7.99016C26.1666 4.94886 23.6911 2.4834 20.6373 2.4834C17.5835 2.4834 15.1079 4.94886 15.1079 7.99016C15.1079 9.39886 15.7509 10.4234 15.7509 10.4234L9.06423 17.0827C8.7642 17.3815 8.34413 18.1585 9.06423 18.8756L9.83577 19.644C10.1358 19.9001 10.8902 20.2587 11.5074 19.644L12.4075 18.7475C13.3076 19.644 14.3364 19.1317 14.7221 18.6194C15.365 17.723 14.5935 16.8266 14.5935 16.8266L14.8508 16.5704C16.0852 17.7999 17.1653 17.0827 17.5511 16.5704C18.1941 15.674 17.5511 14.7775 17.5511 14.7775C17.2939 14.2653 16.7796 14.2653 17.4225 13.6249L18.1941 12.8566C18.8113 13.3689 20.08 13.497 20.6373 13.497Z" stroke="white" stroke-opacity="0.6" stroke-width="2" stroke-linejoin="round"/>
<path d="M20.6372 9.91077C21.7025 9.91077 22.5661 9.05073 22.5661 7.98981C22.5661 6.92889 21.7025 6.06885 20.6372 6.06885C19.5719 6.06885 18.7084 6.92889 18.7084 7.98981C18.7084 9.05073 19.5719 9.91077 20.6372 9.91077Z" stroke="white" stroke-opacity="0.6" stroke-width="2"/>
<path d="M26.1667 17.6419C26.0922 20.9016 25.7808 22.8056 24.4799 24.1065C22.7696 25.8167 20.017 25.8167 14.5118 25.8167C9.00652 25.8167 6.2539 25.8167 4.54364 24.1065C2.83337 22.3962 2.83337 19.6435 2.83337 14.1383C2.83337 8.6331 2.83337 5.88046 4.54364 4.17021C5.84453 2.86931 7.74852 2.55793 11.0083 2.4834" stroke="white" stroke-opacity="0.6" stroke-width="2" stroke-linecap="round"/>
</svg>

          `,
                    hoverColor: "#4CAF50",
                },
                {
                    id: "restore",
                    label: "Restore Key",
                    tooltip: "Restore a DID using a private key",
                    disabled: false,
                    icon: `
            <svg width="28" height="29" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M7.90475 8.26271H10.4475C10.6796 8.26271 10.9021 8.3549 11.0662 8.51899C11.2303 8.68309 11.3225 8.90565 11.3225 9.13771C11.3225 9.36978 11.2303 9.59234 11.0662 9.75643C10.9021 9.92053 10.6796 10.0127 10.4475 10.0127H6.37C6.13793 10.0127 5.91537 9.92053 5.75128 9.75643C5.58718 9.59234 5.495 9.36978 5.495 9.13771V5.06371C5.495 4.83165 5.58718 4.60909 5.75128 4.44499C5.91537 4.2809 6.13793 4.18871 6.37 4.18871C6.60206 4.18871 6.82462 4.2809 6.98871 4.44499C7.15281 4.60909 7.245 4.83165 7.245 5.06371V6.44621C8.74654 5.06626 10.6174 4.15343 12.6292 3.81922C14.641 3.485 16.7065 3.74386 18.5736 4.56419C20.4407 5.38452 22.0285 6.7308 23.1431 8.43862C24.2576 10.1464 24.8508 12.1419 24.85 14.1812C24.85 16.9657 23.744 19.6361 21.7752 21.6052C19.8065 23.5743 17.1362 24.6807 14.3517 24.6812C11.567 24.6812 8.89626 23.575 6.92712 21.6058C4.95799 19.6367 3.85175 16.966 3.85175 14.1812H5.60175C5.60175 16.5019 6.52362 18.7275 8.16456 20.3684C9.8055 22.0093 12.0311 22.9312 14.3517 22.9312C16.6724 22.9312 18.898 22.0093 20.5389 20.3684C22.1799 18.7275 23.1017 16.5019 23.1017 14.1812C23.1019 12.4188 22.5698 10.6974 21.5751 9.24247C20.5805 7.78754 19.1697 6.66687 17.5275 6.02722C15.8852 5.38757 14.0881 5.25876 12.3714 5.65764C10.6547 6.05652 9.09847 6.96451 7.9065 8.26271H7.90475Z" fill="white" fill-opacity="0.6"/>
</svg>

          `,
                    hoverColor: "#2196F3",
                },
                {
                    id: "settings",
                    label: "Settings",
                    tooltip: "Configure extension settings",
                    disabled: false,
                    icon: `
           <svg width="29" height="29" viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M14.5 17.6499C16.433 17.6499 18 16.0829 18 14.1499C18 12.2169 16.433 10.6499 14.5 10.6499C12.567 10.6499 11 12.2169 11 14.1499C11 16.0829 12.567 17.6499 14.5 17.6499Z" stroke="white" stroke-opacity="0.6" stroke-width="2"/>
<path d="M16.5596 2.66101C16.1308 2.4834 15.5872 2.4834 14.5 2.4834C13.4128 2.4834 12.8693 2.4834 12.4404 2.66101C11.8687 2.89783 11.4144 3.35208 11.1776 3.9238C11.0695 4.1848 11.0272 4.48832 11.0106 4.93105C10.9863 5.58169 10.6527 6.18394 10.0888 6.50948C9.52493 6.83502 8.83654 6.82286 8.2609 6.51862C7.86921 6.31158 7.5852 6.19646 7.30511 6.15959C6.69156 6.07881 6.07106 6.24507 5.5801 6.6218C5.21188 6.90434 4.94008 7.37511 4.39649 8.31665C3.85289 9.2582 3.58109 9.72896 3.52051 10.1891C3.43974 10.8027 3.606 11.4232 3.98273 11.9141C4.15467 12.1383 4.39633 12.3266 4.77141 12.5622C5.32278 12.9087 5.67756 13.4989 5.67752 14.1501C5.67749 14.8012 5.32273 15.3913 4.77139 15.7377C4.39628 15.9734 4.15458 16.1619 3.98261 16.386C3.60588 16.8769 3.43962 17.4973 3.5204 18.1109C3.58097 18.571 3.85277 19.0419 4.39637 19.9834C4.93998 20.9249 5.21178 21.3958 5.57999 21.6782C6.07094 22.0549 6.69145 22.2212 7.305 22.1404C7.58506 22.1036 7.86906 21.9884 8.26073 21.7815C8.8364 21.4772 9.52484 21.4651 10.0887 21.7906C10.6526 22.1162 10.9863 22.7184 11.0106 23.3692C11.0272 23.8118 11.0695 24.1154 11.1776 24.3764C11.4144 24.948 11.8687 25.4023 12.4404 25.6392C12.8693 25.8167 13.4128 25.8167 14.5 25.8167C15.5872 25.8167 16.1308 25.8167 16.5596 25.6392C17.1313 25.4023 17.5856 24.948 17.8223 24.3764C17.9305 24.1154 17.9728 23.8118 17.9894 23.3691C18.0137 22.7184 18.3473 22.1162 18.9112 21.7906C19.475 21.4649 20.1635 21.4772 20.7392 21.7815C21.1309 21.9884 21.4148 22.1035 21.6948 22.1403C22.3084 22.2212 22.9289 22.0549 23.4199 21.6782C23.7881 21.3956 24.0599 20.9249 24.6035 19.9833C25.1471 19.0418 25.419 18.571 25.4795 18.1109C25.5602 17.4973 25.394 16.8768 25.0173 16.3859C24.8453 16.1617 24.6036 15.9733 24.2285 15.7377C23.6772 15.3913 23.3225 14.8011 23.3225 14.1499C23.3225 13.4988 23.6772 12.9088 24.2285 12.5625C24.6037 12.3267 24.8454 12.1384 25.0174 11.9141C25.3941 11.4233 25.5604 10.8027 25.4796 10.1892C25.4191 9.72904 25.1472 9.25827 24.6036 8.31673C24.06 7.3752 23.7882 6.90442 23.42 6.62188C22.9291 6.24515 22.3085 6.07889 21.695 6.15967C21.415 6.19654 21.131 6.31165 20.7392 6.51866C20.1636 6.82292 19.4751 6.83509 18.9113 6.50952C18.3473 6.18396 18.0137 5.58167 17.9894 4.93099C17.9728 4.48829 17.9305 4.18478 17.8223 3.9238C17.5856 3.35208 17.1313 2.89783 16.5596 2.66101Z" stroke="white" stroke-opacity="0.6" stroke-width="2"/>
</svg>


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
            // const savedTab = localStorage.getItem("activeTab");
            // if (savedTab && this.tabs.some((tab) => tab.id === savedTab)) {
            //     this.state.activeTab = savedTab;
            // } else {
            //     this.state.activeTab = "profile";
            //     localStorage.setItem("activeTab", "profile");
            // }
        },

        addResponse(message) {
            const response = {
                message,
                timestamp: new Date().toLocaleString(),
                type: message.includes('Error') ? 'error' : 'success',
            };
            this.state.responses.unshift(response);
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
            // localStorage.setItem("activeTab", tab);
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
            // localStorage.setItem("activeTab", "generate");
        },

        handleRestoreKey() {
            this.state.showOnboarding = false;
            this.state.activeTab = "restore";
            this.state.showDidGenerate = false;
            this.state.showDidRestore = true;
            // localStorage.setItem("activeTab", "restore");
        },

        handleBack() {
            this.state.showDidGenerate = false;
            this.state.showDidRestore = false;
            this.state.showOnboarding = true;
        },

        clearResponses() {
            chrome.storage.local.set(
                { responses: JSON.stringify([]) },
                () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error clearing responses:', chrome.runtime.lastError.message);
                        this.addResponse('Error clearing logs.');
                        chrome.storage.local.get(['responses'], (result) => {
                            if (result.responses) {
                                try {
                                    this.state.responses = JSON.parse(result.responses);
                                } catch (e) {
                                    console.error('Error parsing stored responses:', e.message);
                                    this.addResponse('Error loading logs after clear attempt.');
                                }
                            }
                        });
                        return;
                    }
                    console.log('Responses cleared');
                    this.state.responses = [];
                    toast.info('Logs cleared');
                }
            );
            this.state.responses = [];
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
    display: none;
}


footer {
    position: sticky;
    bottom: 0;
    background: #15161e;
    z-index: 10;
}

.icon-wrapper {
    display: inline-block;
}

.icon-wrapper svg {
    stroke: white;
    transition: stroke 0.3s ease;
}

button:hover .icon-wrapper.icon-hover svg {
    stroke: v-bind('tabs.find(t => t.id === state.activeTab).hoverColor || "#D7DF23"'
        );
}

button:hover .icon-wrapper.icon-hover {
    filter: drop-shadow(0 0 8px v-bind('tabs.find(t => t.id === state.activeTab).hoverColor || "#D7DF23"'));
}

.icon-active svg {
    stroke: v-bind('tabs.find(t => t.id === state.activeTab).hoverColor || "#D7DF23"'
        );
    filter: drop-shadow(0 0 8px v-bind('tabs.find(t => t.id === state.activeTab).hoverColor || "#D7DF23"'));
}

.tooltip {
    position: relative;
}

.tooltip:hover:after {
    content: attr(data-tooltip);
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: #15161e;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 99;
}

.button_ch {
    /* border: 1px solid red; */
}
</style>

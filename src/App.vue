<!-- App.vue -->
<template>
    <div id="app" class="bg-black text-white p-4 w-[500px] h-[600px] flex flex-col items-center justify-start">
        <header class="flex items-center justify-between gap-3 mb-4 w-full">
            <div class="flex items-center gap-2 justify-start">
                <img src="./assets/logot.svg" alt="DID:Decast Logo" class="w-8 h-8" />
                <h1 class="text-xl font-semibold text-white">Decast DID Manager</h1>
            </div>
            <div class="basic_child_2 cursor-pointer hover:opacity-80 transition-opacity">
                <img src="./assets/settings.svg" />
            </div>
        </header>

        <div class="parent_2">
            <div class="basic_child_3"></div>
            <div class="basic_child_4"></div>
        </div>

        <div class="main_container flex flex-col items-center justify-start mx-auto mt-4 p-2 w-full h-full">
            <nav class="flex gap-2 mb-6 border-b border-gray-700">
                <button v-for="tab in tabs" :key="tab.id"
                    class="relative px-4 py-2 text-sm font-medium transition-colors" :class="{
                        'text-[#d7df23] border-b-2 border-[#d7df23]': state.activeTab === tab.id,
                        'text-gray-400 hover:text-white': state.activeTab !== tab.id,
                        'opacity-50 cursor-not-allowed': tab.disabled && state.storedDids.length === 0,
                    }" :disabled="tab.disabled && state.storedDids.length === 0" @click="setActiveTab(tab.id)"
                    :aria-selected="state.activeTab === tab.id" role="tab">
                    <span class="tooltip" :data-tooltip="tab.tooltip">
                        {{ tab.label }}
                        <span v-if="tab.id === 'responses' && state.responses.length"
                            class="absolute -top-1 -right-1 bg-[#d7df23] text-gray-900 text-xs font-bold w-5 h-5 flex items-center justify-center">
                            {{ state.responses.length }}
                        </span>
                    </span>
                </button>
            </nav>

            <div class="tab-content">
                <div v-if="state.activeTab === 'keys'" class="space-y-4">
                    <DidSelector v-if="state.storedDids.length > 0" :dids="state.storedDids"
                        @did-selected="handleDidSelected" @show-prompt="showPromptModal" />
                    <KeyManager :selected-did="state.selectedDid" @key-generated="handleKeyGenerated"
                        @response="addResponse" @show-backup="showBackupModal" @show-prompt="showPromptModal"
                        @show-confirm="showConfirmModal" />
                </div>
                <div v-if="state.activeTab === 'responses'">
                    <ResponseDisplay :responses="state.responses" @clear-responses="clearResponses" />
                </div>
            </div>
        </div>

        <OnboardingModal v-if="state.showOnboarding" :dont-show-again="state.dontShowOnboarding"
            @update:dont-show-again="updateDontShowOnboarding" @close="closeOnboarding" />
        <BackupModal v-if="state.showBackupModal" :backup-key="state.backupKey" @download="downloadBackup"
            @close="closeBackupModal" />
        <PromptModal v-if="state.showPromptModal" :title="state.promptModal.title"
            :placeholder="state.promptModal.placeholder" @submit="handlePromptSubmit" @close="closePromptModal" />
        <ConfirmModal v-if="state.showConfirmModal" :title="state.confirmModal.title"
            :message="state.confirmModal.message" @confirm="handleConfirm" @close="closeConfirmModal" />
    </div>
</template>

<script>
import { toast } from 'vue3-toastify';
import KeyManager from './components/KeyManager.vue';
import DidSelector from './components/DidSelector.vue';
import ResponseDisplay from './components/ResponseDisplay.vue';
import OnboardingModal from './components/OnboardingModal.vue';
import BackupModal from './components/BackupModal.vue';
import PromptModal from './components/PromptModal.vue';
import ConfirmModal from './components/ConfirmModal.vue';
import CryptoJS from 'crypto-js';
import bs58 from 'bs58';
import * as ed from '@stablelib/ed25519';
import axios from 'axios';
export default {
    components: {
        KeyManager,
        DidSelector,
        ResponseDisplay,
        OnboardingModal,
        BackupModal,
        PromptModal,
        ConfirmModal,
    },
    data() {
        return {
            state: {
                storedDids: [],
                selectedDid: '',
                selectedDidData: null,
                responses: [],
                showBackupModal: false,
                backupKey: '',
                showOnboarding: false,
                dontShowOnboarding: false,
                activeTab: 'keys',
                showPromptModal: false,
                promptModal: { title: '', placeholder: '', callback: null },
                showConfirmModal: false,
                confirmModal: { title: '', message: '', callback: null },
                websiteOrigin: '',
            },
            tabs: [
                { id: 'keys', label: 'Manage Keys', tooltip: 'Generate or manage your DID key pairs', disabled: false },
                { id: 'responses', label: 'Responses', tooltip: 'View history of actions and responses', disabled: false },
            ],
        };
    },
    mounted() {
        this.loadSettings();
        this.loadStoredDids();

        chrome.runtime.sendMessage({ action: 'get-current-origin' }, (response) => {
            if (response?.origin) {
                this.state.websiteOrigin = response.origin;
                this.state.activeTab = 'keys';
                localStorage.setItem('activeTab', 'keys');
            }
        });

        window.addEventListener('message', (event) => {
            if (event.data?.action === 'did-selected') {
                const { did, password } = event.data;
                this.handleDidSelected(did, password);
            }
        });
    },
    methods: {
        handleDidSelected(did, password) {
            if (!did || !password) {
                this.addResponse('DID or password missing');
                return;
            }

            this.addResponse('✅ DID selected and sent to website');
            console.log("[Extension] DID sent to frontend:", did);

            // Send DID and password to frontend securely
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'did-selected',
                        did,
                        password,
                    });
                });
            });

            this.addResponse('DID selected and sent to website');
        },

        loadStoredDids() {
            const stored = localStorage.getItem('didKeyPairs');
            this.state.storedDids = stored ? Object.keys(JSON.parse(stored)) : [];
            if (!this.state.storedDids.includes(this.state.selectedDid)) {
                this.state.selectedDid = this.state.storedDids.length > 0 ? this.state.storedDids[0] : '';
            }
            this.state.showOnboarding = this.state.storedDids.length === 0 && !this.state.dontShowOnboarding;
        },

        loadSettings() {
            const dontShow = localStorage.getItem('dontShowOnboarding');
            this.state.dontShowOnboarding = dontShow ? JSON.parse(dontShow) : false;
            const savedTab = localStorage.getItem('activeTab');
            if (savedTab && (this.state.storedDids.length > 0 || savedTab === 'keys' || savedTab === 'responses')) {
                this.state.activeTab = savedTab;
            }
        },

        addResponse(message) {
            this.state.responses.unshift({
                message,
                timestamp: new Date().toLocaleString(),
                type: message.includes('Error') ? 'error' : 'success',
            });
            if (this.state.responses.length > 10) this.state.responses.pop();
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
            localStorage.setItem('activeTab', tab);
            toast.info(`Switched to ${tab.charAt(0).toUpperCase() + tab.slice(1)} tab.`);
        },

        persistDontShowOnboarding() {
            localStorage.setItem('dontShowOnboarding', JSON.stringify(this.state.dontShowOnboarding));
        },

        closeOnboarding() {
            this.state.showOnboarding = false;
            this.persistDontShowOnboarding();
            toast.info('Welcome! You are now in the Manage Keys tab.');
        },

        handleKeyGenerated() {
            this.loadStoredDids();
            this.addResponse("Key pair created or restored!");
            if (this.state.storedDids.length > 0) {
                toast.success('Key pair created or restored!');
            }
        },

        clearResponses() {
            this.state.responses = [];
        },

        downloadBackup() {
            const blob = new Blob([this.state.backupKey], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `did-private-key-${this.state.selectedDid}.txt`;
            a.click();
            URL.revokeObjectURL(url);
            this.state.showBackupModal = false;
            this.addResponse('Private key downloaded successfully!');
        },

        handlePromptSubmit(value) {
            if (this.state.promptModal.callback) this.state.promptModal.callback(value);
            this.state.showPromptModal = false;
        },

        closePromptModal() {
            this.state.showPromptModal = false;
        },

        handleConfirm() {
            if (this.state.confirmModal.callback) this.state.confirmModal.callback(true);
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
    font-family: "JetBrains Mono", monospace !important;
}

.tooltip {
    position: relative;
}

.tooltip:hover:after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(150%);
    background: #333;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 99;
}

.parent_2 {
    width: 100%;
    background: #fff;
    height: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    align-items: center;
    font-family: "JetBrains Mono", monospace !important;
    /* border: 1px solid red */
}

.basic_child_3 {
    width: 80px;
    height: 10px;
    background: #010101;
}

.basic_child_4 {
    width: 50px;
    height: 10px;
    background: #010101;
    margin-right: 15px;
}

.main_container_ {
    border: 1px solid white;
    max-height: 485px;
    overflow-y: scroll;
    overflow-x: hidden;
}

.main_container_::-webkit-scrollbar {
    display: none;
}
</style>
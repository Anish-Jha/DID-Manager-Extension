<template>
    <div class="border border-gray-600 p-4 rounded-lg shadow-md bg-black text-white">
        <h3 class="text-green-400 text-lg font-semibold mb-3">Select DID</h3>

        <input v-model="searchQuery" type="text"
            class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-3 focus:ring-2 focus:ring-yellow-400 outline-none"
            placeholder="Search DIDs..." />

        <select v-model="localSelectedDid"
            class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-3 focus:ring-2 focus:ring-yellow-400 outline-none"
            :disabled="filteredDids.length === 0" @change="promptPassword">
            <option value="">Select a DID</option>
            <option v-for="entry in filteredDids" :key="entry.did" :value="entry.did" :title="entry.did">
                {{ truncateDid(entry.did) }} ({{ formatDate(entry.createdAt) }})
            </option>
        </select>

        <p v-if="errorMessage" class="text-red-500 text-sm mt-2">{{ errorMessage }}</p>
    </div>
</template>

<script>
import CryptoJS from 'crypto-js';
import bs58 from 'bs58';
import * as ed from '@stablelib/ed25519';
export default {
    props: {
        dids: {
            type: Array,
            default: () => [],
        },
    },
    data() {
        return {
            localSelectedDid: '',
            searchQuery: '',
            errorMessage: '',
        };
    },
    computed: {
        filteredDids() {
            let stored = {};
            try {
                stored = JSON.parse(localStorage.getItem('didKeyPairs')) || {};
            } catch (e) {
                console.error('Error parsing DID storage:', e);
            }
            return this.dids.map(did => ({
                did,
                createdAt: stored[did]?.createdAt || new Date().toISOString(),
            }))
                .filter(entry => entry.did.toLowerCase().includes(this.searchQuery.toLowerCase()))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },
    },
    methods: {
        promptPassword() {
            if (!this.localSelectedDid) {
                this.errorMessage = 'Please select a DID.';
                return;
            }

            this.$emit('show-prompt', {
                title: 'Decrypt Private Key',
                placeholder: 'Enter password to decrypt your private key',
                callback: (password) => {
                    if (!password?.trim()) {
                        this.errorMessage = 'Password is required.';
                        this.localSelectedDid = '';
                        return;
                    }
                    this.sendSelection(password);
                },
            });
        },

        sendSelection(password) {
            if (!this.localSelectedDid || !password?.trim()) {
                this.errorMessage = 'DID and password are required.';
                this.localSelectedDid = '';
                return;
            }

            this.$emit('did-selected', { did: this.localSelectedDid, password });

            window.postMessage({
                action: 'did-selected',
                did: this.localSelectedDid,
                password,
            }, window.location.origin);

            this.errorMessage = '';
        },

        truncateDid(did) {
            return did.length > 30 ? `${did.slice(0, 20)}...${did.slice(-6)}` : did;
        },

        formatDate(dateStr) {
            const date = new Date(dateStr);
            return isNaN(date) ? 'Unknown' : date.toLocaleDateString();
        },
    },
};
</script>

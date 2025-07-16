<!-- DidGenerate.vue -->
<template>
  <div class="text-white flex flex-col items-center justify-center p-4 w-full h-full">
    <h3 class="text-white text-2xl font-bold mb-2">Generate a new DID</h3>
    <p class="text-center text-gray-500 text-base font-semibold">
      Generate your unique digital identity for secure,<br> password-free logins
    </p>
    <div class="mt-12 mb-6 w-full max-w-md border border-gray-700 rounded-lg p-4">
      <div v-if="!keyInfo">
        <label for="did-name" class="text-white text-sm font-medium mb-2 block">DID Name</label>
        <input
          id="did-name"
          v-model="didName"
          type="text"
          class="w-full bg-transparent text-white text-base border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none"
          placeholder="Enter a name for your DID"
        />
        <button
          class="bg-[#D7DF23] text-black text-lg font-semibold px-4 py-2 rounded transition flex items-center justify-center gap-2 w-full"
          :disabled="isLoading || !didName.trim()"
          @click="generateKeyPair"
        >
          Create DID
          <span
            v-if="isLoading"
            class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"
          ></span>
        </button>
      </div>
    </div>

    <button
      class="text-gray-500 text-sm underline cursor-pointer"
      @click="$emit('back')"
    >
      Back to Options
    </button>
  </div>
</template>

<script>
import * as ed from '@stablelib/ed25519';
import bs58 from 'bs58';
import CryptoJS from 'crypto-js';

export default {
  name: 'DidGenerate',
  props: {
    extensionPassword: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      didName: '',
      keyInfo: null,
      isLoading: false,
    };
  },
  methods: {
    async generateKeyPair() {
      if (!this.didName.trim()) {
        this.$emit('response', 'Please enter a DID name.');
        return;
      }
      this.isLoading = true;
      try {
        const keyPair = ed.generateKeyPair();
        const publicKey = keyPair.publicKey;
        const secretKey = keyPair.secretKey;
        const did = `did:decast:${bs58.encode(publicKey)}`;

        const encryptedSecretKey = CryptoJS.AES.encrypt(
          bs58.encode(secretKey),
          this.extensionPassword
        ).toString();

        chrome.storage.local.get(['didKeyPairs'], (result) => {
          const stored = JSON.parse(result.didKeyPairs || '{}');
          stored[did] = {
            name: this.didName.trim(),
            publicKey: bs58.encode(publicKey),
            secretKey: encryptedSecretKey,
            createdAt: new Date().toISOString(),
          };

          chrome.storage.local.set(
            { didKeyPairs: JSON.stringify(stored) },
            () => {
              console.log('DID key pair stored successfully in chrome.storage.local');
              localStorage.setItem('didKeyPairs', JSON.stringify(stored));

              this.keyInfo = { did, publicKey: bs58.encode(publicKey) };
              this.$emit('response', `DID "${this.didName}" generated successfully!`);
              this.$emit('key-generated');
              this.isLoading = false;
            }
          );
        });
      } catch (error) {
        this.$emit('response', `Error generating key pair: ${error.message}`);
        this.isLoading = false;
      }
    },

    resetForm() {
      this.didName = '';
      this.keyInfo = null;
      this.isLoading = false;
    },

    truncateDid(did) {
      return did.length > 30 ? `${did.slice(0, 30)}...${did.slice(-16)}` : did;
    },
  },
};
</script>

<style scoped>
* {
  font-family: 'Rethink Sans', sans-serif !important;
}
</style>
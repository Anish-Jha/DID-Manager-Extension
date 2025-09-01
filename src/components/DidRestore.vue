<!-- DidRestore.vue -->
<template>
  <div class="text-white flex flex-col items-center justify-start p-2 w-full h-full">
    <h3 class="text-white text-2xl font-bold mb-2">Restore Your Identity</h3>
    <p class="text-center text-gray-500 text-base font-semibold">
      Paste your private key to restore your Identity. Then, <br> set a new password to protect it.
    </p>
    <div class="mt-6 mb-2 w-full max-w-md border border-gray-700 rounded-lg p-4">
      <div v-if="!keyInfo">
        <label for="did-name" class="text-white text-sm font-medium mb-2 block">Identity Name</label>
        <input id="did-name" v-model="didName" type="text"
          class="w-full bg-transparent text-white text-base border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none"
          placeholder="Enter a name for your Identity" />
        <label for="private-key" class="text-white text-sm font-medium mb-2 block">Private Key</label>
        <input id="private-key" v-model="restoreKeyInput" type="text"
          class="w-full bg-transparent text-white text-base border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none"
          placeholder="Paste your private key (base58)" />
        <button
          class="bg-[#D7DF23] text-black text-lg font-semibold px-4 py-2 rounded transition flex items-center justify-center gap-2 w-full"
          :disabled="isLoading || !didName.trim() || !restoreKeyInput.trim()" @click="restorePrivateKey">
          Restore ID
          <span v-if="isLoading"
            class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
        </button>
      </div>
      <button
        class="w-full text-center bg-transparent text-underline font-semibold text-base border-none outline-none text-gray-500 mt-4"
        @click="$emit('back')" aria-label="Back to DID Profile">
        back
      </button>
    </div>
  </div>
</template>

<script>
import * as ed from '@stablelib/ed25519';
import bs58 from 'bs58';
import CryptoJS from 'crypto-js';

export default {
  name: 'DidRestore',
  props: {
    extensionPassword: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      didName: '',
      restoreKeyInput: '',
      keyInfo: null,
      isLoading: false,
    };
  },
  methods: {
    async restorePrivateKey() {
      if (!this.didName.trim()) {
        this.$emit('response', 'Please enter a DID name.');
        return;
      }
      if (!this.restoreKeyInput.trim()) {
        this.$emit('response', 'Please enter a private key.');
        return;
      }
      this.isLoading = true;
      try {
        const cleanKey = this.restoreKeyInput.trim();
        const decodedKey = bs58.decode(cleanKey);
        if (decodedKey.length !== 64) throw new Error('Invalid private key length.');

        const publicKey = ed.extractPublicKeyFromSecretKey(decodedKey);
        const did = `did:decast:${bs58.encode(publicKey)}`;

        const didData = {
          did,
          name: this.didName.trim(),
          publicKey: bs58.encode(publicKey),
          rawSecretKey: cleanKey,
          createdAt: new Date().toISOString(),
        };

        // Encrypt the entire didData object
        const encryptedDidData = CryptoJS.AES.encrypt(
          JSON.stringify(didData),
          this.extensionPassword
        ).toString();

        this.keyInfo = { did, publicKey: bs58.encode(publicKey) };
        this.$emit('key-generated', { did, encryptedDidData });
        this.$emit('response', `DID "${this.didName}" restored successfully!`);
        this.isLoading = false;
      } catch (error) {
        this.$emit('response', `Error restoring private key: ${error.message}`);
        this.isLoading = false;
      }
    },
    resetForm() {
      this.didName = '';
      this.restoreKeyInput = '';
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
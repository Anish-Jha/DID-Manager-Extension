<!-- DidGenerate.vue -->
<template>
  <div class="text-white flex flex-col items-center justify-center w-full h-full">
      <div v-if="!keyInfo" class="w-full max-w-md p-6 rounded-lg shadow-md flex flex-col items-center justify-start">
        <div>
          <img class="w-48 h-auto object-contain" src="../icons/avatar.png" alt="">
        </div>
       <div class="w-full mt-4">
         <label for="did-name" class="text-white text-lg font-medium mb-2 block">Identifier name</label>
        <div class="w-full flex justify-between items-center bg-transparent text-white text-base border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none">
          <input
          id="did-name"
          v-model="didName"
          class="bg-transparent flex-grow text-white text-base outline-none"
          type="text"
          placeholder="uniquename"
        />
        <p class="text-base text-white">.decast</p>
        </div>
        <button
          class="bg-[#D7DF23] text-black text-lg font-semibold px-4 py-2 rounded transition flex items-center justify-center gap-2 w-full"
          :disabled="isLoading || !didName.trim()"
          @click="generateKeyPair"
        >
          Claim DID
          <span
            v-if="isLoading"
            class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"
          ></span>
        </button>
       </div>
      </div>
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

        // Encrypt the secret key
        const encryptedSecretKey = CryptoJS.AES.encrypt(
          bs58.encode(secretKey),
          this.extensionPassword || 'temp',
          { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
        ).toString();

        const didData = {
          did,
          name: this.didName.trim(),
          publicKey: bs58.encode(publicKey),
          secretKey: encryptedSecretKey,
          createdAt: new Date().toISOString(),
          rawSecretKey: bs58.encode(secretKey), // For backup only, not stored
        };

        this.keyInfo = { did, publicKey: bs58.encode(publicKey) };
        this.$emit('key-generated', didData);
        this.isLoading = false;
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
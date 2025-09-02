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
    isValidBase58(str) {
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      return base58Regex.test(str);
    },
    async restorePrivateKey() {
      if (!this.didName.trim()) {
        this.$emit('response', 'Please enter a DID name.');
        return;
      }
      if (!this.restoreKeyInput.trim()) {
        this.$emit('response', 'Please enter a private key.');
        return;
      }
      if (!this.extensionPassword) {
        this.$emit('response', 'Extension password is missing.');
        return;
      }
      this.isLoading = true;
      try {
        const cleanKey = this.restoreKeyInput.trim();
        console.log('Restoring private key, length:', cleanKey.length, 'password length:', this.extensionPassword.length);

        if (!this.isValidBase58(cleanKey)) {
          throw new Error('Invalid private key: contains non-Base58 characters.');
        }

        let decodedKey;
        try {
          decodedKey = bs58.decode(cleanKey);
        } catch (error) {
          throw new Error('Invalid private key: failed to decode Base58 string.');
        }
        if (decodedKey.length !== 64) {
          throw new Error(`Invalid private key: expected 64 bytes, got ${decodedKey.length} bytes.`);
        }

        let publicKey;
        try {
          publicKey = ed.extractPublicKeyFromSecretKey(decodedKey);
        } catch (error) {
          throw new Error('Invalid private key: cannot derive public key.');
        }
        if (publicKey.length !== 32) {
          throw new Error(`Invalid public key: expected 32 bytes, got ${publicKey.length} bytes.`);
        }

        try {
          const testMessage = new TextEncoder().encode('test');
          const testSignature = ed.sign(decodedKey, testMessage);
          if (!ed.verify(publicKey, testMessage, testSignature)) {
            throw new Error('Invalid private key: test signature verification failed.');
          }
        } catch (error) {
          throw new Error('Invalid private key: cannot perform signing operation.');
        }

        const did = `did:decast:${bs58.encode(publicKey)}`;

        const encryptedSecretKey = CryptoJS.AES.encrypt(cleanKey, this.extensionPassword, {
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        }).toString();

        try {
          const decryptedKey = CryptoJS.AES.decrypt(encryptedSecretKey, this.extensionPassword, {
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
          }).toString(CryptoJS.enc.Utf8);
          if (decryptedKey !== cleanKey) {
            throw new Error('Encryption error: decrypted key does not match original.');
          }
          console.log('Decryption test passed, decrypted key length:', decryptedKey.length);
        } catch (error) {
          throw new Error('Encryption error: failed to decrypt secret key.');
        }

        const didData = {
          did,
          name: this.didName.trim(),
          publicKey: bs58.encode(publicKey),
          secretKey: encryptedSecretKey,
          createdAt: new Date().toISOString(),
          rawSecretKey: cleanKey, // For backup only
        };

        this.keyInfo = { did, publicKey: bs58.encode(publicKey) };
        this.$emit('key-generated', didData);
        // this.$emit('response', `DID "${this.didName}" restored successfully!`);
        this.isLoading = false;
      } catch (error) {
        console.error('Restore error:', error.message);
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
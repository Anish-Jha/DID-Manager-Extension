<template>
  <div class="border border-gray-600 p-4 rounded-lg border-dashed shadow-md bg-black text-white">
    <h3 class="text-green-400 text-lg font-semibold mb-4">Manage Keys</h3>

    <div class="mb-6">
      <button class="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition flex items-center gap-2"
        :disabled="isLoading" @click="promptGenerateKeyPair">
        Generate Key Pair
        <span v-if="isLoading && action === 'generate'"
          class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
      </button>
      <pre v-if="keyInfo" class="mt-3 bg-gray-800 p-3 text-sm rounded text-white">{{ truncateDid(keyInfo) }}</pre>
    </div>

    <div class="mb-6">
      <h4 class="text-green-400 text-md font-medium mb-2">Restore Private Key</h4>
      <input v-model="restoreKeyInput" type="text"
        class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-2 focus:ring-2 focus:ring-yellow-400 outline-none"
        placeholder="Paste your private key (base58)" />
      <input v-model="password" type="password"
        class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-3 focus:ring-2 focus:ring-yellow-400 outline-none"
        placeholder="Enter password for encryption" />
      <button class="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition flex items-center gap-2"
        :disabled="isLoading || !restoreKeyInput.trim() || !password.trim()" @click="restorePrivateKey">
        Restore Key
        <span v-if="isLoading && action === 'restore'"
          class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full"></span>
      </button>
    </div>

    <div v-if="selectedDid" class="flex gap-3">
      <button class="bg-yellow-600 text-black px-4 py-2 rounded hover:bg-yellow-400 transition" :disabled="isLoading"
        @click="promptBackupPrivateKey">
        Backup Private Key
      </button>
      <button class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition flex items-center gap-2"
        :disabled="isLoading" @click="promptDeleteKeyPair">
        Delete Key Pair
        <span v-if="isLoading && action === 'delete'"
          class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
      </button>
    </div>
  </div>
</template>

<script>
import * as ed from '@stablelib/ed25519';
import bs58 from 'bs58';
import CryptoJS from 'crypto-js';

export default {
  props: {
    selectedDid: String,
  },
  data() {
    return {
      keyInfo: '',
      restoreKeyInput: '',
      password: '',
      isLoading: false,
      action: '',
    };
  },
  methods: {
    promptGenerateKeyPair() {
      this.$emit('show-prompt', {
        title: 'Encrypt Private Key',
        placeholder: 'Enter password to encrypt your private key',
        callback: async (password) => {
          if (!password?.trim()) {
            this.$emit('response', 'Password is required for key encryption.');
            return;
          }
          await this.generateKeyPair(password);
        },
      });
    },

    async generateKeyPair(password) {
      this.isLoading = true;
      this.action = 'generate';
      try {
        const keyPair = ed.generateKeyPair();
        const publicKey = keyPair.publicKey;
        const secretKey = keyPair.secretKey;
        const did = `did:decast:${bs58.encode(publicKey)}`;

        const encryptedSecretKey = CryptoJS.AES.encrypt(bs58.encode(secretKey), password).toString();

        // Get existing keys from chrome.storage.local
        chrome.storage.local.get(["didKeyPairs"], (result) => {
          const stored = JSON.parse(result.didKeyPairs || "{}");
          stored[did] = {
            publicKey: bs58.encode(publicKey),
            secretKey: encryptedSecretKey,
            createdAt: new Date().toISOString(),
          };

          chrome.storage.local.set({ didKeyPairs: JSON.stringify(stored) }, () => {
            console.log("DID key pair stored successfully in chrome.storage.local");

            // Optionally keep localStorage for UI only
            localStorage.setItem('didKeyPairs', JSON.stringify(stored));

            this.keyInfo = `DID: ${did}\nPublic Key (base58): ${bs58.encode(publicKey)}\nSecret Key: [hidden]`;
            this.$emit('response', 'Key pair generated and stored successfully!');
            this.$emit('key-generated');
            this.isLoading = false;
          });
        });
      } catch (error) {
        this.$emit('response', `Error generating key pair: ${error.message}`);
        this.isLoading = false;
      }
    },

    async restorePrivateKey() {
      this.isLoading = true;
      this.action = 'restore';
      try {
        const cleanKey = this.restoreKeyInput.trim();
        const decodedKey = bs58.decode(cleanKey);
        if (decodedKey.length !== 64) throw new Error('Invalid private key length.');

        const publicKey = ed.extractPublicKeyFromSecretKey(decodedKey);
        const did = `did:decast:${bs58.encode(publicKey)}`;

        const encryptedSecretKey = CryptoJS.AES.encrypt(cleanKey, this.password).toString();

        chrome.storage.local.get(["didKeyPairs"], (result) => {
          const stored = JSON.parse(result.didKeyPairs || "{}");
          stored[did] = {
            publicKey: bs58.encode(publicKey),
            secretKey: encryptedSecretKey,
            createdAt: new Date().toISOString(),
          };

          chrome.storage.local.set({ didKeyPairs: JSON.stringify(stored) }, () => {
            console.log("Private key restored and stored in chrome.storage.local");

            // Optionally keep localStorage for UI
            localStorage.setItem('didKeyPairs', JSON.stringify(stored));

            this.keyInfo = `DID: ${did}\nPublic Key (base58): ${bs58.encode(publicKey)}\nSecret Key: [hidden]`;
            this.$emit('response', 'Private key restored successfully!');
            this.$emit('key-generated');
            this.restoreKeyInput = '';
            this.password = '';
            this.isLoading = false;
          });
        });
      } catch (error) {
        this.$emit('response', `Error restoring private key: ${error.message}`);
        this.isLoading = false;
      }
    }
    ,

    promptBackupPrivateKey() {
      if (!this.selectedDid) {
        this.$emit('response', 'Please select a DID first.');
        return;
      }
      this.$emit('show-prompt', {
        title: 'Decrypt Private Key',
        placeholder: 'Enter the password used to encrypt this key',
        callback: (password) => {
          if (!password?.trim()) {
            this.$emit('response', 'Password is required for backup.');
            return;
          }
          this.backupPrivateKey(password);
        },
      });
    },

    backupPrivateKey(password) {
      const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
      const keyPair = stored[this.selectedDid];
      if (!keyPair) {
        this.$emit('response', 'No key pair found for the selected DID.');
        return;
      }
      try {
        const decryptedBytes = CryptoJS.AES.decrypt(keyPair.secretKey, password);
        const decryptedKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedKey) throw new Error('Incorrect password.');

        this.$emit('show-backup', `${decryptedKey}`);
        this.$emit('response', 'Backup private key retrieved successfully.');
      } catch (error) {
        this.$emit('response', `Error decrypting private key: ${error.message}`);
      }
    },

    promptDeleteKeyPair() {
      if (!this.selectedDid) {
        this.$emit('response', 'Please select a DID first.');
        return;
      }
      this.$emit('show-confirm', {
        title: 'Delete DID',
        message: `Are you sure you want to delete DID ${this.selectedDid}? This cannot be undone.`,
        callback: (confirmed) => {
          if (confirmed) this.deleteKeyPair();
        },
      });
    },

    deleteKeyPair() {
      this.isLoading = true;
      this.action = 'delete';
      try {
        chrome.storage.local.get(["didKeyPairs"], (result) => {
          const stored = JSON.parse(result.didKeyPairs || "{}");

          if (!stored[this.selectedDid]) {
            this.$emit('response', `No key pair found for DID ${this.selectedDid}`);
            this.isLoading = false;
            return;
          }

          delete stored[this.selectedDid];

          chrome.storage.local.set({ didKeyPairs: JSON.stringify(stored) }, () => {
            console.log(`DID ${this.selectedDid} deleted from chrome.storage.local`);

            // Optionally keep localStorage for UI
            localStorage.setItem('didKeyPairs', JSON.stringify(stored));

            this.$emit('response', `DID ${this.selectedDid} deleted successfully.`);
            this.$emit('key-generated');
            this.keyInfo = '';
            this.isLoading = false;
          });
        });
      } catch (error) {
        this.$emit('response', `Error deleting key pair: ${error.message}`);
        this.isLoading = false;
      }
    }
    ,
    truncateDid(did) {
      return did.length > 30 ? `${did.slice(0, 30)}...${did.slice(-16)}` : did;
    },
  },
};
</script>

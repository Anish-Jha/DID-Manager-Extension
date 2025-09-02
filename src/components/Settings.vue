<template>
  <div class="text-white flex flex-col items-center justify-center p-2 w-full h-full">
    <h3 class="text-white text-2xl font-bold mb-2">Manage Your Identities</h3>
    <p class="text-center text-gray-500 text-base font-semibold">
      Safely manage your existing identities: view, back them up, or delete when needed.
    </p>
    <div class="mt-6 mb-6 w-full max-w-md border border-gray-700 rounded-lg p-4">
      <div class="space-y-4">
        <div>
          <label for="did-select" class="text-white text-base font-medium mb-2 block">Select an Identity</label>
          <select id="did-select" :value="selectedDid" @change="$emit('update:selected-did', $event.target.value)"
            class="w-full bg-transparent text-white bg-gray-800 text-base border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none">
            <option class="text-white bg-[#15161E]" value="" disabled>Select Identity</option>
            <option class="text-white bg-[#15161E]" v-for="did in storedDids" :key="did.did" :value="did.did">
              {{ did.name || truncateDid(did.did) }}
            </option>
          </select>
        </div>
        <div v-if="storedDids.length === 0" class="text-gray-500 text-center text-sm">
          No identities found. Please generate or restore a DID.
        </div>
        <div v-else-if="selectedDid" class="flex gap-3">
          <button
            class="bg-[#D7DF23] text-black text-lg font-semibold px-4 py-2 rounded hover:bg-yellow-500 transition flex items-center justify-center gap-2 flex-1"
            :disabled="isLoading" @click="backupPrivateKey">
            Backup Key
          </button>
          <button
            class="bg-red-600 text-white text-lg font-semibold px-4 py-2 rounded hover:bg-red-500 transition flex items-center justify-center gap-2 flex-1"
            :disabled="isLoading" @click="$emit('delete-did')">
            Delete ID
            <span v-if="isLoading && action === 'delete'"
              class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
          </button>
        </div>
        <div v-else class="text-gray-500 text-center text-sm">
          No DID selected. Please select a DID from the dropdown.
        </div>
      </div>
      <button
        class="w-full text-center bg-transparent text-underline font-semibold text-base border-none outline-none text-gray-500 mt-4"
        @click="$emit('back')" aria-label="Back to DID Profile">
        back
      </button>
    </div>
    <p v-if="errorMessage" class="text-red-500 text-sm mt-2">{{ errorMessage }}</p>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js';

export default {
  name: 'Settings',
  props: {
    selectedDid: {
      type: String,
      default: '',
    },
    extensionPassword: {
      type: String,
      required: true,
    },
  },
  emits: ['update:selected-did', 'show-backup', 'delete-did', 'response'],
  data() {
    return {
      isLoading: false,
      action: '',
      storedDids: [],
      errorMessage: '',
    };
  },
  mounted() {
    this.loadStoredDids();
  },
  watch: {
    selectedDid(newDid) {
      console.log('Selected DID updated:', newDid);
      if (!newDid) {
        this.$emit('response', 'No DID selected.');
      }
    },
    extensionPassword() {
      this.loadStoredDids();
    },
  },
  methods: {
    loadStoredDids() {
      chrome.storage.local.get(['didKeyPairs'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving didKeyPairs:', chrome.runtime.lastError.message);
          this.errorMessage = 'Error loading DID profiles.';
          this.$emit('response', 'Error loading DID profiles.');
          return;
        }

        let stored = {};
        if (result.didKeyPairs) {
          try {
            if (this.extensionPassword) {
              const decrypted = CryptoJS.AES.decrypt(
                result.didKeyPairs,
                this.extensionPassword,
                { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
              ).toString(CryptoJS.enc.Utf8);
              stored = JSON.parse(decrypted || '{}');
            } else {
              // Handle first-time users with unencrypted didKeyPairs
              stored = JSON.parse(result.didKeyPairs || '{}');
            }
          } catch (error) {
            console.error('Error decrypting didKeyPairs:', error.message);
            this.errorMessage = 'Failed to decrypt DID profiles. Please ensure your password is correct.';
            this.$emit('response', 'Failed to decrypt DID profiles. Please ensure your password is correct.');
            return;
          }
        }

        this.storedDids = Object.keys(stored).map(did => ({
          did,
          name: stored[did].name,
        }));

        if (this.storedDids.length === 0) {
          this.errorMessage = 'No DID profiles found. Please generate or restore a DID.';
          this.$emit('response', 'No DID profiles found.');
        } else if (!this.storedDids.some(d => d.did === this.selectedDid)) {
          const newSelectedDid = this.storedDids.length > 0 ? this.storedDids[0].did : '';
          console.log('Setting initial selectedDid:', newSelectedDid);
          this.$emit('update:selected-did', newSelectedDid);
        }
      });
    },
    backupPrivateKey() {
      if (!this.selectedDid) {
        this.errorMessage = 'Please select a DID first.';
        this.$emit('response', 'Please select a DID first.');
        return;
      }
      console.log('Backing up DID:', this.selectedDid);
      this.isLoading = true;
      this.action = 'backup';
      chrome.storage.local.get(['didKeyPairs'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error retrieving didKeyPairs:', chrome.runtime.lastError.message);
          this.errorMessage = 'Error accessing DID data.';
          this.$emit('response', 'Error accessing DID data.');
          this.isLoading = false;
          return;
        }

        let stored = {};
        try {
          if (this.extensionPassword) {
            const decrypted = CryptoJS.AES.decrypt(
              result.didKeyPairs,
              this.extensionPassword,
              { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            ).toString(CryptoJS.enc.Utf8);
            stored = JSON.parse(decrypted || '{}');
          } else {
            stored = JSON.parse(result.didKeyPairs || '{}');
          }
        } catch (error) {
          console.error('Error decrypting didKeyPairs:', error.message);
          this.errorMessage = 'Failed to decrypt DID data. Please ensure your password is correct.';
          this.$emit('response', 'Failed to decrypt DID data. Please ensure your password is correct.');
          this.isLoading = false;
          return;
        }

        const keyPair = stored[this.selectedDid];
        if (!keyPair) {
          this.errorMessage = 'No key pair found for the selected DID.';
          this.$emit('response', 'No key pair found for the selected DID.');
          this.isLoading = false;
          return;
        }

        try {
          console.log('Attempting secret key decryption with password:', this.extensionPassword);
          console.log('Encrypted secret key:', keyPair.secretKey);
          const decryptedBytes = CryptoJS.AES.decrypt(
            keyPair.secretKey,
            this.extensionPassword,
            { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
          );
          const decryptedKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
          if (!decryptedKey) {
            throw new Error('Decryption failed, possibly due to incorrect password.');
          }
          console.log('Decrypted key:', decryptedKey);
          this.$emit('show-backup', decryptedKey);
          this.isLoading = false;
        } catch (error) {
          console.error('Decryption error:', error.message);
          this.errorMessage = `Error decrypting private key: ${error.message}`;
          this.$emit('response', `Error decrypting private key: ${error.message}`);
          this.isLoading = false;
        }
      });
    },
    truncateDid(did) {
      return did.length > 30 ? `${did.slice(0, 12)}...${did.slice(-12)}` : did;
    },
  },
};
</script>

<style scoped>
* {
  font-family: 'Rethink Sans', sans-serif !important;
}
</style>
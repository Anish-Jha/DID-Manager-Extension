<!-- KeyManager.vue -->
<template>
  <div class="border border-gray-600 p-4 rounded-lg border-dashed shadow-md bg-black text-white">
    <h3 class="text-green-400 text-lg font-semibold mb-4">Manage Keys</h3>

    <div v-if="selectedDid" class="flex gap-3">
      <button
        class="bg-yellow-600 text-black px-4 py-2 rounded hover:bg-yellow-400 transition"
        :disabled="isLoading"
        @click="backupPrivateKey"
      >
        Backup Private Key
      </button>
      <button
        class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition flex items-center gap-2"
        :disabled="isLoading"
        @click="promptDeleteKeyPair"
      >
        Delete Key Pair
        <span
          v-if="isLoading && action === 'delete'"
          class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
        ></span>
      </button>
    </div>
  </div>
</template>

<script>
import CryptoJS from 'crypto-js';

export default {
  props: {
    selectedDid: String,
    extensionPassword: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      isLoading: false,
      action: '',
    };
  },
  methods: {
    backupPrivateKey() {
      if (!this.selectedDid) {
        this.$emit('response', 'Please select a DID first.');
        return;
      }
      const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
      const keyPair = stored[this.selectedDid];
      if (!keyPair) {
        this.$emit('response', 'No key pair found for the selected DID.');
        return;
      }
      try {
        const decryptedBytes = CryptoJS.AES.decrypt(keyPair.secretKey, this.extensionPassword);
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
        chrome.storage.local.get(['didKeyPairs'], (result) => {
          const stored = JSON.parse(result.didKeyPairs || '{}');

          if (!stored[this.selectedDid]) {
            this.$emit('response', `No key pair found for DID ${this.selectedDid}`);
            this.isLoading = false;
            return;
          }

          delete stored[this.selectedDid];

          chrome.storage.local.set(
            { didKeyPairs: JSON.stringify(stored) },
            () => {
              console.log(`DID ${this.selectedDid} deleted from chrome.storage.local`);
              localStorage.setItem('didKeyPairs', JSON.stringify(stored));

              this.$emit('response', `DID ${this.selectedDid} deleted successfully.`);
              this.$emit('key-generated');
              this.isLoading = false;
            }
          );
        });
      } catch (error) {
        this.$emit('response', `Error deleting key pair: ${error.message}`);
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
* {
  font-family: 'Rethink Sans', sans-serif !important;
}
</style>
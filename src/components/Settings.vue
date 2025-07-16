<!-- Settings.vue -->
<template>
  <div class="text-white flex flex-col items-center justify-center p-2 w-full h-full">
    <h3 class="text-white text-2xl font-bold mb-2">Manage Your DIDs</h3>
    <p class="text-center text-gray-500 text-base font-semibold">
      Safely manage your existing DIDs: view, back them up, or delete when needed.
    </p>
    <div class="mt-6 mb-6 w-full max-w-md border border-gray-700 rounded-lg p-4">
      <div class="space-y-4">
        <div>
          <label for="did-select" class="text-white text-base font-medium mb-2 block">Select a DID profile</label>
          <select
            id="did-select"
            :value="selectedDid"
            @change="$emit('update:selectedDid', $event.target.value)"
            class="w-full bg-transparent text-white bg-gray-800 text-base border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none"
          >
            <option class="text-white bg-[#15161E]" value="" disabled>Select a DID</option>
            <option class="text-white bg-[#15161E]" v-for="did in storedDids" :key="did.did" :value="did.did">
              {{ did.name || truncateDid(did.did) }}
            </option>
          </select>
        </div>
        <div v-if="selectedDid" class="flex gap-3">
          <button
            class="bg-[#D7DF23] text-black text-lg font-semibold px-4 py-2 rounded hover:bg-yellow-500 transition flex items-center justify-center gap-2 flex-1"
            :disabled="isLoading"
            @click="backupPrivateKey"
          >
            Backup Key
          </button>
          <button
            class="bg-red-600 text-white text-lg font-semibold px-4 py-2 rounded hover:bg-red-500 transition flex items-center justify-center gap-2 flex-1"
            :disabled="isLoading"
            @click="promptDeleteKeyPair"
          >
            Delete DID
            <span
              v-if="isLoading && action === 'delete'"
              class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
            ></span>
          </button>
        </div>
        <div v-else class="text-gray-500 text-center text-sm">
          No DID selected. Please select a DID from the dropdown.
        </div>
      </div>
    </div>
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
  data() {
    return {
      isLoading: false,
      action: '',
      storedDids: [],
    };
  },
  computed: {
    storedDids() {
      const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
      return Object.keys(stored).map(did => ({
        did,
        name: stored[did].name,
      }));
    },
  },
  watch: {
    selectedDid(newDid) {
      console.log('Selected DID updated:', newDid);
      if (!newDid) {
        this.$emit('response', 'No DID selected.');
      }
    },
  },
  mounted() {
    this.loadStoredDids();
  },
  methods: {
    loadStoredDids() {
      const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
      this.storedDids = Object.keys(stored).map(did => ({
        did,
        name: stored[did].name,
      }));
      if (!this.storedDids.some(d => d.did === this.selectedDid)) {
        const newSelectedDid = this.storedDids.length > 0 ? this.storedDids[0].did : '';
        console.log('Setting initial selectedDid:', newSelectedDid);
        this.$emit('update:selectedDid', newSelectedDid);
      }
    },

    backupPrivateKey() {
      if (!this.selectedDid) {
        this.$emit('response', 'Please select a DID first.');
        return;
      }
      console.log('Backing up DID:', this.selectedDid);
      const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
      const keyPair = stored[this.selectedDid];
      if (!keyPair) {
        this.$emit('response', 'No key pair found for the selected DID.');
        return;
      }
      try {
        console.log('Attempting decryption with password:', this.extensionPassword);
        console.log('Encrypted secret key:', keyPair.secretKey);
        const decryptedBytes = CryptoJS.AES.decrypt(keyPair.secretKey, this.extensionPassword);
        const decryptedKey = decryptedBytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedKey) {
          throw new Error('Decryption failed, possibly due to incorrect password.');
        }
        console.log('Decrypted key:', decryptedKey);

        this.$emit('show-backup', decryptedKey);
        this.$emit('response', `Private key for "${keyPair.name || this.truncateDid(this.selectedDid)}" retrieved successfully.`);
      } catch (error) {
        console.error('Decryption error:', error.message);
        this.$emit('response', `Error decrypting private key: ${error.message}`);
      }
    },

    promptDeleteKeyPair() {
      if (!this.selectedDid) {
        this.$emit('response', 'Please select a DID first.');
        return;
      }
      console.log('Prompting to delete DID:', this.selectedDid);
      const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
      const keyPair = stored[this.selectedDid];
      if (!keyPair) {
        this.$emit('response', `No key pair found for DID ${this.truncateDid(this.selectedDid)}`);
        return;
      }
      this.$emit('show-confirm', {
        title: 'Delete DID',
        message: `Are you sure you want to delete DID "${keyPair.name || this.truncateDid(this.selectedDid)}"? This cannot be undone.`,
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
          const keyPair = stored[this.selectedDid];
          if (!keyPair) {
            this.$emit('response', `No key pair found for DID ${this.truncateDid(this.selectedDid)}`);
            this.isLoading = false;
            return;
          }

          delete stored[this.selectedDid];

          chrome.storage.local.set(
            { didKeyPairs: JSON.stringify(stored) },
            () => {
              console.log(`DID ${this.selectedDid} deleted from chrome.storage.local`);
              localStorage.setItem('didKeyPairs', JSON.stringify(stored));

              this.$emit('response', `DID "${keyPair.name || this.truncateDid(this.selectedDid)}" deleted successfully.`);
              this.$emit('key-generated'); 
              this.loadStoredDids();
              this.$emit('update:selectedDid', this.storedDids.length > 0 ? this.storedDids[0].did : '');
              this.isLoading = false;
            }
          );
        });
      } catch (error) {
        console.error('Error deleting key pair:', error.message);
        this.$emit('response', `Error deleting key pair: ${error.message}`);
        this.isLoading = false;
      }
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
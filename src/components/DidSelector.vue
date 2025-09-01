<!-- DidSelector.vue -->
<template>
  <div class="flex flex-col items-center justify-center w-full h-full">
    <h3 class="text-xl font-semibold text-center text-white mb-4">Connect an Identity</h3>
    <p class="text-gray-500 text-sm font-semibold text-center mb-8">
      Your DID uniquely identifies you on<br />decentralized platforms.
    </p>

    <div class="border border-gray-700 rounded-lg p-4 w-full max-w-md">
      <label for="localselectedDid" class="text-white text-sm font-medium mb-2 block">Select DID Profile</label>
      <select
        v-model="localSelectedDid"
        class="w-full bg-transparent text-white bg-gray-800 text-base border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none"
      >
        <option value="" disabled class="text-white bg-[#15161E]">Choose an ID</option>
        <option
          v-for="entry in storedDids"
          :key="entry.did"
          :value="entry.did"
          class="text-white bg-[#15161E]"
        >
          {{ entry.name ? `${entry.name} - ${truncateDid(entry.did)}` : truncateDid(entry.did) }}
        </option>
      </select>

      <!-- <button
        v-if="localSelectedDid"
        class="w-full bg-[#d7df23] text-black px-6 py-2 rounded-lg font-semibold text-sm hover:bg-[#d7df23]/90 transition"
        @click="confirmSelection"
      >
        Confirm
      </button> -->
    </div>

    <p v-if="storedDids.length === 0" class="text-gray-500 text-sm text-center mt-4">
      No IDs found.
    </p>
    <p v-if="errorMessage" class="text-red-500 text-sm mt-2">{{ errorMessage }}</p>
  </div>
</template>

<script>
export default {
  name: 'DidSelector',
  props: {
    dids: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      localSelectedDid: '',
      errorMessage: '',
    };
  },
  computed: {
    storedDids() {
      return this.dids
        .map((didObj) => {
          const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
          return {
            did: didObj.did,
            name: stored[didObj.did]?.name || '',
            createdAt: stored[didObj.did]?.createdAt || new Date().toISOString(),
          };
        })
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
  },
  watch:{
    localSelectedDid(newVal) {
      this.errorMessage = '';
      if (newVal) {
        this.confirmSelection();
      }
    },
  },
  methods: {
    confirmSelection() {
      if (!this.localSelectedDid) {
        this.errorMessage = 'Please select a DID.';
        return;
      }

      this.errorMessage = '';
      console.log('Selected DID:', this.localSelectedDid);

      // Emit DID as an object for nonce signing
      this.$emit('did-selected', { did: this.localSelectedDid });

      // Post message to content script
      window.postMessage(
        {
          action: 'did-selected',
          did: { did: this.localSelectedDid },
        },
        window.location.origin
      );
    },
    truncateDid(did) {
      return did.length > 30 ? `${did.slice(0, 16)}...${did.slice(-16)}` : did;
    },
  },
};
</script>

<style scoped>
* {
  font-family: 'Rethink Sans', sans-serif !important;
}

::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: #1a1b24;
}
::-webkit-scrollbar-thumb {
  background: #4b4e6d;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #d7df23;
}

select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23D7DF23' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1em;
}
</style>
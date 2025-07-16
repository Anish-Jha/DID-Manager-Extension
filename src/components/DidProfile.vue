<template>
  <div class="text-white bg-[#15161E] h-full w-full flex flex-col items-center px-4 py-2 overflow-y-auto">
    <div class="max-w-2xl w-full">
      <h3 class="text-xl font-bold mb-1 text-center">DID & Activity Logs</h3>
      <p class="text-sm text-gray-400 text-center mb-6">
        View your Decentralized IDs (DIDs) and monitor recent activity logs.
      </p>

      <!-- DID Section -->
      <div class="border border-gray-700 rounded-2xl p-4 mb-6 shadow-sm">
        <h4 class="text-base font-semibold text-white mb-3">Your DIDs</h4>
        <div v-if="storedDids.length === 0" class="text-sm text-gray-500 text-center">
          No DIDs available. Create one to get started.
        </div>
        <ul v-else class="divide-y divide-gray-700 max-h-40 overflow-y-auto">
          <li
            v-for="(did, index) in storedDids"
            :key="did.did"
            class="flex justify-between items-start px-2 py-2 hover:bg-gray-700 cursor-pointer transition rounded"
            role="listitem"
          >
            <p class="text-sm font-medium text-white">{{ did.name || truncateDid(did.did) }}</p>
            <p class="text-xs text-gray-400">{{ truncateDid(did.did) }}</p>
          </li>
        </ul>
      </div>

      <!-- Activity Logs Section -->
      <div class="shadow-sm">
        <Responses :responses="responses" @clear-responses="$emit('clear-responses')" />
      </div>
    </div>
  </div>
</template>

<script>
import Responses from './ResponseDisplay.vue';

export default {
  name: 'DidProfile',
  components: { Responses },
  props: {
    selectedDid: String,
    responses: Array,
  },
  data() {
    return {
      storedDids: [],
    };
  },
  computed: {
    storedDids() {
      const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
      return Object.keys(stored)
        .map(did => ({
          did,
          name: stored[did].name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  watch: {
    selectedDid(newDid) {
      if (!newDid) this.$emit('response', 'No DID selected.');
    },
  },
  mounted() {
    this.loadStoredDids();
  },
  methods: {
    loadStoredDids() {
      const stored = JSON.parse(localStorage.getItem('didKeyPairs') || '{}');
      this.storedDids = Object.keys(stored)
        .map(did => ({
          did,
          name: stored[did].name,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      if (!this.storedDids.some(d => d.did === this.selectedDid)) {
        const fallback = this.storedDids[0]?.did || '';
        this.$emit('update:selectedDid', fallback);
      }
    },
    truncateDid(did) {
      return did.length > 30 ? `${did.slice(0, 20)}...${did.slice(-12)}` : did;
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
</style>

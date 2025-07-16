<!-- Responses.vue -->
<template>
  <div class="p-0">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white text-base text-left font-semibold">Activity Logs</h3>
        <p class="text-gray-500 text-left text-sm">Shows recent activity across decentralized apps</p>
      </div>
      <button
        class="hover:bg-gray-500 transition rounded-full p-1 outline-none"
        @click="clearLogs"
        aria-label="Clear activity logs"
      >
        <img class="w-8 h-8" src="../icons/clear.svg" alt="Clear logs" />
      </button>
    </div>
    <div v-if="mergedResponses.length === 0" class="text-gray-500 text-sm">
      No logs yet.
    </div>
    <div v-for="(response, index) in mergedResponses" :key="index" class="">
      <div
        :class="response.type === 'error' ? 'text-red-500' : 'text-gray-400'"
        class="text-xs border-t border-gray-500 py-2"
      >
        [{{ response.timestamp }}] {{ response.message }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    responses: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      localResponses: [],
    };
  },
  computed: {
    mergedResponses() {
      const local = this.localResponses || [];
      const prop = this.responses || [];
      return [...new Set([...prop, ...local].map(JSON.stringify))].map(JSON.parse);
    },
  },
  mounted() {
    chrome.storage.local.get(['responses'], (result) => {
      if (result.responses) {
        try {
          this.localResponses = JSON.parse(result.responses);
          console.log('Loaded responses from chrome.storage.local:', this.localResponses);
          this.$emit('update:responses', this.localResponses);
        } catch (e) {
          console.error('Error parsing chrome.storage.local responses:', e.message);
          this.$emit('response', 'Error loading logs from storage.');
        }
      }
    });
  },
  methods: {
    clearLogs() {
      this.localResponses = [];
      this.$emit('clear-responses');
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
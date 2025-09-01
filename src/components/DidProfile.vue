<!-- DidProfile.vue -->
<template>
  <div class="text-white bg-[#15161E] h-full w-full flex flex-col items-center px-4 py-2 overflow-y-auto">
    <div class="max-w-md w-full">
      <h3 class="text-xl font-bold mb-1 text-center">Your DID Profile</h3>
      <p class="text-sm text-gray-400 text-center mb-6">
        Your DID uniquely identifies you on <br>
        decentralized platforms.
      </p>

      <!-- DID Section -->
      <div class="border border-gray-700 rounded-2xl p-2 mb-6 shadow-sm">
        <div v-if="storedDids.length === 0" class="text-sm text-gray-500 text-center">
          No DIDs available. Create one to get started.
        </div>
        <ul v-else class="divide-y divide-gray-700 max-h-32 overflow-y-auto">
          <li v-for="(did, index) in storedDids" :key="did.did"
            class="flex justify-between items-start px-2 py-1 hover:bg-gray-700 cursor-pointer transition rounded"
            :class="{ 'bg-transparent': did.did === selectedDid }" @click="$emit('update:selectedDid', did.did)"
            role="listitem">
            <p class="text-base font-medium text-white">{{ did.name }}</p>
            <p class="text-base text-gray-400">{{ truncateDid(did.did) }}</p>
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
    selectedDid: {
      type: String,
      required: true,
    },
    responses: {
      type: Array,
      required: true,
    },
    storedDids: {
      type: Array,
      required: true,
    },
  },
  methods: {
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
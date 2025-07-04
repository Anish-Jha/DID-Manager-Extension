<template>
  <Dialog as="div" :open="true" @close="$emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        class="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl transform transition-all"
      >
        <DialogTitle class="text-xl font-semibold text-[#d7df23] mb-2">Backup Private Key</DialogTitle>
        <DialogDescription class="text-gray-300 mb-4">
          Download or copy the private key below and store it securely. Do not share it!
        </DialogDescription>
        <pre class="bg-gray-800 p-3 rounded-md text-sm text-white mb-4">{{ truncateDid(backupKey) }}</pre>
        <div class="flex gap-2">
          <button
            class="bg-[#d7df23] text-gray-900 px-4 py-2 rounded-md hover:bg-yellow-400 flex-1 transition-colors"
            @click="$emit('download')"
          >
            Download Key
          </button>
          <button
            class="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex-1 transition-colors"
            @click="$emit('close')"
          >
            Close
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script>
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/vue';

export default {
  components: { Dialog, DialogPanel, DialogTitle, DialogDescription },
  props: {
    backupKey: String,
  },
  methods:{
    truncateDid(did) {
      if (!did || did.length <= 50) return did;
      return `${did.slice(0, 20)}...${did.slice(-15)}`;
    },
  }
};
</script>
<template>
  <Dialog as="div" :open="true" @close="$emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        class="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl transform transition-all"
      >
        <div class="flex items-center gap-3 mb-4">
          <img src="../assets/logot.svg" alt="DID:Decast Logo" class="w-8 h-8" />
          <DialogTitle class="text-xl font-semibold text-[#d7df23]">Welcome to DID:Decast</DialogTitle>
        </div>
        <DialogDescription class="text-gray-300 mb-4">
          To get started, go to the <span class="text-[#d7df23] font-medium">Manage Keys</span> tab and generate a new key pair or restore an existing private key.
        </DialogDescription>
        <div class="flex items-center mb-4">
          <input
            type="checkbox"
            v-model="localDontShowAgain"
            id="dont-show-again"
            class="h-4 w-4 text-[#d7df23] focus:ring-[#d7df23] border-gray-700 rounded"
            @change="$emit('update:dont-show-again', localDontShowAgain)"
          />
          <label for="dont-show-again" class="ml-2 text-sm text-gray-300">Don't show again</label>
        </div>
        <button
          class="bg-[#d7df23] text-gray-900 px-4 py-2 rounded-md hover:bg-yellow-400 w-full transition-colors"
          @click="$emit('close')"
        >
          Get Started
        </button>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script>
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/vue';

export default {
  components: { Dialog, DialogPanel, DialogTitle, DialogDescription },
  props: {
    dontShowAgain: Boolean,
  },
  data() {
    return {
      localDontShowAgain: this.dontShowAgain,
    };
  },
};
</script>
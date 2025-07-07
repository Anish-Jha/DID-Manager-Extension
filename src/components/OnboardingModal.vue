<template>
  <Dialog as="div" :open="true" @close="$emit('close')" class="relative z-50">
    <!-- Overlay -->
    <div
      class="fixed inset-0 bg-black bg-opacity-60 transition-opacity duration-300 ease-out"
      aria-hidden="true"
    ></div>

    <!-- Modal Content -->
    <div class="fixed inset-0 flex items-center justify-center p-4 sm:p-6">
      <DialogPanel
        class="relative bg-gray-900 rounded-xl p-6 sm:p-8 max-w-md w-full shadow-2xl transform transition-all duration-300 ease-out scale-100 hover:scale-[1.02]"
      >
        <!-- Header with Logo and Title -->
        <div class="flex items-center gap-4 mb-6">
          <img
            src="../assets/logot.svg"
            alt="DID:Decast Logo"
            class="w-10 h-10"
            aria-hidden="true"
          />
          <DialogTitle
            as="h2"
            class="text-2xl font-bold text-white tracking-tight"
          >
            Welcome to <span class="text-[#d7df23]">DID:Decast</span>
          </DialogTitle>
        </div>

        <!-- Description -->
        <DialogDescription
          as="p"
          class="text-gray-300 text-base sm:text-lg leading-relaxed mb-6"
        >
          Get started by selecting or generating a
          <span class="text-[#d7df23] font-medium">Decentralized Identity (DID)</span>.
        </DialogDescription>

        <!-- Don't Show Again Checkbox -->
        <!-- <div class="flex items-center mb-6">
          <input
            type="checkbox"
            v-model="localDontShowAgain"
            id="dont-show-again"
            class="h-5 w-5 text-[#d7df23] focus:ring-[#d7df23] border-gray-600 rounded cursor-pointer transition-colors"
            @change="$emit('update:dontShowAgain', localDontShowAgain)"
            aria-label="Don't show this welcome modal again"
          />
          <label
            for="dont-show-again"
            class="ml-3 text-sm text-gray-300 cursor-pointer hover:text-gray-100 transition-colors"
          >
            Don't show this again
          </label>
        </div> -->

        <!-- Call to Action -->
        <button
          class="w-full bg-[#d7df23] text-gray-900 px-6 py-3 rounded-lg font-semibold text-base tracking-wide hover:bg-[#c0c620] focus:ring-2 focus:ring-[#d7df23] focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
          @click="$emit('close')"
          aria-label="Get started with DID:Decast"
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
    dontShowAgain: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      localDontShowAgain: this.dontShowAgain,
    };
  },
};
</script>

<style scoped>
/* Ensure smooth transitions for modal open/close */
.scale-100 {
  transform: scale(1);
}
</style>
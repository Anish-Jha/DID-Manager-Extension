<!-- OnboardingModal.vue -->
<template>
  <Dialog as="div" :open="true" @close="$emit('close')" class="relative z-50 h-full">
    <div class="on bg-[#15161E] fixed inset-0 flex flex-col items-center justify-start p-2 h-full">
      <header class="flex items-center justify-between gap-3 w-full border-b border-gray-700 mt-0">
        <div class="flex items-center gap-2 p-2 justify-start">
          <img src="../icons/logot.svg" alt="DID:Decast Logo" class="w-auto h-8" />
        </div>
      </header>
      <DialogPanel class="relative p-8 w-full transform transition-all duration-300 ease-out">
        <div v-if="!showDidCreation" class="flex flex-col justify-center items-center gap-4 mb-6">
          <img src="../icons/onboard.svg" alt="DID:Decast Logo" class="w-36 h-36" aria-hidden="true" />
          <DialogTitle as="h2" class="text-2xl font-semibold text-center text-white mt-8">
            Take Control <br> of Your Digital Identity
          </DialogTitle>
          <DialogDescription as="p" class="text-gray-500 text-base font-semibold text-center mb-6">
            Create a Decentralized ID (DID) that belongs <br>to you — not any platform. Use it to sign in, <br>own your data,
            and stay private online.
          </DialogDescription>
          <button
            class="bg-transparent outline-none border-none cursor-pointer"
            @click="showDidCreation = true" aria-label="Get started with DID:Decast">
            <img src="../icons/started.png" alt="">
          </button>
          <p class="text-gray-500 text-sm mt-8">
            Learn <span class="underline">how it works</span>
          </p>
        </div>

        <DidCreation v-if="showDidCreation" @generate-did="handleGenerateDid" @restore-did="handleRestoreDid" 
          @back="showDidCreation = false" />
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script>
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/vue';
import DidCreation from './DidCreation.vue';

export default {
  components: { Dialog, DialogPanel, DialogTitle, DialogDescription, DidCreation },
  props: {
    dontShowAgain: { type: Boolean, default: false },
    isFirstTime: { type: Boolean, default: false },
  },
  data() {
    return {
      localDontShowAgain: this.dontShowAgain,
      showDidCreation: false,
    };
  },
  methods: {
    handleGenerateDid() {
      this.$emit('generate-did');
    },
    handleRestoreDid() {
      this.$emit('restore-did');
    },
  },
};
</script>

<style scoped>
* {
  font-family: 'Rethink Sans', sans-serif !important;
}

.on {
  /* border: 1px solid #d7df23; */
}
</style>
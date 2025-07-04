<template>
  <Dialog as="div" :open="true" @close="$emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        class="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl transform transition-all"
      >
        <DialogTitle class="text-xl font-semibold text-[#d7df23] mb-2">{{ title }}</DialogTitle>
        <DialogDescription class="text-gray-300 mb-4">{{ message }}</DialogDescription>
        <div class="flex gap-2">
          <button
            class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-500 flex-1 transition-colors"
            @click="$emit('confirm')"
          >
            Confirm
          </button>
          <button
            class="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-600 flex-1 transition-colors"
            @click="$emit('close')"
          >
            Cancel
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
    title: String,
    message: String,
  },
};
</script>
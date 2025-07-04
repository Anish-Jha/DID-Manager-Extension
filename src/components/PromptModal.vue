<template>
  <Dialog as="div" :open="true" @close="$emit('close')" class="relative z-50">
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true"></div>
    <div class="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel
        class="bg-gray-900 rounded-lg p-6 max-w-md w-full shadow-xl transform transition-all"
      >
        <DialogTitle class="text-xl font-semibold text-[#d7df23] mb-2">{{ title }}</DialogTitle>
        <input
          v-model="inputValue"
          type="password"
          class="w-full bg-gray-800 text-white border-gray-700 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#d7df23]"
          :placeholder="placeholder"
          aria-label="Prompt input"
          @keyup.enter="submit"
        />
        <div class="flex gap-2">
          <button
            class="bg-[#d7df23] text-gray-900 px-4 py-2 rounded-md hover:bg-yellow-400 flex-1 transition-colors"
            @click="submit"
          >
            Submit
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
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue';

export default {
  components: { Dialog, DialogPanel, DialogTitle },
  props: {
    title: String,
    placeholder: String,
  },
  data() {
    return {
      inputValue: '',
    };
  },
  methods: {
    submit() {
      this.$emit('submit', this.inputValue);
      this.inputValue = '';
    },
  },
};
</script>
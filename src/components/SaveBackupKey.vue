<!-- SaveBackupKey.vue -->
<template>
  <Dialog as="div" :open="true" @close="$emit('close')" class="relative z-50 h-full">
    <div class="bg-[#15161E] fixed inset-0 flex flex-col items-center justify-start p-2 h-full">
      <DialogPanel class="relative p-8 w-full max-w-md transform transition-all duration-300 ease-out">
        <div class="flex flex-col justify-center items-center gap-4 mb-6">
          <DialogTitle as="h2" class=" font-semibold text-center text-white mt-4 text-2xl">
            Save Your Secret Recovery Key
          </DialogTitle>
          <DialogDescription as="p" class="text-gray-500 text-base font-semibold text-left mb-4">
            This is your secret recovery key. Write it down and keep it safe. If someone has your secret recovery key,
            they
            can access your wallet. Do not share it with anyone.
          </DialogDescription>
          <div class="w-full bg-transparent border border-gray-700 rounded px-3 py-2 mb-4">
            <textarea :value="backupKey" readonly
              class="w-full h-24 resize-none bg-transparent text-white text-base outline-none border-none"
              placeholder="Your secret recovery key"></textarea>
            <div class="flex gap-3 w-full">
              <button
                class="bg-[#444551] text-[#ABABAE] text-base font-semibold px-4 py-1 rounded hover:bg-[#B7BF10] transition flex items-center justify-center gap-2 flex-1"
                @click="copyKey">
                <img src="../icons/copy.svg" alt="Copy" class="w-5 h-5" />
                Copy Key
              </button>

              <button
                class="bg-[#444551] text-[#ABABAE] text-base font-semibold px-4 py-1 rounded hover:bg-[#B7BF10] transition flex items-center justify-center gap-2 flex-1"
                @click="$emit('download')">
                <img src="../icons/download.png" alt="Copy" class="w-5 h-5" />
                Download Key
              </button>
              
            </div>
          </div>

          <button
            class="bg-[#D7DF23] text-black text-lg font-semibold px-4 py-2 rounded hover:bg-[#B7BF10] transition flex items-center justify-center gap-2 w-full"
            @click="$emit('continue')">
            Setup Wallet Password
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script>
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/vue';

export default {
  name: 'SaveBackupKey',
  components: { Dialog, DialogPanel, DialogTitle, DialogDescription },
  props: {
    backupKey: {
      type: String,
      required: true,
    },
  },
  emits: ['close', 'response', 'download', 'continue'],
  methods: {
    copyKey() {
      navigator.clipboard.writeText(this.backupKey).then(() => {
        this.$emit('response', 'Secret recovery key copied to clipboard!');
      }).catch((err) => {
        console.error('Failed to copy: ', err);
        this.$emit('response', 'Failed to copy secret recovery key.');
      });
    },
  },
};
</script>

<style scoped>
* {
  font-family: 'Rethink Sans', sans-serif !important;
}
</style>
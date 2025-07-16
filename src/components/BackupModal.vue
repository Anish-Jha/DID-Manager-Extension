<!-- BackupModal.vue -->
<template>
  <div
    class="fixed bottom-0 left-0 w-full max-w-md mx-auto bg-[#15161E] border border-gray-700 rounded-t-xl p-12 shadow-lg z-50 animate-slide-up"
    style="max-height: 300px;">
    <h3 class="text-white text-lg font-semibold mb-2">Download Backup Key</h3>
    <p class="text-gray-500 text-sm mb-4">
      Download and store your private key securely. Keep it safe — anyone with this key can access your identity.
    </p>
    <div
      class="w-full bg-transparent text-white text-base bg-gray-600 border border-gray-700 rounded px-3 py-2 mb-4 flex justify-between items-center">
      {{ truncateDid(backupKey) }} <img @click="copyKey" class="cursor-pointer" src="../icons/copy.svg" alt=""></div>
    <div class="flex gap-3">
      <button
        class="bg-[#D7DF23] text-black text-lg font-semibold px-4 py-2 rounded hover:bg-yellow-500 transition flex items-center justify-center gap-2 flex-1"
        @click="$emit('download')">
        Download Key
      </button>
      <button
        class="bg-gray-600 text-white text-lg font-semibold px-4 py-2 rounded hover:bg-gray-500 transition flex items-center justify-center gap-2 flex-1"
        @click="$emit('close')">
        Close
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BackupModal',
  props: {
    backupKey: {
      type: String,
      required: true,
    },
  },
  methods: {
    truncateDid(did) {
      return did.length > 30 ? `${did.slice(0, 12)}.....${did.slice(-12)}` : did;
    },
    copyKey() {
      navigator.clipboard.writeText(this.backupKey).then(() => {
        this.$emit('response', 'Backup key copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy: ', err);
        this.$emit('response', 'Failed to copy backup key.');
      });
    },
  },
};
</script>

<style scoped>
* {
  font-family: 'Rethink Sans', sans-serif !important;
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }

  to {
    transform: translateY(0);
  }
}
</style>
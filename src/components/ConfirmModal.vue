<!-- ConfirmModal.vue -->
<template>
  <div
    class="fixed bottom-0 left-0 w-full max-w-md mx-auto bg-[#15161E] border border-gray-700 rounded-t-lg p-4 shadow-lg z-50 animate-slide-up"
    style="max-height: 300px;">
    <h3 class="text-white text-lg font-semibold mb-2">{{ title }}</h3>
    <div v-html="message" class="confirm-message text-gray-500 text-sm mb-4"></div>
    <div class="flex gap-3">
      <button :class="confirmButtonClass"
        class=" text-black text-lg font-semibold px-4 py-2 rounded hover:bg-red-300 transition flex items-center justify-center gap-2 flex-1"
        @click="$emit('confirm')">
        Confirm
      </button>
      <button
        class="bg-gray-600 text-white text-lg font-semibold px-4 py-2 rounded hover:bg-gray-500 transition flex items-center justify-center gap-2 flex-1"
        @click="$emit('close')">
        Cancel
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmModal',
  props: ['title', 'message', 'source'],
  computed: {
    confirmButtonClass() {
      return {
        'confirm-button': true,
        'confirm-delete': this.source === 'delete', // Red for delete
        'confirm-nonce': this.source === 'nonce', // Yellow for nonce
      };
    },
  },
  mounted() {
    console.log('ConfirmModal mounted with props:');
  },
  methods: {
    confirm() {
      this.callback(true);
    },
    close() {
      this.callback(false);
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

.confirm-button.confirm-delete {
  background-color: #EF4444 !important;
  /* Red for delete */
  color: white;
}

.confirm-button.confirm-nonce {
  background-color: #D7DF23 !important;
  /* Yellow for nonce */
  color: #15161E;
}
</style>
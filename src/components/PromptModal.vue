<!-- PromptModal.vue -->
<template>
  <div
    class="fixed bottom-0 left-0 w-full max-w-md mx-auto bg-[#15161E] border border-gray-700 rounded-t-lg p-4 shadow-lg z-50 animate-slide-up"
    style="max-height: 300px;"
  >
    <h3 class="text-white text-lg font-semibold mb-2">{{ title }}</h3>
    <input
      v-model="inputValue"
      :placeholder="placeholder"
      type="text"
      class="w-full bg-transparent text-white text-base border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none"
    />
    <div class="flex gap-3">
      <button
        class="bg-[#D7DF23] text-black text-lg font-semibold px-4 py-2 rounded hover:bg-yellow-500 transition flex items-center justify-center gap-2 flex-1"
        @click="$emit('submit', inputValue)"
      >
        Submit
      </button>
      <button
        class="bg-gray-600 text-white text-lg font-semibold px-4 py-2 rounded hover:bg-gray-500 transition flex items-center justify-center gap-2 flex-1"
        @click="$emit('close')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PromptModal',
  props: {
    title: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      inputValue: '',
    };
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
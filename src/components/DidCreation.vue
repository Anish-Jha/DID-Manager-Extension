<!-- DidCreation.vue -->
<template>
  <div class="flex flex-col items-center justify-center w-full h-full">
    <!-- <img src="../icons/onboard.svg" alt="DID:Decast Logo" class="w-36 h-36 mb-6" aria-hidden="true" /> -->
    <h2 class="text-2xl font-semibold text-center text-white mb-4 mt-4">
      Claim your first DID
    </h2>
    <p class="text-gray-500 text-base font-semibold text-center mb-8">
      Use Decast with multiple identities; <br> pseudonymous, public, or anonymous; <br>
      without compromising safety or authorship.
    </p>

    <button
      class="w-full bg-[#d7df23] px-8 py-3 rounded-lg font-semibold text-lg border-none outline-none text-black mb-4"
      @click="$emit('generate-did')" aria-label="Generate a new ID">
      Continue
    </button>

    <p class="text-gray-500 text-lg">Already have one? <span class="underline cursor-pointer"
        @click="$emit('restore-did')">Restore it</span></p>
  </div>
</template>

<script>
export default {
  name: 'DidCreation',
  emits: ['generate-did', 'restore-key', 'back'],
};
</script>

<style scoped>
* {
  font-family: "Rethink Sans", sans-serif !important;
}
</style>
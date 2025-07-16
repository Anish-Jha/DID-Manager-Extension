<!-- DidCreation.vue -->
<template>
  <div class="flex flex-col items-center justify-center w-full h-full">
    <!-- <img src="../icons/onboard.svg" alt="DID:Decast Logo" class="w-36 h-36 mb-6" aria-hidden="true" /> -->
    <h2 class="text-xl font-semibold text-center text-white mb-4">
      Your Identity in Your Control
    </h2>
    <p class="text-gray-500 text-sm font-semibold text-center mb-8">
      Use Decast with multiple identities; pseudonymous, public, or anonymous;
      without compromising safety or authorship.
    </p>

    <button
      class="w-full bg-[#d7df23] px-8 py-3 rounded-lg font-semibold text-base border-none outline-none text-black mb-4"
      @click="$emit('generate-did')" aria-label="Generate a new DID">
      Continue
    </button>

    <p class="text-gray-500 text-lg">Already have one? <span class="underline cursor-pointer"
        @click="$emit('restore-key')">Restore it</span></p>

    <div class="mt-8 text-gray-500 text-sm text-left flex flex-col items-start justify-start gap-2">
      <p> 🔐 Generate decentralized IDs (DIDs) in one click</p>
      <p> 🔄 Switch between multiple personas seamlessly</p>
      <p> 🧾 Sign your CAST recordings with cryptographic proof </p>
      <p> 👤 Own your content and protect your privacy </p>
      <p> 🧠 Pair identities with biometric or passkey recovery</p>
    </div>

    <p class="text-gray-500 text-sm mt-12 cursor-pointer underline" @click="$emit('back')">
      Back to Onboarding
    </p>
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
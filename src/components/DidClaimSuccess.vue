<!-- DidClaimSuccess.vue -->
<template>
  <div class="flex flex-col items-center justify-center w-full h-full p-4">
    <img class="w-48 h-auto object-contain" src="../icons/avatar.png" alt="">
    <h2 class="text-2xl font-semibold text-center text-white mb-2 mt-4">
      DID Claim Successful
    </h2>
    <p class="text-gray-500 text-base font-semibold text-center mb-4">
      You’ve successfully claimed your <br> Decast DID NFT. It’s now linked to your <br>identity: {{ name }}.decast
    </p>
    <button class="w-full bg-[#d7df23] px-8 py-3 rounded-lg font-semibold text-base border-none outline-none text-black"
      @click="$emit('continue')" aria-label="Continue to DID Profile">
      Continue
    </button>
  </div>
</template>

<script>
export default {
  name: 'DidClaimSuccess',
  props: {
    name: {
      type: String,
      default: '',
    },
    did: {
      type: String,
      required: true,
    },
  },
  emits: ['continue'],
  methods: {
    truncateDid(did) {
      return did.length > 30 ? `${did.slice(0, 12)}...${did.slice(-12)}` : did;
    },
  },
};
</script>

<style scoped>
* {
  font-family: "Rethink Sans", sans-serif !important;
}
</style>
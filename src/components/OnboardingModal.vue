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
        <div v-if="showPasswordSetup" class="flex flex-col justify-center items-center gap-4 mb-4">
          <img src="../icons/onboard.svg" alt="DID:Decast Logo" class="w-36 h-36" aria-hidden="true" />
          <DialogTitle as="h2" class="text-xl font-semibold text-center text-white mt-4">
            Set Up Your Extension Password
          </DialogTitle>
          <DialogDescription as="p" class="text-gray-500 text-sm font-semibold text-center mb-4">
            Create a password to secure your DID:Decast extension. This password will be used to encrypt your DIDs and
            unlock the extension.
          </DialogDescription>
          <input
            v-model="password"
            type="password"
            class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-2 focus:ring-2 focus:ring-yellow-400 outline-none"
            placeholder="Enter your password"
          />
          <input
            v-model="confirmPassword"
            type="password"
            class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-2 focus:ring-2 focus:ring-yellow-400 outline-none"
            placeholder="Confirm your password"
          />
          <button
            class="w-full bg-[#d7df23] px-8 py-3 rounded-lg cursor-pointer font-semibold text-base border-none outline-none text-black"
            :disabled="!password.trim() || !confirmPassword.trim() || password !== confirmPassword || isLoading"
            @click="setPassword"
          >
            Set Password
            <span
              v-if="isLoading"
              class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full ml-2"
            ></span>
          </button>
        </div>

        <!-- Onboarding View -->
        <div v-if="!showPasswordSetup && !showDidCreation" class="flex flex-col justify-center items-center gap-4 mb-6">
          <img src="../icons/onboard.svg" alt="DID:Decast Logo" class="w-36 h-36" aria-hidden="true" />
          <DialogTitle as="h2" class="text-xl font-semibold text-center text-white mt-8">
            Take Control <br> of Your Digital Identity
          </DialogTitle>
          <DialogDescription as="p" class="text-gray-500 text-sm font-semibold text-center mb-6">
            Create a Decentralized ID (DID) that belongs <br> to you — not any platform. Use it to sign in, <br> own
            your data, and stay private online.
          </DialogDescription>
          <button
            class="w-full bg-[#d7df23] px-8 py-3 rounded-lg font-semibold text-base border-none outline-none text-black"
            @click="showDidCreation = true"
            aria-label="Get started with DID:Decast"
          >
            Get Started
          </button>
          <p class="text-gray-500 text-sm mt-12">
            Learn <span class="underline">how it works</span>
          </p>
        </div>

        <DidCreation
          v-if="showDidCreation"
          @generate-did="handleGenerateDid"
          @restore-key="handleRestoreKey"
          @back="showDidCreation = false"
        />
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script>
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/vue';
import DidCreation from './DidCreation.vue';
import CryptoJS from 'crypto-js';

export default {
  components: { Dialog, DialogPanel, DialogTitle, DialogDescription, DidCreation },
  props: {
    dontShowAgain: {
      type: Boolean,
      default: false,
    },
    isFirstTime: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      localDontShowAgain: this.dontShowAgain,
      showDidCreation: false,
      showPasswordSetup: this.isFirstTime,
      password: '',
      confirmPassword: '',
      isLoading: false,
    };
  },
  methods: {
    setPassword() {
      this.isLoading = true;
      if (this.password !== this.confirmPassword) {
        this.$emit('response', 'Passwords do not match.');
        this.isLoading = false;
        return;
      }
      if (this.password.length < 8) {
        this.$emit('response', 'Password must be at least 8 characters long.');
        this.isLoading = false;
        return;
      }

      const passwordHash = CryptoJS.SHA256(this.password).toString();
      const encryptedPassword = CryptoJS.AES.encrypt(this.password, this.password).toString();

      chrome.storage.local.set(
        {
          extensionPasswordHash: passwordHash,
          extensionPassword: encryptedPassword,
        },
        () => {
          this.$emit('response', 'Extension password set successfully!');
          this.$emit('password-set', this.password);
          this.showPasswordSetup = false;
          this.password = '';
          this.confirmPassword = '';
          this.isLoading = false;
        }
      );
    },

    handleGenerateDid() {
      this.$emit('generate-did');
    },

    handleRestoreKey() {
      this.$emit('restore-key');
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
<!-- PasswordSetup.vue -->
<template>
  <Dialog as="div" :open="true" @close="$emit('close')" class="relative z-50 h-full">
    <div class="bg-[#15161E] fixed inset-0 flex flex-col items-center justify-start p-2 h-full">
      <DialogPanel class="relative p-8 w-full max-w-md transform transition-all duration-300 ease-out">
        <div class="flex flex-col justify-center items-center gap-4 mb-4">
          <DialogTitle as="h2" class="text-2xl font-semibold text-center text-white mt-4">
            Decast Wallet Password
          </DialogTitle>
          <DialogDescription as="p" class="text-gray-500 text-base font-semibold text-left mb-4">
            Contrary to popular practice, you can keep it simple, remember it, and if lost, you may reset it using your
            recovery key.
          </DialogDescription>
          <div class="w-full">
            <label for="password" class="text-white text-base font-medium mb-2 block">New Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              class="w-full bg-transparent text-white border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-yellow-400 outline-none text-base"
              placeholder="Enter your password"
            />
          </div>
          <div class="w-full">
            <label for="confirmPassword" class="text-white text-base font-medium mb-2 block">Confirm Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              class="w-full bg-transparent text-white border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-yellow-400 outline-none text-base"
              placeholder="Confirm your password"
            />
          </div>
          <div class="w-full flex items-center gap-2">
            <input
              type="checkbox"
              id="acknowledge"
              v-model="isAcknowledged"
              class="h-6 w-6 text-yellow-400 focus:ring-yellow-400 border-gray-700 rounded"
            />
            <label for="acknowledge" class="text-gray-500 text-sm font-semibold">
              ​We cannot recover your password if you forget it. This password is locally saved in the extension.
            </label>
          </div>
          <button
            class="w-full bg-[#D7DF23] px-8 py-3 rounded-lg font-semibold text-base border-none outline-none text-black disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!password.trim() || !confirmPassword.trim() || password !== confirmPassword || !isAcknowledged || isLoading"
            @click="setPassword"
          >
            Create Password
            <span
              v-if="isLoading"
              class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full ml-2"
            ></span>
          </button>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script>
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/vue';
import CryptoJS from 'crypto-js';

export default {
  name: 'PasswordSetup',
  components: { Dialog, DialogPanel, DialogTitle, DialogDescription },
  emits: ['close', 'response', 'password-set'],
  data() {
    return {
      password: '',
      confirmPassword: '',
      isLoading: false,
      isAcknowledged: false,
    };
  },
  methods: {
    setPassword() {
      this.isLoading = true;
      if (!this.isAcknowledged) {
        this.$emit('response', 'Please acknowledge that you understand the password cannot be recovered.');
        this.isLoading = false;
        return;
      }
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
          if (chrome.runtime.lastError) {
            console.error('Error storing password:', chrome.runtime.lastError.message);
            this.$emit('response', 'Error setting extension password.');
            this.isLoading = false;
            return;
          }
          // this.$emit('response', 'Extension password set successfully!');
          this.$emit('password-set', this.password);
          this.password = '';
          this.confirmPassword = '';
          this.isAcknowledged = false;
          this.isLoading = false;
        }
      );
    },
  },
};
</script>

<style scoped>
* {
  font-family: 'Rethink Sans', sans-serif !important;
}
</style>
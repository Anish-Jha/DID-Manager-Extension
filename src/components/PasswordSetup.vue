<template>
  <Dialog as="div" :open="true" @close="$emit('close')" class="relative z-50 h-full">
    <div class="bg-[#15161E] fixed inset-0 flex flex-col items-center justify-start p-2 h-full">
      <DialogPanel class="relative p-8 w-full max-w-md transform transition-all duration-300 ease-out">
        <div class="flex flex-col justify-center items-center gap-4 mb-4">
          <DialogTitle as="h2" class="text-2xl font-semibold text-center text-white mt-4">
            Decast Wallet Password
          </DialogTitle>
          <DialogDescription as="p" class="text-gray-500 text-base font-semibold text-left mb-4">
            Choose a strong password (at least 8 characters, including letters, numbers, and symbols). You can reset it using your recovery key if lost.
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
              I understand that my password cannot be recovered if forgotten. It is stored locally in the extension.
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
      // Enforce stronger password requirements
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
      if (!passwordRegex.test(this.password)) {
        this.$emit('response', 'Password must include letters, numbers, and at least one special character.');
        this.isLoading = false;
        return;
      }

      const passwordHash = CryptoJS.SHA256(this.password).toString();
      const salt = CryptoJS.lib.WordArray.random(16).toString();
      const encryptedPassword = CryptoJS.AES.encrypt(
        this.password,
        salt,
        { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
      ).toString();

      chrome.storage.session.set(
        {
          encryptedPassword: encryptedPassword,
          passwordSalt: salt,
          isUnlocked: true,
        },
        () => {
          if (chrome.runtime.lastError) {
            console.error('Error storing session password:', chrome.runtime.lastError.message);
            this.$emit('response', 'Error setting extension password.');
            this.isLoading = false;
            return;
          }
          chrome.storage.local.set(
            { extensionPasswordHash: passwordHash },
            () => {
              if (chrome.runtime.lastError) {
                console.error('Error storing password hash:', chrome.runtime.lastError.message);
                this.$emit('response', 'Error setting extension password.');
                this.isLoading = false;
                return;
              }
              this.$emit('password-set', this.password);
              this.password = '';
              this.confirmPassword = '';
              this.isAcknowledged = false;
              this.isLoading = false;
            }
          );
        }
      );
    },
  },
};
</script>
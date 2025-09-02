<template>
  <Dialog as="div" :open="true" @close="() => { }" class="relative z-50 h-full">
    <div class="bg-[#15161E] fixed inset-0 flex flex-col items-center justify-start p-2 h-full">
      <header class="flex items-center justify-between gap-3 w-full border-b border-gray-700 mt-0">
        <div class="flex items-center gap-2 p-2 justify-start">
          <img src="../icons/logot.svg" alt="DID:Decast Logo" class="w-auto h-8" />
        </div>
      </header>
      <DialogPanel class="relative p-8 w-full transform transition-all duration-300 ease-out">
        <div class="flex flex-col justify-center items-center gap-4 mb-6">
          <img src="../icons/onboard.svg" alt="DID:Decast Logo" class="w-36 h-36" aria-hidden="true" />
          <DialogTitle as="h2" class="text-xl font-semibold text-center text-white mt-8">
            Welcome Back!
          </DialogTitle>
          <DialogDescription as="p" class="text-gray-500 text-sm font-semibold text-center mb-6">
            Enter your password to unlock the DID:Decast extension.
          </DialogDescription>
          <input v-model="password" type="password"
            class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-3 focus:ring-2 focus:ring-yellow-400 outline-none"
            placeholder="Enter your password" @keyup.enter="unlock" />
          <button
            class="w-full bg-[#d7df23] px-8 py-3 rounded-lg font-semibold text-base border-none outline-none text-black"
            :disabled="!password.trim() || isLoading" @click="unlock">
            Unlock
            <span v-if="isLoading"
              class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full ml-2"></span>
          </button>
          <button class="w-full text-gray-500 font-underline text-sm font-semibold mt-4 hover:text-[#D7DF23]"
            @click="$emit('forgot-password')">
            Forgot Password?
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
  name: 'UnlockModal',
  components: { Dialog, DialogPanel, DialogTitle, DialogDescription },
  data() {
    return {
      password: '',
      isLoading: false,
    };
  },
  methods: {
    unlock() {
      this.isLoading = true;
      chrome.storage.local.get(['extensionPasswordHash', 'didKeyPairs'], (result) => {
        const storedHash = result.extensionPasswordHash;
        const inputHash = CryptoJS.SHA256(this.password).toString();

        if (!storedHash) {
          console.error('No stored password hash found');
          this.$emit('response', 'No password set for this extension. Please set up a new password.');
          this.isLoading = false;
          return;
        }

        if (inputHash !== storedHash) {
          console.error('Password hash mismatch');
          this.$emit('response', 'Incorrect password.');
          this.isLoading = false;
          return;
        }

        // Verify decryption of didKeyPairs
        if (result.didKeyPairs) {
          try {
            const decryptedDidKeyPairs = CryptoJS.AES.decrypt(
              result.didKeyPairs,
              this.password,
              { mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
            ).toString(CryptoJS.enc.Utf8);
            JSON.parse(decryptedDidKeyPairs || '{}'); // Test parsing
          } catch (error) {
            console.error('Error decrypting didKeyPairs during unlock:', error.message);
            this.$emit('response', 'Failed to decrypt DID data. Please check your password or reset the wallet.');
            this.isLoading = false;
            return;
          }
        }

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
              console.error('Error storing session data:', chrome.runtime.lastError.message);
              this.$emit('response', 'Error storing session data.');
              this.isLoading = false;
              return;
            }
            chrome.runtime.sendMessage(
              { action: 'password-unlocked', decryptedPassword: this.password },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Error sending password-unlocked message:', chrome.runtime.lastError.message);
                  this.$emit('response', 'Error communicating with background script.');
                  this.isLoading = false;
                  return;
                }
                if (response?.error) {
                  console.error('Password-unlocked response error:', response.error);
                  this.$emit('response', response.error);
                  this.isLoading = false;
                } else {
                  this.$emit('unlock', this.password);
                  this.password = '';
                  this.isLoading = false;
                }
              }
            );
          }
        );
      });
    },
  },
};
</script>
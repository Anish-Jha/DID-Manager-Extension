<!-- ForgotPasswordModal.vue -->
<template>
  <Dialog as="div" :open="true" @close="emitClose" class="relative z-50 h-full">
    <div class="bg-[#15161E] fixed inset-0 flex flex-col items-center justify-start p-2 h-full overflow-y-scroll">
      <header class="flex items-center justify-between gap-3 w-full border-b border-gray-700 mt-0 sticky top-0 z-10">
        <div class="flex items-center gap-2 p-2 justify-start">
          <img src="../icons/logot.svg" alt="DID:Decast Logo" class="w-auto h-8" />
        </div>
      </header>
      <DialogPanel class="relative p-4 w-full max-w-md transform transition-all duration-300 ease-out">
        <div class="flex flex-col justify-center items-center gap-4 mb-2">
          <DialogTitle as="h2" class="text-xl font-semibold text-center text-white mt-4">
            Reset Your Wallet
          </DialogTitle>
          <DialogDescription as="p" class="text-gray-500 text-sm font-semibold text-center mb-2">
            Decast cannot recover your password. Use your private key to restore your DIDs.
          </DialogDescription>
          <div class="w-full">
            <label for="did-name" class="text-white text-sm font-medium mb-2 block">Identity Name</label>
            <input
              id="did-name"
              v-model="didName"
              type="text"
              class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none"
              placeholder="Enter a name for your Identity"
            />
            <label for="private-key" class="text-white text-sm font-medium mb-2 block">Private Key</label>
            <input
              id="private-key"
              v-model="privateKey"
              type="text"
              class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none"
              placeholder="Paste your private key (base58)"
            />
            <label for="new-password" class="text-white text-sm font-medium mb-2 block">New Password</label>
            <input
              id="new-password"
              v-model="newPassword"
              type="password"
              class="w-full bg-gray-800 text-white border border-gray-700 rounded px-3 py-2 mb-4 focus:ring-2 focus:ring-[#D7DF23] outline-none"
              placeholder="Set a new password"
            />
            <button
              class="w-full bg-[#D7DF23] px-8 py-3 rounded-lg font-semibold text-base border-none outline-none text-black cursor-pointer"
              :disabled="!didName.trim() || !privateKey.trim() || !newPassword.trim() || isLoading"
              @click="resetWallet"
            >
              Reset Wallet
              <span
                v-if="isLoading"
                class="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full ml-2"
              ></span>
            </button>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script>
import { Dialog, DialogPanel, DialogTitle, DialogDescription } from '@headlessui/vue';
import * as ed from '@stablelib/ed25519';
import bs58 from 'bs58';
import CryptoJS from 'crypto-js';

export default {
  name: 'ForgotPasswordModal',
  components: { Dialog, DialogPanel, DialogTitle, DialogDescription },
  data() {
    return {
      didName: '',
      privateKey: '',
      newPassword: '',
      isLoading: false,
    };
  },
  methods: {
    emitClose() {
      this.$emit('close');
    },
    async resetWallet() {
      if (!this.didName.trim()) {
        this.$emit('response', 'Please enter a DID name.');
        return;
      }
      if (!this.privateKey.trim()) {
        this.$emit('response', 'Please enter your private key.');
        return;
      }
      if (!this.newPassword.trim()) {
        this.$emit('response', 'Please set a new password.');
        return;
      }
      this.isLoading = true;
      try {
        // Validate private key
        const cleanKey = this.privateKey.trim();
        const decodedKey = bs58.decode(cleanKey);
        if (decodedKey.length !== 64) throw new Error('Invalid private key length.');

        // Generate DID from private key
        const publicKey = ed.extractPublicKeyFromSecretKey(decodedKey);
        const did = `did:decast:${bs58.encode(publicKey)}`;

        // Encrypt the private key with the new password
        const encryptedSecretKey = CryptoJS.AES.encrypt(cleanKey, this.newPassword).toString();

        // Prepare DID data to emit
        const didData = {
          did,
          name: this.didName.trim(),
          publicKey: bs58.encode(publicKey),
          secretKey: encryptedSecretKey,
          createdAt: new Date().toISOString(),
        };

        // Emit wallet-reset with new password and restored DID data
        this.$emit('wallet-reset', {
          newPassword: this.newPassword,
          didData,
        });

        this.$emit('response', `Wallet reset successfully! DID "${this.didName}" restored.`);
        this.isLoading = false;
        this.didName = '';
        this.privateKey = '';
        this.newPassword = '';
      } catch (error) {
        this.$emit('response', `Error resetting wallet: ${error.message}`);
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
* {
  font-family: 'Rethink Sans', sans-serif !important;
}

::-webkit-scrollbar{
  display: none;
}
</style>
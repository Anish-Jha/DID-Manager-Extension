<!-- SettingsContainer.vue -->
<template>
    <div class="fixed inset-0 bg-[#15161E] flex flex-col items-center justify-start p-4 z-50">
        <header class="flex items-center justify-between gap-3 w-full border-b border-gray-700 pb-2 mb-4">
            <div class="flex items-center gap-2 justify-start">
                <img src="../icons/logot.svg" alt="DID:Decast Logo" class="w-auto h-8" />
            </div>
            <button @click="$emit('close')" class="text-gray-500 hover:text-white">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </header>
        <div class="w-full max-w-md h-full flex flex-col justify-between items-center">
            <div
                class="space-y-4 rounded-lg border border-gray-700 p-4 flex flex-col justify-start items-start mt-4 w-full">
                <button class="bg-transparent flex justify-start cursor-pointer gap-2 items-center text-white text-lg px-4 py-2" @click="$emit('generate-did')">
                    <img src="../icons/key.svg" class="w-8 h-8 rounded-md border border-gray-700 p-2 bg-gray-700 object-contain" alt="">
                    Generate a New DID
                </button>
                <button
                    class="bg-transparent flex justify-start cursor-pointer gap-2 items-center text-white text-lg px-4 py-2"
                    @click="$emit('restore-did')">
                    <img src="../icons/restore.svg"
                        class="w-8 h-8 rounded-md border border-gray-700 p-2 bg-gray-700 object-contain" alt="">
                    Restore DID
                </button>
                <button
                    class="bg-transparent flex justify-start cursor-pointer gap-2 items-center text-white text-lg px-4 py-2"
                    @click="$emit('settings-did')">
                    <img src="../icons/perm.png"
                        class="w-8 h-8 rounded-md border border-gray-700 p-2 bg-gray-700 object-contain" alt="">
                    DID Configuration
                </button>
                <button
                    class="bg-transparent flex justify-start cursor-pointer gap-2 items-center text-white text-lg px-4 py-2"
                    @click="$emit('lock')">
                    <img src="../icons/lock.svg"
                        class="w-8 h-8 rounded-md border border-gray-700 p-2 bg-gray-700 object-contain" alt="">
                    Lock extension
                </button>
            </div>

        </div>
    </div>
</template>

<script>
export default {
    name: 'SettingsContainer',
    emits: ['close', 'generate-did', 'restore-did', 'settings-did', 'delete-did', 'response'],
};
</script>

<style scoped>
* {
    font-family: 'Rethink Sans', sans-serif !important;
}
</style>
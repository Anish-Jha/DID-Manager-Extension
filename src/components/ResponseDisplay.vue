<template>
    <div class="card p-3 mb-3">
        <h3>Responses</h3>
        <button class="btn btn-secondary mb-2" @click="$emit('clear-responses')">Clear Responses</button>
        <div v-if="responses.length === 0" class="text-muted">
            No responses yet.
        </div>
        <div v-for="(response, index) in responses" :key="index" class="mb-2">
            <div :class="response.type === 'error' ? 'text-danger' : 'text-success'">
                [{{ response.timestamp }}] {{ response.message }}
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        responses: Array,
    },
};
</script>

<style>

*{
    font-family: "JetBrains Mono", monospace !important;
}

</style>
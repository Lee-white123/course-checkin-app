<template>
  <section class="stack admin-page">
    <router-view :state="state" @state-updated="forwardState" />
  </section>
</template>

<script setup>
defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["state-updated"]);

function forwardState(payload) {
  emit("state-updated", payload);
}
</script>

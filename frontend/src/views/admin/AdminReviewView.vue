<template>
  <AdminPermissionsView mode="review" :state="state" @state-updated="$emit('state-updated', $event)" />
</template>

<script setup>
import AdminPermissionsView from "./AdminPermissionsView.vue";

defineProps({
  state: {
    type: Object,
    required: true,
  },
});

defineEmits(["state-updated"]);
</script>

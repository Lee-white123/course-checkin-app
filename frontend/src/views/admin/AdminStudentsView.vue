<template>
  <AdminUsersView mode="students" :state="state" @state-updated="$emit('state-updated', $event)" />
</template>

<script setup>
import AdminUsersView from "./AdminUsersView.vue";

defineProps({
  state: {
    type: Object,
    required: true,
  },
});

defineEmits(["state-updated"]);
</script>

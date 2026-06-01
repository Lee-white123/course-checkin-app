<template>
  <div class="parent-week-header">
    <div>
      <strong>{{ title }}</strong>
      <span>{{ weekRange }}</span>
      <small v-if="summary">{{ summary }}</small>
    </div>
    <div class="parent-week-actions">
      <button type="button" class="parent-week-button" @click="$emit('change-week', -1)">
        <span aria-hidden="true">‹</span>
        上一周
      </button>
      <button type="button" class="parent-week-button is-current" @click="$emit('current-week')">
        本周
      </button>
      <button type="button" class="parent-week-button" @click="$emit('change-week', 1)">
        下一周
        <span aria-hidden="true">›</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "本周课程",
  },
  weekRange: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    default: "",
  },
});

defineEmits(["change-week", "current-week"]);
</script>

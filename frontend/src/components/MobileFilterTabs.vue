<template>
  <div class="mobile-filter-tabs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="item in options"
      :key="item.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === item.value"
      :class="{ active: modelValue === item.value }"
      @click="$emit('update:modelValue', item.value)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
  ariaLabel: {
    type: String,
    default: "课程筛选",
  },
});

defineEmits(["update:modelValue"]);
</script>

<style scoped>
.mobile-filter-tabs {
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  display: inline-flex;
  gap: 4px;
  margin-bottom: var(--space-4);
  padding: 4px;
}

.mobile-filter-tabs button {
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  padding: 8px 14px;
}

.mobile-filter-tabs button.active {
  background: var(--surface);
  box-shadow: var(--shadow-control);
  color: var(--primary);
}

.mobile-filter-tabs button:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
</style>

<template>
  <span class="status-tag" :class="statusClass">
    {{ status }}
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
});

const statusClass = computed(() => {
  if (props.status === "已消课") return "is-completed";
  if (props.status === "待上课") return "is-pending";
  if (props.status === "未打卡") return "is-missed";
  if (props.status === "异常") return "is-abnormal";
  return "is-muted";
});
</script>

<style scoped>
.status-tag {
  align-items: center;
  background: var(--status-bg);
  border: 1px solid var(--status-border);
  border-radius: 6px;
  color: var(--status-color);
  display: inline-flex;
  font-size: 12px;
  font-weight: 800;
  justify-content: center;
  line-height: 1;
  min-height: 26px;
  min-width: 58px;
  padding: 0 10px;
  white-space: nowrap;
}

.status-tag.is-completed {
  --status-bg: rgba(111, 212, 154, 0.18);
  --status-border: rgba(111, 212, 154, 0.38);
  --status-color: #26935d;
}

.status-tag.is-pending {
  --status-bg: rgba(255, 213, 106, 0.20);
  --status-border: rgba(221, 159, 25, 0.58);
  --status-color: #8a4f00;
}

.status-tag.is-missed {
  --status-bg: rgba(232, 135, 50, 0.18);
  --status-border: rgba(216, 94, 20, 0.56);
  --status-color: #b84b0d;
}

.status-tag.is-abnormal {
  --status-bg: rgba(232, 93, 106, 0.14);
  --status-border: rgba(232, 93, 106, 0.42);
  --status-color: #d83f4d;
}

.status-tag.is-muted {
  --status-bg: rgba(148, 163, 184, 0.14);
  --status-border: rgba(148, 163, 184, 0.30);
  --status-color: #64748b;
}
</style>

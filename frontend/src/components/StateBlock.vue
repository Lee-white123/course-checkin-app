<template>
  <section class="state-block" :class="`is-${type}`" :role="roleName" :aria-busy="type === 'loading'">
    <div class="state-block__icon" aria-hidden="true">{{ iconText }}</div>
    <div class="state-block__content">
      <h3>{{ title }}</h3>
      <p v-if="description">{{ description }}</p>
    </div>
    <el-button v-if="actionText" :type="actionType" plain @click="$emit('action')">
      {{ actionText }}
    </el-button>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: "empty",
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  actionText: {
    type: String,
    default: "",
  },
});

defineEmits(["action"]);

const roleName = computed(() => (props.type === "error" ? "alert" : "status"));
const actionType = computed(() => (props.type === "error" ? "danger" : "primary"));
const iconText = computed(() => {
  if (props.type === "loading") return "...";
  if (props.type === "error") return "!";
  return "-";
});
</script>

<style scoped>
.state-block {
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  min-height: 180px;
  padding: var(--space-6);
  text-align: left;
}

.state-block__icon {
  align-items: center;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  display: inline-flex;
  flex: 0 0 auto;
  font-weight: 700;
  height: 40px;
  justify-content: center;
  width: 40px;
}

.state-block__content {
  max-width: 460px;
}

.state-block h3 {
  font-size: 18px;
  margin: 0 0 6px;
}

.state-block p {
  color: var(--muted);
  line-height: 1.6;
  margin: 0;
}

.state-block.is-error .state-block__icon {
  background: var(--danger-soft);
  border-color: var(--danger-border);
  color: var(--danger);
}

.state-block.is-loading .state-block__icon {
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.45;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .state-block {
    align-items: stretch;
    display: grid;
    justify-items: start;
    min-height: 150px;
    padding: var(--space-5);
  }
}
</style>

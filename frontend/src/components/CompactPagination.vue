<template>
  <div v-if="totalPages > 1" class="compact-pagination" aria-label="分页导航">
    <el-button :disabled="modelValue <= 1" @click="changePage(modelValue - 1)">上一页</el-button>
    <div class="compact-pagination__jump">
      <el-input-number
        :model-value="modelValue"
        class="page-input"
        :controls="false"
        :min="1"
        :max="totalPages"
        @change="changePage"
      />
      <span>/ {{ totalPages }}</span>
    </div>
    <el-button :disabled="modelValue >= totalPages" @click="changePage(modelValue + 1)">下一页</el-button>
    <span class="compact-pagination__total">共 {{ total }} 条</span>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    default: 10,
  },
});

const emit = defineEmits(["update:modelValue"]);
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

function changePage(value) {
  const page = Math.min(Math.max(Math.trunc(Number(value || 1)), 1), totalPages.value);
  emit("update:modelValue", page);
}
</script>

<style scoped>
.compact-pagination {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  justify-content: flex-end;
}

.compact-pagination__jump {
  align-items: center;
  color: var(--muted);
  display: inline-flex;
  gap: var(--space-2);
}

.page-input {
  width: 74px;
}

.compact-pagination__total {
  color: var(--muted);
  font-size: 14px;
}

@media (max-width: 640px) {
  .compact-pagination {
    justify-content: stretch;
  }

  .compact-pagination :deep(.el-button) {
    flex: 1;
  }
}
</style>

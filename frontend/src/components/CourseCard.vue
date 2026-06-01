<template>
  <article class="course-card" :class="{ 'is-completed': isCompleted }">
    <div class="course-card__badge" :class="{ 'is-completed': isCompleted }">
      <strong>{{ badgeTitle }}</strong>
      <span>{{ badgeSubtitle }}</span>
    </div>
    <div class="course-card__body">
      <div class="course-card__title">
        <strong>{{ title }}</strong>
        <StatusTag :status="item.status" />
      </div>
      <div class="course-card__meta">{{ metaLine }}</div>
      <div class="course-card__time">
        {{ formatCourseDateText(item) }} · {{ formatCourseTimeText(item) }} · {{ formatHours(item.lesson_hours) }} 课时
      </div>
    </div>
    <el-button v-if="actionText && !isCompleted" type="primary" @click="$emit('action', item)">
      {{ actionText }}
    </el-button>
    <span v-else-if="doneText && isCompleted" class="course-card__done">{{ doneText }}</span>
  </article>
</template>

<script setup>
import { computed } from "vue";
import StatusTag from "./StatusTag.vue";
import { formatHours } from "../utils/format";
import { formatCourseDateText, formatCourseTimeText } from "../utils/schedule-time";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: "parent",
  },
  actionText: {
    type: String,
    default: "",
  },
  doneText: {
    type: String,
    default: "",
  },
});

defineEmits(["action"]);

const isCompleted = computed(() => props.item.status === "已消课");
const title = computed(() => {
  if (props.mode === "teacher") return `${props.item.student_name || "学生"} · ${props.item.course_name || "课程"}`;
  return props.item.course_name || "未设置课程";
});
const badgeTitle = computed(() => {
  if (props.mode === "teacher") return formatCourseTimeText(props.item).replace("-", "\n");
  return props.item.course_name || "课程";
});
const badgeSubtitle = computed(() => `${formatHours(props.item.lesson_hours)} 课时`);
const metaLine = computed(() => {
  if (props.mode === "teacher") {
    return `${props.item.student_grade || "年级未设置"} · ${props.item.course_category || "未设置类型"}`;
  }
  return `${props.item.teacher_name || "未设置老师"} · ${props.item.course_category || "未设置类型"}`;
});
</script>

<style scoped>
.course-card {
  align-items: center;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-soft);
  display: grid;
  gap: var(--space-4);
  grid-template-columns: auto minmax(0, 1fr) auto;
  min-height: 94px;
  padding: var(--space-4);
}

.course-card.is-completed {
  background: var(--surface-muted);
}

.course-card__badge {
  align-items: center;
  background: var(--primary-soft);
  border-radius: var(--radius-card);
  color: var(--primary);
  display: grid;
  font-variant-numeric: tabular-nums;
  justify-items: center;
  min-height: 76px;
  min-width: 92px;
  padding: var(--space-3);
  text-align: center;
  white-space: pre-line;
}

.course-card__badge.is-completed {
  background: var(--success-soft);
  color: var(--success-strong);
}

.course-card__badge span {
  font-size: 12px;
}

.course-card__title {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  min-width: 0;
}

.course-card__title strong {
  font-size: 16px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-card__meta,
.course-card__time {
  color: var(--muted);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.course-card__done {
  color: var(--muted);
  font-weight: 700;
}

@media (max-width: 640px) {
  .course-card {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .course-card__badge {
    align-items: center;
    display: flex;
    justify-content: space-between;
    min-height: auto;
    width: 100%;
  }

  .course-card__title strong,
  .course-card__meta,
  .course-card__time {
    white-space: normal;
  }

  .course-card .el-button,
  .course-card__done {
    justify-self: stretch;
    text-align: center;
  }
}
</style>

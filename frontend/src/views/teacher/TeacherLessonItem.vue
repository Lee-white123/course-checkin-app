<template>
  <article class="teacher-lesson-item" :class="{ 'is-completed': isCompleted }">
    <div class="teacher-lesson-item__block teacher-lesson-item__time">
      <strong>{{ weekday }}</strong>
      <span>{{ timeText }}</span>
    </div>

    <div class="teacher-lesson-item__block">
      <strong>{{ item.student_name || "未设置学生" }}</strong>
      <span>{{ item.student_grade || "年级未设置" }}</span>
    </div>

    <div class="teacher-lesson-item__block">
      <strong>{{ item.course_name || "未设置课程" }}</strong>
      <span>{{ formatHours(item.lesson_hours) }} 课时</span>
    </div>

    <div class="teacher-lesson-item__block teacher-lesson-item__meta">
      <strong>{{ item.course_category || "未设置类型" }}</strong>
      <span>{{ dateText }}</span>
    </div>

    <span class="teacher-lesson-item__status" :class="statusClass">
      {{ statusText }}
    </span>

    <el-button v-if="canCheckin" type="primary" @click="$emit('checkin', item)">打卡消课</el-button>
    <span v-else class="teacher-lesson-item__done">{{ doneText }}</span>
  </article>
</template>

<script setup>
import { computed } from "vue";
import { formatHours } from "../../utils/format";
import { formatCourseTimeText, parseDate, weekdayFromValue } from "../../utils/schedule-time";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

defineEmits(["checkin"]);

const isCompleted = computed(() => props.item.status === "已消课");
const canCheckin = computed(() => props.item.status !== "已消课" && props.item.status !== "异常");
const statusClass = computed(() => {
  if (props.item.status === "已消课") return "is-completed";
  if (props.item.status === "未打卡") return "is-missed";
  if (props.item.status === "异常") return "is-abnormal";
  return "is-pending";
});
const statusText = computed(() => {
  if (props.item.status === "已消课") return "已上课";
  return props.item.status || "待上课";
});
const doneText = computed(() => (props.item.status === "异常" ? "待处理" : "已完成"));
const weekday = computed(() => props.item.weekday || weekdayFromValue(props.item.planned_date) || "星期未定");
const timeText = computed(() => formatCourseTimeText(props.item));
const dateText = computed(() => {
  if (!props.item.planned_date) return "日期未设置";
  const date = parseDate(props.item.planned_date);
  if (Number.isNaN(date.getTime())) return props.item.planned_date;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
});
</script>

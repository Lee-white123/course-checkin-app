<template>
  <article class="parent-course-item" :class="{ 'is-completed': isCompleted }">
    <div class="parent-course-item__block parent-course-item__time">
      <strong>{{ weekday }}</strong>
      <span>{{ timeText }}</span>
    </div>

    <div class="parent-course-item__block parent-course-item__course">
      <strong>{{ item.course_name || "未设置课程" }}</strong>
      <span>{{ formatHours(item.lesson_hours) }} 课时</span>
    </div>

    <div class="parent-course-item__block parent-course-item__teacher">
      <strong>{{ item.course_category || "未设置类型" }}</strong>
      <span>授课老师：{{ item.teacher_name || "未设置老师" }}</span>
    </div>

    <div class="parent-course-item__block parent-course-item__date">
      <strong>{{ dateText }}</strong>
    </div>

    <span class="parent-course-item__status" :class="statusClass">
      {{ statusText }}
    </span>
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

const isCompleted = computed(() => props.item.status === "已消课");
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
const weekday = computed(() => props.item.weekday || weekdayFromValue(props.item.planned_date) || "星期未定");
const timeText = computed(() => formatCourseTimeText(props.item));
const dateText = computed(() => {
  if (!props.item.planned_date) return "日期未设置";
  const date = parseDate(props.item.planned_date);
  if (Number.isNaN(date.getTime())) return props.item.planned_date;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
});
</script>

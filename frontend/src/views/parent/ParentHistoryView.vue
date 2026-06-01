<template>
  <section class="parent-page">
    <el-card shadow="never">
      <template #header>
        <div class="parent-card-header">
          <div>
            <strong>历史上课记录</strong>
            <span>按消课时间倒序展示，最新消课记录在最上方。</span>
          </div>
        </div>
      </template>

      <div class="parent-course-list">
        <div class="paginated-list-window" :style="{ '--list-visible-items': pageSize }">
          <el-empty v-if="!studentRecords.length" description="暂无上课记录" />
          <article v-for="item in pagedStudentRecords" :key="item.id" class="parent-history-card">
            <div class="history-section history-course">
              <strong>{{ item.course_name || "课程" }}</strong>
              <span>{{ formatHours(item.lesson_hours) }} 课时</span>
            </div>

            <div class="history-section">
              <strong>{{ item.teacher_name || "老师未设置" }}</strong>
              <span>{{ item.course_category || "课程类型未设置" }}</span>
            </div>

            <div class="history-section history-time">
              <strong>{{ checkedDate(item.checked_at) }}</strong>
              <span>{{ checkedTime(item.checked_at) }}</span>
            </div>

            <div class="history-section history-notes">
              <p>课堂反馈：{{ item.feedback || "未填写" }}</p>
              <p>错题/备注：{{ item.wrong_notes || "未填写" }}</p>
            </div>

            <span class="history-status">已上课</span>
          </article>
        </div>
        <CompactPagination
          v-model="currentPage"
          :total="studentRecords.length"
          :page-size="pageSize"
        />
      </div>
    </el-card>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import CompactPagination from "../../components/CompactPagination.vue";
import { formatHours } from "../../utils/format";
import { weekdayFromValue } from "../../utils/schedule-time";
import { useParentPortal } from "./useParentPortal";
import "./parent.css";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const { studentRecords } = useParentPortal(props.state);

const pageSize = 5;
const currentPage = ref(1);
const pagedStudentRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return studentRecords.value.slice(start, start + pageSize);
});

watch(studentRecords, () => {
  const totalPages = Math.max(1, Math.ceil(studentRecords.value.length / pageSize));
  currentPage.value = Math.min(currentPage.value, totalPages);
  if (currentPage.value < 1) currentPage.value = 1;
});

function checkedDate(value) {
  if (!value) return "日期未记录";
  const text = String(value);
  return text.slice(0, 10) || "日期未记录";
}

function checkedTime(value) {
  if (!value) return "时间未记录";
  const text = String(value);
  const match = text.match(/(\d{2}:\d{2}:\d{2})/);
  const time = match?.[1] || "时间未记录";
  const weekday = weekdayFromValue(text);
  return weekday ? `${weekday} ${time}` : time;
}
</script>

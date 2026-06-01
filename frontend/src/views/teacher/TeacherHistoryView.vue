<template>
  <TeacherPendingReview
    v-if="!isTeacherApproved"
    :auth="auth"
    :display-name="displayName"
    :teacher-account="teacherAccount"
    :teacher-phone="teacherPhone"
    :teacher-status="teacherStatus"
    :teacher-subjects="teacherSubjects"
  />

  <section v-else class="teacher-page">
    <el-card shadow="never">
      <template #header>
        <div class="teacher-card-header">
          <div>
            <strong>历史上课记录</strong>
            <span>按消课时间倒序展示，最新消课记录在最上方。</span>
          </div>
        </div>
      </template>

      <div class="teacher-course-list">
        <div class="paginated-list-window" :style="{ '--list-visible-items': pageSize }">
          <el-empty v-if="!teacherRecords.length" description="暂无历史授课记录" />
          <article v-for="item in pagedTeacherRecords" :key="item.id" class="teacher-history-card">
            <div class="history-section history-course">
              <strong>{{ item.course_name || "课程" }}</strong>
              <span>{{ formatHours(item.lesson_hours) }} 课时</span>
            </div>

            <div class="history-section">
              <strong>{{ item.student_name || "学生未设置" }}</strong>
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
          :total="teacherRecords.length"
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
import TeacherPendingReview from "./TeacherPendingReview.vue";
import { useTeacherPortal } from "./useTeacherPortal";
import "./teacher.css";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const {
  auth,
  displayName,
  isTeacherApproved,
  teacherAccount,
  teacherPhone,
  teacherRecords,
  teacherStatus,
  teacherSubjects,
} = useTeacherPortal(props.state);

const pageSize = 5;
const currentPage = ref(1);
const pagedTeacherRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return teacherRecords.value.slice(start, start + pageSize);
});

watch(teacherRecords, () => {
  const totalPages = Math.max(1, Math.ceil(teacherRecords.value.length / pageSize));
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

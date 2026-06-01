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
        <ParentWeekHeader
          title="查看本周课程"
          :week-range="weekRangeLabel"
          :summary="`本周共 ${weekSchedules.length} 节课程`"
          @change-week="changeWeek"
          @current-week="goCurrentWeek"
        />
      </template>

      <div class="teacher-course-list">
        <div class="paginated-list-window" :style="{ '--list-visible-items': pageSize }">
          <van-empty v-if="!sortedWeekCourses.length" description="本周暂无课程安排" />
          <TeacherLessonItem
            v-for="item in pagedWeekCourses"
            :key="item.id"
            :item="item"
            @checkin="openCheckin"
          />
        </div>
        <CompactPagination
          v-model="currentPage"
          :total="sortedWeekCourses.length"
          :page-size="pageSize"
        />
      </div>
    </el-card>

    <TeacherCheckinDialog v-model="dialogVisible" :form="checkinForm" @confirm="checkin" />
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import CompactPagination from "../../components/CompactPagination.vue";
import { scheduleTimeValue } from "../../utils/schedule-time";
import ParentWeekHeader from "../parent/ParentWeekHeader.vue";
import TeacherCheckinDialog from "./TeacherCheckinDialog.vue";
import TeacherLessonItem from "./TeacherLessonItem.vue";
import TeacherPendingReview from "./TeacherPendingReview.vue";
import { useTeacherPortal } from "./useTeacherPortal";
import "./teacher.css";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["state-updated"]);

const {
  auth,
  checkin,
  checkinForm,
  dialogVisible,
  displayName,
  isTeacherApproved,
  teacherAccount,
  teacherPhone,
  teacherStatus,
  teacherSubjects,
  weekRangeLabel,
  weekSchedules,
  changeWeek,
  goCurrentWeek,
  openCheckin,
} = useTeacherPortal(props.state, emit);

const pageSize = 5;
const currentPage = ref(1);

const sortedWeekCourses = computed(() =>
  [...weekSchedules.value].sort((a, b) => {
    const aCompleted = a.status === "已消课";
    const bCompleted = b.status === "已消课";
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
    if (aCompleted) return completedTimeValue(b) - completedTimeValue(a);
    return scheduleTimeValue(a) - scheduleTimeValue(b);
  })
);

const pagedWeekCourses = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return sortedWeekCourses.value.slice(start, start + pageSize);
});

watch(sortedWeekCourses, () => {
  const totalPages = Math.max(1, Math.ceil(sortedWeekCourses.value.length / pageSize));
  currentPage.value = Math.min(currentPage.value, totalPages);
  if (currentPage.value < 1) currentPage.value = 1;
});

watch(weekRangeLabel, () => {
  currentPage.value = 1;
});

function completedTimeValue(row) {
  const value = Date.parse(row?.checked_at || row?.recorded_at || row?.updated_at || row?.completed_at || "");
  if (!Number.isNaN(value)) return value;
  return scheduleTimeValue(row);
}
</script>

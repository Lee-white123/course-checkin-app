<template>
  <section class="parent-page">
    <el-card class="parent-schedule-card" shadow="never">
      <template #header>
        <ParentWeekHeader
          title="查看课程"
          :week-range="weekRangeLabel"
          :summary="`本周共 ${weekSchedules.length} 节课程`"
          @change-week="changeWeek"
          @current-week="goCurrentWeek"
        />
      </template>

      <div class="parent-course-list">
        <div class="paginated-list-window" :style="{ '--list-visible-items': pageSize }">
          <van-empty v-if="!sortedWeekCourses.length" description="本周暂无课程安排" />
          <ParentCourseItem v-for="item in pagedWeekCourses" :key="item.id" :item="item" />
        </div>
        <CompactPagination
          v-model="currentPage"
          :total="sortedWeekCourses.length"
          :page-size="pageSize"
        />
      </div>
    </el-card>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import CompactPagination from "../../components/CompactPagination.vue";
import { scheduleTimeValue } from "../../utils/schedule-time";
import ParentCourseItem from "./ParentCourseItem.vue";
import ParentWeekHeader from "./ParentWeekHeader.vue";
import { useParentPortal } from "./useParentPortal";
import "./parent.css";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const { weekRangeLabel, weekSchedules, changeWeek, goCurrentWeek } = useParentPortal(props.state);

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

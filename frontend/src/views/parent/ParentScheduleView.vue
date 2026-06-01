<template>
  <section class="parent-page">
    <el-card class="desktop-week-card" shadow="never">
      <template #header>
        <ParentWeekHeader
          title="完整课程表"
          :week-range="weekRangeLabel"
          :summary="`本周共 ${weekSchedules.length} 节课程`"
          @change-week="changeWeek"
          @current-week="goCurrentWeek"
        />
      </template>

      <div class="parent-week-board">
        <div class="parent-week-overview" aria-label="本周课程概览">
          <div
            v-for="day in weekDays"
            :key="`${day.date}-overview`"
            class="parent-week-overview__day"
            :class="{ 'has-lessons': schedulesByDate[day.date]?.length }"
          >
            <strong>{{ day.weekday }}</strong>
            <div>
              <span>{{ day.shortDate }}</span>
              <small>{{ schedulesByDate[day.date]?.length || 0 }}节</small>
            </div>
          </div>
        </div>

        <div class="parent-week-columns">
          <section v-for="day in weekDays" :key="`${day.date}-column`" class="parent-week-column">
            <div v-if="!scheduleGroupsByDate[day.date]?.length" class="parent-week-column__empty">
              暂无课程
            </div>

            <div
              v-for="group in scheduleGroupsByDate[day.date]"
              :key="`${day.date}-${group.time}`"
              class="parent-time-group"
            >
              <div class="parent-time-group__label">{{ group.time }}</div>
              <div class="parent-time-group__lessons" :class="{ stacked: group.items.length > 1 }">
                <article
                  v-for="item in group.items"
                  :key="item.id"
                  class="parent-board-lesson"
                  :class="{ completed: item.status === '已消课' }"
                  :style="lessonStyle(item)"
                >
                  <strong>{{ item.course_name || "课程" }}</strong>
                  <span>{{ item.teacher_name || "未设置老师" }} · {{ item.course_category || "未设置类型" }}</span>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
    </el-card>
  </section>
</template>

<script setup>
import { computed } from "vue";
import ParentWeekHeader from "./ParentWeekHeader.vue";
import { formatCourseTimeText, timeToMinutes } from "../../utils/schedule-time";
import { useParentPortal } from "./useParentPortal";
import "./parent.css";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const { weekDays, weekRangeLabel, weekSchedules, schedulesByDate, changeWeek, goCurrentWeek } = useParentPortal(props.state);

const scheduleGroupsByDate = computed(() => {
  const grouped = {};
  for (const day of weekDays.value) {
    const timeGroups = new Map();
    for (const item of schedulesByDate.value[day.date] || []) {
      const time = formatCourseTimeText(item);
      if (!timeGroups.has(time)) timeGroups.set(time, []);
      timeGroups.get(time).push(item);
    }
    grouped[day.date] = [...timeGroups.entries()]
      .map(([time, items]) => ({
        time,
        items: items.sort((a, b) => lessonSortValue(a) - lessonSortValue(b)),
      }))
      .sort((a, b) => lessonSortValue(a.items[0]) - lessonSortValue(b.items[0]));
  }
  return grouped;
});

function lessonStyle(item) {
  const palette = paletteFor(item);
  return {
    backgroundColor: item.status === "已消课" ? palette.doneBg : palette.bg,
    borderColor: item.status === "已消课" ? palette.doneBorder : palette.border,
    color: item.status === "已消课" ? palette.doneText : palette.text,
  };
}

function lessonSortValue(item) {
  return timeToMinutes(item?.start_time, 0);
}

function paletteFor(item) {
  const palettes = [
    { bg: "#eaf3ff", border: "#8fc1ff", text: "#173a67", doneBg: "#e8f8ef", doneBorder: "#8ed7a3", doneText: "#1f5f2d" },
    { bg: "#fff6e8", border: "#f2c477", text: "#69430d", doneBg: "#fff0d6", doneBorder: "#e7af54", doneText: "#68400b" },
    { bg: "#f1edff", border: "#b5a0f4", text: "#3e2a6c", doneBg: "#e7defb", doneBorder: "#9b82e7", doneText: "#382263" },
    { bg: "#eafaf8", border: "#72d4cb", text: "#115750", doneBg: "#d9f4f0", doneBorder: "#4bbdb4", doneText: "#0f514b" },
  ];
  const seed = `${item.teacher_name}-${item.course_name}-${item.course_category}`;
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palettes[hash % palettes.length];
}
</script>

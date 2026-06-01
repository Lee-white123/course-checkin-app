<template>
  <section class="stack">
    <div class="admin-module-hero">
      <div>
        <span>管理员端</span>
        <h2>完整课程表</h2>
        <p>按周查看所有老师和学生的课程安排，方便快速掌握整体排课情况。</p>
      </div>
      <div class="admin-module-metrics">
        <div>
          <strong>{{ weekSchedules.length }}</strong>
          <small>本周课程</small>
        </div>
        <div>
          <strong>{{ pendingWeekCount }}</strong>
          <small>待上课</small>
        </div>
        <div>
          <strong>{{ completedWeekCount }}</strong>
          <small>已上课</small>
        </div>
      </div>
    </div>

    <el-card class="admin-course-table-card" shadow="never">
      <template #header>
        <ParentWeekHeader
          title="完整课程表"
          :week-range="weekRangeLabel"
          :summary="`本周共 ${weekSchedules.length} 节课程`"
          @change-week="changeWeek"
          @current-week="goCurrentWeek"
        />
      </template>

      <div class="admin-week-board">
        <div class="admin-week-overview" aria-label="本周课程概览">
          <div
            v-for="day in weekDays"
            :key="`${day.date}-overview`"
            class="admin-week-overview__day"
            :class="{ 'has-lessons': schedulesByDate[day.date]?.length }"
          >
            <strong>{{ day.weekday }}</strong>
            <div>
              <span>{{ day.shortDate }}</span>
              <small>{{ schedulesByDate[day.date]?.length || 0 }}节</small>
            </div>
          </div>
        </div>

        <div class="admin-week-columns">
          <section v-for="day in weekDays" :key="`${day.date}-column`" class="admin-week-column">
            <div v-if="!scheduleGroupsByDate[day.date]?.length" class="admin-week-column__empty">
              暂无课程
            </div>

            <div
              v-for="group in scheduleGroupsByDate[day.date]"
              :key="`${day.date}-${group.time}`"
              class="admin-time-group"
            >
              <div class="admin-time-group__label">{{ group.time }}</div>
              <div
                class="admin-time-group__lessons"
                :class="{ stacked: group.items.length > 1 }"
                :style="{ '--stack-count': group.items.length }"
              >
                <article
                  v-for="(item, index) in group.items"
                  :key="item.id"
                  class="admin-board-lesson"
                  :class="{ completed: item.status === '已消课', active: activeLessonId === item.id && group.items.length > 1 }"
                  :style="stackedLessonStyle(item, index)"
                  :role="group.items.length > 1 ? 'button' : undefined"
                  :tabindex="group.items.length > 1 ? 0 : undefined"
                  :aria-label="group.items.length > 1 ? lessonAriaLabel(item) : undefined"
                  @click="group.items.length > 1 && activateLesson(item)"
                  @keydown="group.items.length > 1 && handleLessonKeydown($event, item)"
                >
                  <strong>{{ item.student_name || "学生" }} · {{ item.course_name || "课程" }}</strong>
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
import { computed, ref } from "vue";
import ParentWeekHeader from "../parent/ParentWeekHeader.vue";
import { formatCourseTimeText, addDays, dateKey, formatDate, formatSlashDate, getMonday, getWeekDays, parseDate, timeToMinutes } from "../../utils/schedule-time";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const today = new Date();
const currentWeekStart = ref(formatDate(getMonday(today)));
const activeLessonId = ref(null);

const weekDays = computed(() => getWeekDays(currentWeekStart.value));
const weekRangeLabel = computed(() => {
  const start = parseDate(currentWeekStart.value);
  const end = addDays(start, 6);
  return `${formatSlashDate(start)}-${formatSlashDate(end)}`;
});

const schedulesByDate = computed(() => {
  const grouped = Object.fromEntries(weekDays.value.map((day) => [day.date, []]));
  for (const item of props.state.schedules || []) {
    const plannedDate = dateKey(item.planned_date);
    if (!plannedDate || !grouped[plannedDate]) continue;
    grouped[plannedDate].push({ ...item, planned_date: plannedDate });
  }

  for (const day of weekDays.value) {
    grouped[day.date].sort((a, b) => lessonSortValue(a) - lessonSortValue(b));
  }
  return grouped;
});

const weekSchedules = computed(() => weekDays.value.flatMap((day) => schedulesByDate.value[day.date] || []));
const pendingWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === "待上课").length);
const completedWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === "已消课").length);

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

function changeWeek(offset) {
  currentWeekStart.value = formatDate(addDays(parseDate(currentWeekStart.value), offset * 7));
}

function goCurrentWeek() {
  currentWeekStart.value = formatDate(getMonday(new Date()));
}

function lessonStyle(item) {
  const palette = paletteFor(item);
  return {
    backgroundColor: item.status === "已消课" ? palette.doneBg : palette.bg,
    borderColor: item.status === "已消课" ? palette.doneBorder : palette.border,
    color: item.status === "已消课" ? palette.doneText : palette.text,
  };
}

function stackedLessonStyle(item, index) {
  return {
    ...lessonStyle(item),
    "--stack-index": index,
    "--stack-z": activeLessonId.value === item.id ? 50 : 10 + index,
  };
}

function activateLesson(item) {
  activeLessonId.value = item.id;
}

function handleLessonKeydown(event, item) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  activateLesson(item);
}

function lessonAriaLabel(item) {
  return `${item.student_name || "学生"}，${item.course_name || "课程"}，${item.teacher_name || "未设置老师"}，${item.course_category || "未设置类型"}`;
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
    { bg: "#fff0f4", border: "#ef94ad", text: "#64243a", doneBg: "#ffdce7", doneBorder: "#df6c8c", doneText: "#66142c" },
  ];
  const seed = `${item.teacher_name}-${item.student_name}-${item.course_name}-${item.course_category}`;
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palettes[hash % palettes.length];
}
</script>

<style scoped>
.admin-module-hero {
  align-items: center;
  background: linear-gradient(135deg, var(--surface) 0%, var(--primary-soft) 100%);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  display: flex;
  gap: 18px;
  justify-content: space-between;
  padding: 22px 24px;
}

.admin-module-hero span {
  color: var(--primary);
  font-size: 13px;
  font-weight: 700;
}

.admin-module-hero h2 {
  font-size: 24px;
  margin: 8px 0;
}

.admin-module-hero p {
  color: var(--muted);
  margin: 0;
}

.admin-module-metrics {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(86px, 1fr));
}

.admin-module-metrics div {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-control);
  display: grid;
  gap: 5px;
  justify-items: center;
  padding: 12px;
}

.admin-module-metrics strong {
  font-size: 24px;
}

.admin-module-metrics small {
  color: var(--muted);
}

.admin-course-table-card :deep(.el-card__body) {
  padding: 24px;
}

.admin-course-table-card :deep(.parent-week-header) {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.admin-course-table-card :deep(.parent-week-header > div:first-child) {
  display: grid;
  gap: 4px;
}

.admin-course-table-card :deep(.parent-week-header span),
.admin-course-table-card :deep(.parent-week-header small) {
  color: var(--muted);
  font-size: 13px;
}

.admin-course-table-card :deep(.parent-week-actions) {
  align-items: center;
  background: #f6f9fe;
  border: 1px solid #dbe7f5;
  border-radius: 12px;
  display: inline-flex;
  gap: 4px;
  justify-content: flex-end;
  padding: 4px;
}

.admin-course-table-card :deep(.parent-week-button) {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 9px;
  color: var(--muted);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  gap: 6px;
  min-height: 34px;
  padding: 0 14px;
}

.admin-course-table-card :deep(.parent-week-button span) {
  color: inherit;
  font-size: 18px;
  line-height: 1;
}

.admin-course-table-card :deep(.parent-week-button:hover),
.admin-course-table-card :deep(.parent-week-button:focus-visible) {
  background: #ffffff;
  color: var(--primary);
  outline: none;
}

.admin-course-table-card :deep(.parent-week-button.is-current) {
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(29, 93, 214, 0.12);
  color: var(--primary);
}

.admin-week-board {
  display: grid;
  gap: 18px;
}

.admin-week-overview {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(7, minmax(120px, 1fr));
}

.admin-week-overview__day {
  align-items: center;
  background: #f8fbff;
  border: 1px solid var(--line);
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  min-height: 74px;
  padding: 12px 14px;
}

.admin-week-overview__day.has-lessons {
  background: #edf7f2;
}

.admin-week-overview__day strong {
  font-size: 18px;
}

.admin-week-overview__day div {
  color: #475569;
  display: grid;
  gap: 2px;
  justify-items: end;
}

.admin-week-overview__day small {
  color: #64748b;
}

.admin-week-columns {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 14px;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  overflow: hidden;
}

.admin-week-column {
  align-content: start;
  background:
    linear-gradient(to bottom, rgba(36, 107, 254, 0.025), rgba(36, 107, 254, 0)),
    #ffffff;
  border-right: 1px solid var(--line);
  display: grid;
  gap: 10px;
  min-height: 430px;
  min-width: 0;
  padding: 12px;
}

.admin-week-column:last-child {
  border-right: 0;
}

.admin-week-column__empty {
  align-items: center;
  border: 1px dashed #d5e2f2;
  border-radius: 12px;
  color: #64748b;
  display: flex;
  font-size: 13px;
  justify-content: center;
  min-height: 88px;
}

.admin-time-group {
  background: #f8fbff;
  border: 1px solid #dbe7f5;
  border-radius: 14px;
  display: grid;
  gap: 8px;
  padding: 9px;
}

.admin-time-group__label {
  color: var(--primary);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: 0;
  text-align: center;
}

.admin-time-group__lessons {
  display: grid;
  gap: 8px;
}

.admin-time-group__lessons.stacked {
  display: block;
  min-height: calc(74px + (var(--stack-count) - 1) * 34px);
  position: relative;
}

.admin-board-lesson {
  border: 1px solid;
  border-radius: 10px;
  box-shadow: var(--shadow-card-soft);
  display: grid;
  gap: 6px;
  min-height: 74px;
  min-width: 0;
  padding: 10px;
}

.admin-board-lesson.completed {
  box-shadow: var(--shadow-card-soft);
}

.admin-board-lesson strong,
.admin-board-lesson span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-time-group__lessons.stacked .admin-board-lesson {
  cursor: pointer;
  left: 0;
  position: absolute;
  right: 0;
  top: calc(var(--stack-index) * 34px);
  transition: box-shadow 0.16s ease, filter 0.16s ease;
  z-index: var(--stack-z);
}

.admin-time-group__lessons.stacked .admin-board-lesson.active,
.admin-time-group__lessons.stacked .admin-board-lesson:hover {
  filter: saturate(1.03);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.14);
}

.admin-time-group__lessons.stacked .admin-board-lesson:focus-visible {
  outline: 2px solid rgba(36, 107, 254, 0.36);
  outline-offset: 2px;
}

.admin-time-group__lessons.stacked .admin-board-lesson:not(:last-child)::after {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(15, 23, 42, 0.08));
  border-radius: inherit;
  content: "";
  inset: 44px 0 0;
  pointer-events: none;
  position: absolute;
}

.admin-board-lesson strong {
  color: inherit;
  font-size: 16px;
  line-height: 1.25;
}

.admin-board-lesson span {
  color: inherit;
  font-size: 13px;
  opacity: 0.84;
}

@media (max-width: 1100px) {
  .admin-course-table-card :deep(.el-card__body) {
    overflow-x: auto;
  }

  .admin-week-overview,
  .admin-week-columns {
    min-width: 980px;
  }
}

@media (max-width: 760px) {
  .admin-module-hero {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { getAuth } from "../../auth/session";
import {
  addDays,
  dateKey,
  formatDate,
  formatSlashDate,
  getMonday,
  getWeekDays,
  parseDate,
  scheduleTimeValue,
  timeRangeToGrid,
  timeToMinutes,
} from "../../utils/schedule-time";

export function useParentPortal(state) {
  const route = useRoute();
  const auth = getAuth();
  const todayText = formatDate(new Date());
  const currentWeekStart = ref(formatDate(getMonday(new Date())));
  const linkedStudentId = Number(auth?.user?.related_id || 0);

  const displayName = computed(() => auth?.user?.name || route.params.name || "家长");
  const student = computed(() => state.students.find((item) => Number(item.id) === linkedStudentId));
  const studentName = computed(() => student.value?.name || "暂无学生");
  const studentGrade = computed(() => student.value?.grade || "年级未设置");

  const studentSchedules = computed(() => {
    if (!linkedStudentId) return [];
    return state.schedules
      .filter((item) => Number(item.student_id) === linkedStudentId)
      .sort((a, b) => scheduleTimeValue(a) - scheduleTimeValue(b));
  });

  const studentRecords = computed(() => {
    if (!linkedStudentId) return [];
    return state.records
      .filter((item) => Number(item.student_id) === linkedStudentId)
      .sort((a, b) => recordTimeValue(b) - recordTimeValue(a));
  });

  const weekDays = computed(() => getWeekDays(currentWeekStart.value));
  const weekRangeLabel = computed(() => {
    const start = parseDate(currentWeekStart.value);
    const end = addDays(start, 6);
    return `${formatSlashDate(start)}-${formatSlashDate(end)}`;
  });

  const weekSchedules = computed(() => {
    const dates = new Set(weekDays.value.map((day) => day.date));
    return studentSchedules.value.filter((item) => dates.has(dateKey(item.planned_date)));
  });

  const todaySchedules = computed(() =>
    studentSchedules.value.filter((item) => dateKey(item.planned_date) === todayText)
  );

  const schedulesByDate = computed(() => {
    const grouped = Object.fromEntries(weekDays.value.map((day) => [day.date, []]));
    for (const item of weekSchedules.value) {
      grouped[dateKey(item.planned_date)]?.push(item);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    }
    return grouped;
  });

  const timetableItemsByDate = computed(() => {
    const grouped = Object.fromEntries(weekDays.value.map((day) => [day.date, []]));
    for (const item of weekSchedules.value) {
      const range = timeRangeToGrid(item.start_time, item.end_time);
      if (!range) continue;
      grouped[dateKey(item.planned_date)]?.push({ ...item, ...range });
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    }
    return grouped;
  });

  const nextLesson = computed(() =>
    studentSchedules.value.find((item) => item.status === "待上课" && scheduleTimeValue(item) >= Date.now())
  );
  const pendingWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === "待上课").length);
  const completedWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === "已消课").length);

  function changeWeek(offset) {
    currentWeekStart.value = formatDate(addDays(parseDate(currentWeekStart.value), offset * 7));
  }

  function goCurrentWeek() {
    currentWeekStart.value = formatDate(getMonday(new Date()));
  }

  return {
    currentWeekStart,
    todayText,
    displayName,
    studentName,
    studentGrade,
    studentSchedules,
    studentRecords,
    weekDays,
    weekRangeLabel,
    weekSchedules,
    todaySchedules,
    schedulesByDate,
    timetableItemsByDate,
    nextLesson,
    pendingWeekCount,
    completedWeekCount,
    changeWeek,
    goCurrentWeek,
  };
}

function recordTimeValue(row) {
  const value = Date.parse(row?.checked_at || row?.created_at || "");
  return Number.isNaN(value) ? 0 : value;
}

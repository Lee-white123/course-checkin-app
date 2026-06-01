import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "../../api/client";
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
  timeToMinutes,
} from "../../utils/schedule-time";

export function useTeacherPortal(state, emit) {
  const route = useRoute();
  const auth = getAuth();
  const selectedSchedule = ref(null);
  const dialogVisible = ref(false);
  const checkinForm = reactive({ lesson_hours: 1, feedback: "", wrong_notes: "" });
  const currentWeekStart = ref(formatDate(getMonday(new Date())));
  const linkedTeacherId = Number(auth?.user?.related_id || 0);
  const todayText = formatDate(new Date());

  const teacherProfile = computed(() =>
    (state.teachers || []).find((item) => Number(item.id) === linkedTeacherId)
  );
  const teacherAccount = computed(() =>
    (state.teacherAccounts || []).find((item) => Number(item.related_id) === linkedTeacherId)
  );
  const teacherProfileStatus = computed(() => auth?.user?.profile_status || teacherProfile.value?.status || "启用");
  const isTeacherApproved = computed(() => teacherProfileStatus.value === "启用");
  const displayName = computed(() => auth?.user?.name || teacherProfile.value?.name || route.params.name || "老师");
  const teacherStatus = computed(() => statusText(teacherProfileStatus.value));
  const teacherPhone = computed(() => teacherAccount.value?.phone || teacherProfile.value?.phone || auth?.user?.phone || "未填写");
  const teacherSubjects = computed(() => teacherProfile.value?.subject || "未任命科目");

  const teacherSchedules = computed(() => {
    const schedules = linkedTeacherId
      ? (state.schedules || []).filter((item) => Number(item.teacher_id) === linkedTeacherId)
      : (state.schedules || []);
    return [...schedules].sort((a, b) => scheduleTimeValue(a) - scheduleTimeValue(b));
  });

  const teacherRecords = computed(() => {
    const records = linkedTeacherId
      ? (state.records || []).filter((item) => Number(item.teacher_id) === linkedTeacherId)
      : (state.records || []);
    return [...records].sort((a, b) => recordTimeValue(b) - recordTimeValue(a));
  });

  const weekDays = computed(() => getWeekDays(currentWeekStart.value));
  const weekRangeLabel = computed(() => {
    const start = parseDate(currentWeekStart.value);
    const end = addDays(start, 6);
    return `${formatSlashDate(start)}-${formatSlashDate(end)}`;
  });

  const weekSchedules = computed(() => {
    const dates = new Set(weekDays.value.map((day) => day.date));
    return teacherSchedules.value.filter((item) => dates.has(dateKey(item.planned_date)));
  });

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

  const todaySchedules = computed(() =>
    teacherSchedules.value.filter((item) => dateKey(item.planned_date) === todayText)
  );
  const nextLesson = computed(() =>
    teacherSchedules.value.find((item) => item.status === "待上课" && scheduleTimeValue(item) >= Date.now())
  );
  const todayPendingCount = computed(() => todaySchedules.value.filter((item) => item.status === "待上课").length);
  const pendingWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === "待上课").length);
  const completedWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === "已消课").length);

  function changeWeek(offset) {
    currentWeekStart.value = formatDate(addDays(parseDate(currentWeekStart.value), offset * 7));
  }

  function goCurrentWeek() {
    currentWeekStart.value = formatDate(getMonday(new Date()));
  }

  function openCheckin(item) {
    if (!item || item.status === "已消课" || item.status === "异常") return;
    selectedSchedule.value = item;
    Object.assign(checkinForm, { lesson_hours: item.lesson_hours, feedback: "", wrong_notes: "" });
    dialogVisible.value = true;
  }

  async function checkin() {
    if (!selectedSchedule.value) return;

    try {
      const payload = await api(`/api/schedules/${selectedSchedule.value.id}/checkin`, {
        method: "POST",
        body: JSON.stringify(checkinForm),
      });
      emit?.("state-updated", payload);
      dialogVisible.value = false;
      ElMessage.success("已完成打卡消课");
    } catch (error) {
      ElMessage.error(error.message);
    }
  }

  return {
    auth,
    checkin,
    checkinForm,
    currentWeekStart,
    dialogVisible,
    displayName,
    isTeacherApproved,
    linkedTeacherId,
    nextLesson,
    pendingWeekCount,
    schedulesByDate,
    selectedSchedule,
    teacherAccount,
    teacherPhone,
    teacherProfile,
    teacherRecords,
    teacherSchedules,
    teacherStatus,
    teacherSubjects,
    todayPendingCount,
    todaySchedules,
    todayText,
    weekDays,
    weekRangeLabel,
    weekSchedules,
    completedWeekCount,
    changeWeek,
    goCurrentWeek,
    openCheckin,
  };
}

function statusText(status) {
  if (status === "待审核") return "待审核";
  if (status === "已注销") return "需注销";
  return "已审核(正常)";
}

function recordTimeValue(row) {
  const value = Date.parse(row?.checked_at || row?.created_at || "");
  return Number.isNaN(value) ? 0 : value;
}

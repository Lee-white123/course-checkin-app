<template>
  <el-card shadow="never">
    <template #header>
      <div class="timetable-card-header">
        <strong>{{ title }}</strong>
        <div class="week-switcher">
          <el-button plain @click="changeWeek(-1)">上一周</el-button>
          <span class="week-range">{{ weekRangeLabel }}</span>
          <el-button plain @click="changeWeek(1)">下一周</el-button>
          <el-button type="primary" plain @click="goCurrentWeek">本周</el-button>
        </div>
      </div>
    </template>

    <div class="timetable-scroll">
      <div class="timetable-grid">
        <div class="timetable-corner">时间</div>
        <div
          v-for="day in weekDays"
          :key="day.date"
          class="timetable-day-head"
          :class="{ 'is-today': day.date === todayText }"
        >
          <strong>{{ day.weekday }}</strong>
          <span>{{ day.shortDate }} · {{ scheduleItemsByDate[day.date]?.length || 0 }} 节</span>
        </div>

        <div class="timetable-axis">
          <div
            v-for="period in timePeriods"
            :key="period.label"
            class="timetable-period"
            :style="{ gridRow: period.row }"
          >
            {{ period.label }}
          </div>
        </div>

        <div v-for="day in weekDays" :key="`${day.date}-track`" class="timetable-track">
          <div
            v-for="period in timePeriods"
            :key="`${day.date}-${period.label}`"
            class="timetable-slot"
            :style="{ gridRow: period.row }"
          />
          <div
            v-for="item in scheduleItemsByDate[day.date]"
            :key="item.id"
            class="timetable-event"
            :class="{ 'is-completed': item.status === '已消课', 'is-active': activeEventId === item.id }"
            :style="eventStyle(item)"
            :title="eventTitle(item)"
            @click.stop="activateEvent(item.id)"
          >
            <div class="event-title">{{ eventHeading(item) }}</div>
            <div class="event-line">{{ detailDateLabel(item) }} · {{ formatTimeRange(item.start_time, item.end_time) }}</div>
            <div class="event-meta">{{ formatHours(item.lesson_hours) }}课时 · {{ categoryLabel(item) }}</div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { computed, ref } from "vue";
import { formatHours, formatTimeRange } from "../utils/format";

const props = defineProps({
  schedules: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: "周课程表",
  },
});

const weekNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const timePeriods = [
  { label: "08:00-10:00", row: "1 / 5" },
  { label: "10:00-12:00", row: "5 / 9" },
  { label: "14:00-16:00", row: "10 / 14" },
  { label: "16:00-18:00", row: "14 / 18" },
  { label: "18:00-20:00", row: "18 / 22" },
];

const today = new Date();
const todayText = formatDate(today);
const currentWeekStart = ref(formatDate(getMonday(today)));
const activeEventId = ref(null);

const eventPalettes = [
  { bg: "#e8f3ff", border: "#79b8ff", accent: "#1d6fe8", text: "#14345b", doneBg: "#d7f3e8", doneBorder: "#49b487", doneAccent: "#12805c", doneText: "#0f513f" },
  { bg: "#fff2df", border: "#f5b45f", accent: "#d97706", text: "#5f3a0b", doneBg: "#ffe0c2", doneBorder: "#ee8f35", doneAccent: "#c45b0c", doneText: "#6b3308" },
  { bg: "#eef2ff", border: "#9baeff", accent: "#4f63e6", text: "#202d63", doneBg: "#dddfff", doneBorder: "#7c86ef", doneAccent: "#4b55d9", doneText: "#20235f" },
  { bg: "#f1f8e8", border: "#9dcc5d", accent: "#5d9f20", text: "#2f4d16", doneBg: "#e0f1cb", doneBorder: "#76b83f", doneAccent: "#3f8a16", doneText: "#234d13" },
  { bg: "#fff0f4", border: "#ef94ad", accent: "#d93662", text: "#64243a", doneBg: "#ffdce7", doneBorder: "#df6c8c", doneAccent: "#b91f4c", doneText: "#66142c" },
  { bg: "#e9fbf9", border: "#64cfc4", accent: "#119c92", text: "#104d48", doneBg: "#cff3ef", doneBorder: "#35b7ab", doneAccent: "#087d76", doneText: "#0d514c" },
  { bg: "#f7f0ff", border: "#b795f1", accent: "#7a4bd7", text: "#39225f", doneBg: "#eadcff", doneBorder: "#986fe0", doneAccent: "#6532be", doneText: "#351c65" },
  { bg: "#fff7d9", border: "#e9c24a", accent: "#b98300", text: "#5a4108", doneBg: "#ffefad", doneBorder: "#d7a916", doneAccent: "#946500", doneText: "#553900" },
];

const weekDays = computed(() => {
  const start = parseDate(currentWeekStart.value);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date: formatDate(date),
      weekday: weekNames[date.getDay()],
      shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });
});

const weekRangeLabel = computed(() => {
  const start = parseDate(currentWeekStart.value);
  const end = addDays(start, 6);
  return `${formatSlashDate(start)}-${formatSlashDate(end)}`;
});

const scheduleItemsByDate = computed(() => {
  const grouped = Object.fromEntries(weekDays.value.map((day) => [day.date, []]));
  for (const item of props.schedules || []) {
    if (!item.planned_date || !grouped[item.planned_date]) continue;
    const range = timeRangeToGrid(item.start_time, item.end_time);
    if (!range) continue;
    grouped[item.planned_date].push({ ...item, ...range });
  }

  for (const day of weekDays.value) {
    grouped[day.date].sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
    grouped[day.date] = applyOverlapLayers(grouped[day.date]);
  }
  return grouped;
});

function categoryLabel(row) {
  return row.course_category || "未设置";
}

function eventHeading(item) {
  return `${item.student_name || "未设置学生"} | ${item.course_name || "未设置课程"} | ${item.teacher_name || "未设置老师"}`;
}

function activateEvent(id) {
  activeEventId.value = id;
}

function eventTitle(item) {
  return `${eventHeading(item)}\n${detailDateLabel(item)} ${formatTimeRange(item.start_time, item.end_time)}\n${formatHours(item.lesson_hours)}课时 · ${categoryLabel(item)} · ${item.status}`;
}

function detailDateLabel(item) {
  const weekday = item.weekday || weekdayFromDate(item.planned_date);
  return `${item.planned_date || "未设置日期"} ${weekday}`.trim();
}

function weekdayFromDate(value) {
  if (!value) return "";
  const date = parseDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return weekNames[date.getDay()];
}

function getMonday(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

function changeWeek(offset) {
  currentWeekStart.value = formatDate(addDays(parseDate(currentWeekStart.value), offset * 7));
}

function goCurrentWeek() {
  currentWeekStart.value = formatDate(getMonday(new Date()));
}

function timeRangeToGrid(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null || end <= start) return null;

  const visibleStart = Math.max(start, 8 * 60);
  const visibleEnd = Math.min(end, 20 * 60);
  const isMorning = visibleStart < 12 * 60;
  const isAfternoon = visibleEnd > 14 * 60;
  if (!isMorning && !isAfternoon) return null;
  if (visibleStart < 12 * 60 && visibleEnd > 12 * 60) return null;
  if (visibleStart < 14 * 60 && visibleEnd > 12 * 60) return null;

  return {
    startRow: minuteToGridLine(visibleStart),
    endRow: Math.max(minuteToGridLine(visibleEnd), minuteToGridLine(visibleStart) + 1),
  };
}

function minuteToGridLine(minutes) {
  if (minutes <= 12 * 60) {
    return Math.floor((minutes - 8 * 60) / 30) + 1;
  }
  return Math.floor((minutes - 14 * 60) / 30) + 10;
}

function timeToMinutes(value) {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function applyOverlapLayers(items) {
  const positioned = items.map((item, index) => {
    const previousOverlaps = items.slice(0, index).filter((other) => isTimeOverlapped(item, other));
    const totalOverlaps = items.filter((other) => isTimeOverlapped(item, other)).length;
    return {
      ...item,
      overlapIndex: previousOverlaps.length,
      overlapCount: Math.max(totalOverlaps, 1),
    };
  });
  return positioned;
}

function isTimeOverlapped(a, b) {
  return timeToMinutes(a.start_time) < timeToMinutes(b.end_time) &&
    timeToMinutes(a.end_time) > timeToMinutes(b.start_time);
}

function paletteFor(item) {
  const seed = `${item.teacher_id}-${item.student_id}-${item.course_name || ""}`;
  return eventPalettes[hashText(seed) % eventPalettes.length];
}

function hashText(value) {
  let hash = 0;
  for (const char of String(value || "")) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function addDays(date, days) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatSlashDate(date) {
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

function eventStyle(item) {
  const palette = paletteFor(item);
  const completed = item.status === "已消课";
  const active = activeEventId.value === item.id;
  const overlapIndex = Number(item.overlapIndex || 0);
  const overlapCount = Number(item.overlapCount || 1);
  const overlapStep = overlapCount > 1 ? Math.min(42, Math.max(24, 84 / overlapCount)) : 0;
  const eventWidth = overlapCount > 1 ? Math.max(58, 100 - overlapStep * (overlapCount - 1) + 12) : 100;
  const overlapOffsetX = Math.min(overlapIndex, 5) * overlapStep;
  return {
    gridRow: `${item.startRow} / ${item.endRow}`,
    gridColumn: "1 / 2",
    backgroundColor: completed ? palette.doneBg : palette.bg,
    borderColor: completed ? palette.doneBorder : palette.border,
    borderLeftColor: completed ? palette.doneAccent : palette.accent,
    boxShadow: active
      ? "0 12px 26px rgba(15, 23, 42, 0.24)"
      : `0 8px 18px ${completed ? "rgba(15, 23, 42, 0.12)" : "rgba(15, 23, 42, 0.10)"}`,
    color: completed ? palette.doneText : palette.text,
    justifySelf: "start",
    marginLeft: `${overlapOffsetX}%`,
    width: `${eventWidth}%`,
    zIndex: active ? 50 : 2 + overlapIndex,
  };
}
</script>

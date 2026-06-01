import { formatTimeRange } from "./format";

export const WEEKDAY_NAMES = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function dateKey(value) {
  return String(value || "").slice(0, 10);
}

export function parseDate(value) {
  if (value instanceof Date) return value;
  return new Date(`${dateKey(value)}T00:00:00`);
}

export function formatDate(date) {
  const value = date instanceof Date ? date : parseDate(date);
  if (Number.isNaN(value.getTime())) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatSlashDate(date) {
  const value = date instanceof Date ? date : parseDate(date);
  if (Number.isNaN(value.getTime())) return "";
  return `${value.getFullYear()}/${value.getMonth() + 1}/${value.getDate()}`;
}

export function addDays(date, days) {
  const value = date instanceof Date ? date : parseDate(date);
  const result = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

export function getMonday(date) {
  const value = date instanceof Date ? date : parseDate(date);
  const result = new Date(value.getFullYear(), value.getMonth(), value.getDate());
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

export function weekdayFromDate(date) {
  const value = date instanceof Date ? date : parseDate(date);
  if (Number.isNaN(value.getTime())) return "";
  return WEEKDAY_NAMES[value.getDay()];
}

export function weekdayFromValue(value) {
  if (!value) return "";
  return weekdayFromDate(parseDate(value));
}

export function getWeekDays(weekStart) {
  const start = parseDate(weekStart);
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return {
      date: formatDate(date),
      weekday: weekdayFromDate(date),
      shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
    };
  });
}

export function formatCourseDateText(row) {
  if (!row?.planned_date) return "日期未设置";
  const date = parseDate(row.planned_date);
  if (Number.isNaN(date.getTime())) return row.planned_date;
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdayFromDate(date)}`;
}

export function formatCourseTimeText(row) {
  return formatTimeRange(row?.start_time, row?.end_time) || "时间未设置";
}

export function formatScheduleTimeText(row) {
  const weekday = row?.weekday || weekdayFromValue(row?.planned_date) || "";
  const range = formatTimeRange(row?.start_time, row?.end_time);
  return `${weekday} ${range}`.trim();
}

export function timeToMinutes(value, fallback = 0) {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return fallback;
  return hour * 60 + minute;
}

export function scheduleTimeValue(row) {
  if (!row?.planned_date) return Number.MAX_SAFE_INTEGER;
  const date = parseDate(row.planned_date);
  if (Number.isNaN(date.getTime())) return Number.MAX_SAFE_INTEGER;
  return date.getTime() + timeToMinutes(row.start_time) * 60 * 1000;
}

export function calculateLessonHours(startTime, endTime) {
  const start = timeToMinutes(startTime, null);
  const end = timeToMinutes(endTime, null);
  if (start === null || end === null) return 1;
  const diffMinutes = end - start;
  if (diffMinutes < 30) return 0;
  return Math.round((diffMinutes / 60) * 2) / 2;
}

export function timeRangeToGrid(startTime, endTime, options = {}) {
  const startHour = options.startHour ?? 8;
  const endHour = options.endHour ?? 20;
  const stepMinutes = options.stepMinutes ?? 30;
  const start = timeToMinutes(startTime, null);
  const end = timeToMinutes(endTime, null);
  if (start === null || end === null || end <= start) return null;

  const visibleStart = Math.max(start, startHour * 60);
  const visibleEnd = Math.min(end, endHour * 60);
  if (visibleEnd <= startHour * 60 || visibleStart >= endHour * 60) return null;

  return {
    startRow: minuteToGridLine(visibleStart, startHour, stepMinutes),
    endRow: Math.max(
      minuteToGridLine(visibleEnd, startHour, stepMinutes),
      minuteToGridLine(visibleStart, startHour, stepMinutes) + 1
    ),
  };
}

export function minuteToGridLine(minutes, startHour = 8, stepMinutes = 30) {
  return Math.floor((minutes - startHour * 60) / stepMinutes) + 1;
}

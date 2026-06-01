const STATUS_PENDING = "待上课";
const STATUS_COMPLETED = "已消课";
const STATUS_MISSED = "未打卡";
const STATUS_ABNORMAL = "异常";

function resolveScheduleStatus(schedule, now = new Date()) {
  if (!schedule) return STATUS_PENDING;
  if (schedule.status === STATUS_COMPLETED || schedule.status === STATUS_ABNORMAL) return schedule.status;
  if (isCanceled(schedule.status)) return schedule.status;
  if (schedule.checked_at || schedule.record_checked_at) {
    return getCheckinStatus(
      schedule,
      schedule.checked_at || schedule.record_checked_at,
      schedule.actual_lesson_hours || schedule.lesson_hours
    ).status;
  }

  const endAt = getScheduleDateTime(schedule.planned_date, schedule.end_time);
  if (endAt && now.getTime() > endAt.getTime()) return STATUS_MISSED;
  return STATUS_PENDING;
}

function getScheduleIssueReasons(schedule, now = new Date()) {
  const status = resolveScheduleStatus(schedule, now);
  if (status === STATUS_MISSED) return ["课程结束后未打卡"];
  if (status !== STATUS_ABNORMAL) return [];

  return getCheckinStatus(
    schedule,
    schedule.checked_at || schedule.record_checked_at,
    schedule.actual_lesson_hours || schedule.lesson_hours
  ).reasons;
}

function getCheckinStatus(schedule, checkedAt, lessonHours) {
  const reasons = [];
  const checkedDate = parseDateTime(checkedAt);
  const startAt = getScheduleDateTime(schedule.planned_date, schedule.start_time);
  const plannedHours = Number(schedule.lesson_hours || 0);
  const actualHours = Number(lessonHours || 0);

  if (startAt && checkedDate && checkedDate.getTime() < startAt.getTime()) {
    reasons.push("打卡时间早于课程开始时间");
  }
  if (Number.isFinite(plannedHours) && Number.isFinite(actualHours) && Math.abs(actualHours - plannedHours) > 0.001) {
    reasons.push(actualHours < plannedHours ? "打卡课时少于安排课时" : "打卡课时多于安排课时");
  }

  return {
    status: reasons.length ? STATUS_ABNORMAL : STATUS_COMPLETED,
    reasons,
  };
}

function getScheduleDateTime(dateValue, timeValue) {
  const dateText = String(dateValue || "").slice(0, 10);
  const timeText = String(timeValue || "").slice(0, 8) || "00:00:00";
  if (!dateText) return null;

  const value = new Date(`${dateText}T${timeText}`);
  return Number.isNaN(value.getTime()) ? null : value;
}

function parseDateTime(value) {
  if (value instanceof Date) return value;
  const text = String(value || "").trim().replace(" ", "T");
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isCanceled(status) {
  return String(status || "").includes("取消");
}

module.exports = {
  STATUS_ABNORMAL,
  STATUS_COMPLETED,
  STATUS_MISSED,
  STATUS_PENDING,
  getCheckinStatus,
  getScheduleIssueReasons,
  resolveScheduleStatus,
};

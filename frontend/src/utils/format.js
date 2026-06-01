export function formatTime(value) {
  if (!value) return "";
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return text;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function formatHours(value) {
  const number = Number(value || 0);
  if (Number.isNaN(number)) return "0.0";
  return number.toFixed(1);
}

export function formatTimeRange(startTime, endTime) {
  const start = formatTime(startTime);
  const end = formatTime(endTime);
  if (!start && !end) return "";
  return `${start}-${end}`;
}

export function formatScheduleTime(row) {
  const weekday = row.weekday || "";
  const range = formatTimeRange(row.start_time, row.end_time);
  return `${weekday} ${range}`.trim();
}

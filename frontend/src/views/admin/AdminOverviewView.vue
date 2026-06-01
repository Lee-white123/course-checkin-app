<template>
  <section class="admin-overview-page">
    <div class="admin-overview-hero">
      <div>
        <span>管理员端</span>
        <h2>本周课程安排总览</h2>
        <p>汇总本周课程排课、打卡消课、科目分布与教师完成情况。</p>
      </div>
      <div class="admin-overview-week">
        <span>统计周期</span>
        <strong>{{ weekRangeLabel }}</strong>
      </div>
    </div>

    <section class="admin-overview-metrics" aria-label="核心数据">
      <article v-for="item in metrics" :key="item.label" class="admin-overview-metric">
        <div class="admin-overview-metric__icon" :class="`is-${item.tone}`">
          <img class="admin-svg-icon" :src="item.icon" alt="" aria-hidden="true" />
        </div>
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.note }}</small>
        </div>
      </article>
    </section>

    <section class="admin-overview-grid admin-overview-grid--main">
      <article class="admin-overview-panel admin-overview-panel--wide">
        <div class="admin-overview-panel__header">
          <div>
            <h3>近 7 天课程趋势</h3>
            <p>对比本周每日排课与实际消课情况。</p>
          </div>
          <div class="admin-overview-legend">
            <span><i class="legend-dot legend-dot--scheduled"></i>排课数</span>
            <span><i class="legend-dot legend-dot--completed"></i>已消课</span>
          </div>
        </div>

        <div class="admin-trend-chart" aria-label="近 7 天排课与已消课趋势">
          <div class="admin-trend-plot">
            <div class="admin-trend-axis" aria-hidden="true">
              <span v-for="tick in trendTicks" :key="tick">{{ tick }}</span>
            </div>
            <div class="admin-trend-body">
              <div class="admin-trend-grid-lines" aria-hidden="true">
                <span v-for="tick in trendTicks" :key="`line-${tick}`"></span>
              </div>
              <div
                v-for="day in dailyTrend"
                :key="day.date"
                class="admin-trend-day"
                tabindex="0"
                :aria-label="`${day.weekday} ${day.shortDate}，排课 ${day.scheduled} 节，已消课 ${day.completed} 节`"
              >
                <div class="admin-trend-bars">
                  <i
                    class="admin-trend-bar admin-trend-bar--scheduled"
                    :style="{ height: `${day.scheduledHeight}%` }"
                  ></i>
                  <i
                    class="admin-trend-bar admin-trend-bar--completed"
                    :style="{ height: `${day.completedHeight}%` }"
                  ></i>
                </div>
                <div class="admin-trend-tooltip" role="tooltip">
                  <strong>{{ day.weekday }} {{ day.shortDate }}</strong>
                  <span><i class="legend-dot legend-dot--scheduled"></i>排课数 {{ day.scheduled }} 节</span>
                  <span><i class="legend-dot legend-dot--completed"></i>已消课 {{ day.completed }} 节</span>
                </div>
                <strong>{{ day.weekday }}</strong>
                <small>{{ day.shortDate }}</small>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article class="admin-overview-panel">
        <div class="admin-overview-panel__header">
          <div>
            <h3>本周课程打卡分析</h3>
            <p>统计本周课程完成情况，并按已打卡科目拆分。</p>
          </div>
        </div>

        <div class="admin-donut-wrap">
          <div class="admin-donut" aria-label="本周课程打卡分析">
            <svg class="admin-donut-svg" viewBox="0 0 100 100" role="img" aria-hidden="true">
              <g class="admin-donut-segments">
                <path
                  v-for="item in donutSegments"
                  :key="item.key"
                  class="admin-donut-segment"
                  :d="item.path"
                  :stroke="item.color"
                  :fill="item.color"
                />
              </g>
              <g class="admin-subject-donut-segments">
                <path
                  v-for="item in subjectDonutSegments"
                  :key="item.key"
                  class="admin-subject-donut-segment"
                  :d="item.path"
                  :stroke="item.color"
                  :fill="item.color"
                />
              </g>
            </svg>
            <div class="admin-donut-center">
              <strong>{{ weekSchedules.length }}</strong>
              <span>本周课程</span>
            </div>
          </div>

          <div class="admin-donut-list">
            <div v-for="item in statusBreakdown" :key="item.label">
              <span><i :style="{ backgroundColor: item.color }"></i>{{ item.label }}</span>
              <strong>{{ item.count }} 节</strong>
              <small>{{ item.percent }}%</small>
            </div>
          </div>
        </div>

        <div class="admin-subject-breakdown">
          <h4>已打卡课程科目分布</h4>
          <div v-if="subjectBreakdown.length" class="admin-subject-list">
            <div v-for="item in subjectBreakdown" :key="item.label" class="admin-subject-row">
              <span><i :style="{ backgroundColor: item.color }"></i>{{ item.label }}</span>
              <strong>{{ item.count }} 节</strong>
              <small>{{ item.percent }}%</small>
            </div>
          </div>
          <div v-else class="admin-overview-empty">本周暂无已打卡课程</div>
        </div>
      </article>
    </section>

    <section class="admin-overview-grid">
      <article class="admin-overview-panel admin-overview-panel--wide">
        <div class="admin-overview-panel__header">
          <div>
            <h3>本周教师打卡情况</h3>
            <p>按教师统计本周已消课与排课完成度。</p>
          </div>
          <button v-if="teacherRows.length > visibleTeacherRows.length" class="admin-text-button" type="button">查看全部</button>
        </div>

        <div v-if="visibleTeacherRows.length" class="admin-teacher-bars">
          <div v-for="item in visibleTeacherRows" :key="item.id" class="admin-teacher-row">
            <div class="admin-teacher-row__title">
              <strong>{{ item.name }}</strong>
              <span>{{ item.completed }} / {{ item.total }} 节</span>
            </div>
            <div class="admin-teacher-row__bar">
              <i :class="item.tone" :style="{ width: `${item.percent}%` }"></i>
            </div>
            <small>{{ item.percent }}%</small>
          </div>
        </div>
        <div v-else class="admin-overview-empty">本周暂无教师排课</div>
      </article>

      <article class="admin-overview-panel">
        <div class="admin-overview-panel__header">
          <div>
            <h3>待处理事项</h3>
            <p>聚合本周需要管理员关注的课程与账号事项。</p>
          </div>
        </div>

        <div class="admin-action-list">
          <div v-for="item in actionItems" :key="item.title" class="admin-action-item">
            <span class="admin-action-item__icon" :class="`is-${item.tone}`">
              <el-icon v-if="item.iconComponent"><component :is="item.iconComponent" /></el-icon>
              <img v-else class="admin-svg-icon" :src="item.icon" alt="" aria-hidden="true" />
            </span>
            <div>
              <strong>{{ item.title }}</strong>
              <small>{{ item.description }}</small>
            </div>
            <button type="button" @click="goAction(item)">查看</button>
          </div>
        </div>
      </article>
    </section>

    <article class="admin-overview-panel admin-completion-panel">
      <div class="admin-overview-panel__header">
        <div>
          <h3>本周课程完成度</h3>
          <p>已消课 {{ completedWeekCount }} / 本周课程 {{ weekSchedules.length }}，完成率 {{ completionPercent }}%。</p>
        </div>
        <strong>{{ completionPercent }}%</strong>
      </div>

      <div class="admin-segment-progress" aria-label="本周课程完成度">
        <i class="segment-completed" :style="{ width: `${completedSegment}%` }"></i>
        <i class="segment-pending" :style="{ width: `${pendingSegment}%` }"></i>
        <i class="segment-issue" :style="{ width: `${issueSegment}%` }"></i>
      </div>

      <div class="admin-status-chips">
        <span><i class="chip-completed"></i>已消课 {{ completedWeekCount }} 节</span>
        <span><i class="chip-pending"></i>待上课 {{ pendingWeekCount }} 节</span>
        <span><i class="chip-issue"></i>异常 / 未打卡 {{ issueWeekCount }} 节</span>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Finished } from "@element-plus/icons-vue";
import administratorIcon from "../../assets/dashboard-icons/administrator.svg";
import courseTableIcon from "../../assets/dashboard-icons/课程表.svg";
import pendingCourseIcon from "../../assets/dashboard-icons/待上课.svg";
import completedIcon from "../../assets/dashboard-icons/已上课.svg";
import issueIcon from "../../assets/dashboard-icons/异常信息.svg";
import qualificationIcon from "../../assets/dashboard-icons/授课资格.svg";
import missedCheckinIcon from "../../assets/dashboard-icons/未打卡.svg";
import teacherScheduleIcon from "../../assets/dashboard-icons/老师排课信息.svg";
import studentIcon from "../../assets/dashboard-icons/student.svg";
import teacherIcon from "../../assets/dashboard-icons/teacher.svg";
import { addDays, dateKey, formatDate, formatSlashDate, getMonday, getWeekDays, parseDate } from "../../utils/schedule-time";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const router = useRouter();
const STATUS_COMPLETED = "已消课";
const STATUS_PENDING = "待上课";
const STATUS_MISSED = "未打卡";
const STATUS_ABNORMAL = "异常";
const STATUS_CANCELED = "已取消";
const statusColors = {
  completed: "#6FD49A",
  pending: "#FFD56A",
  issue: "#E88732",
  abnormal: "#E85D6A",
  canceled: "#d7dde8",
};
const subjectColors = ["#7EA6F5", "#FF9EB5", "#FFB75E", "#B39AF2", "#6ECFE0", "#D596E8"];
const DONUT_CENTER = 50;
const DONUT_OUTER_RADIUS = 43;
const DONUT_INNER_RADIUS = 29;
const SUBJECT_DONUT_OUTER_RADIUS = 39;
const SUBJECT_DONUT_INNER_RADIUS = 33;
const DONUT_GAP_DEGREES = 15;
const SUBJECT_DONUT_GAP_DEGREES = 5;

const pointOnDonut = (radius, angle) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: DONUT_CENTER + radius * Math.cos(radians),
    y: DONUT_CENTER + radius * Math.sin(radians),
  };
};

const donutSegmentPath = (startAngle, endAngle, outerRadius = DONUT_OUTER_RADIUS, innerRadius = DONUT_INNER_RADIUS) => {
  const outerStart = pointOnDonut(outerRadius, startAngle);
  const outerEnd = pointOnDonut(outerRadius, endAngle);
  const innerEnd = pointOnDonut(innerRadius, endAngle);
  const innerStart = pointOnDonut(innerRadius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x.toFixed(3)} ${outerStart.y.toFixed(3)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x.toFixed(3)} ${outerEnd.y.toFixed(3)}`,
    `L ${innerEnd.x.toFixed(3)} ${innerEnd.y.toFixed(3)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x.toFixed(3)} ${innerStart.y.toFixed(3)}`,
    "Z",
  ].join(" ");
};

const weekStart = computed(() => formatDate(getMonday(new Date())));
const weekDays = computed(() => getWeekDays(weekStart.value));
const weekRangeLabel = computed(() => {
  const start = parseDate(weekStart.value);
  const end = addDays(start, 6);
  return `${formatSlashDate(start)}-${formatSlashDate(end)}`;
});

const weekDateSet = computed(() => new Set(weekDays.value.map((day) => day.date)));
const normalizedSchedules = computed(() =>
  (props.state.schedules || []).map((item) => ({
    ...item,
    planned_date: dateKey(item.planned_date),
  }))
);
const weekSchedules = computed(() => normalizedSchedules.value.filter((item) => item.planned_date && weekDateSet.value.has(item.planned_date)));
const completedWeekSchedules = computed(() => weekSchedules.value.filter(isCompleted));
const canceledWeekCount = computed(() => weekSchedules.value.filter(isCanceled).length);
const missedWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === STATUS_MISSED).length);
const abnormalWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === STATUS_ABNORMAL).length);
const issueWeekCount = computed(() => missedWeekCount.value + abnormalWeekCount.value);
const pendingWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === STATUS_PENDING).length);
const completedWeekCount = computed(() => completedWeekSchedules.value.length);
const scheduledTeacherCount = computed(() => new Set(weekSchedules.value.map((item) => Number(item.teacher_id)).filter(Boolean)).size);
const completionPercent = computed(() => percent(completedWeekCount.value, weekSchedules.value.length));

const metrics = computed(() => [
  {
    label: "管理员数",
    value: props.state.summary?.admin_count || (props.state.admins || []).length || 0,
    note: "当前可管理账号",
    icon: administratorIcon,
    tone: "blue",
  },
  {
    label: "教师数",
    value: props.state.summary?.teacher_count || (props.state.teachers || []).length || 0,
    note: "本周有排课教师",
    icon: teacherIcon,
    tone: "green",
  },
  {
    label: "学生数",
    value: props.state.summary?.student_count || (props.state.students || []).length || 0,
    note: "当前在读学生",
    icon: studentIcon,
    tone: "purple",
  },
  {
    label: "本周课程数",
    value: weekSchedules.value.length,
    note: "本周全部已排课程",
    icon: courseTableIcon,
    tone: "amber",
  },
  {
    label: "本周待上课",
    value: pendingWeekCount.value,
    note: "尚未完成的课程",
    icon: pendingCourseIcon,
    tone: "cyan",
  },
  {
    label: "本周已消课",
    value: completedWeekCount.value,
    note: "已完成打卡消课",
    icon: completedIcon,
    tone: "rose",
  },
]);

const dailyTrend = computed(() => {
  return weekDays.value.map((day) => {
    const items = weekSchedules.value.filter((item) => item.planned_date === day.date);
    const completed = items.filter(isCompleted).length;
    return {
      ...day,
      scheduled: items.length,
      completed,
      scheduledHeight: barHeight(items.length),
      completedHeight: barHeight(completed),
    };
  });
});

const trendAxisMax = computed(() => {
  const maxValue = Math.max(
    1,
    ...weekDays.value.flatMap((day) => {
      const items = weekSchedules.value.filter((item) => item.planned_date === day.date);
      return [items.length, items.filter(isCompleted).length];
    })
  );

  if (maxValue <= 4) return 4;
  if (maxValue <= 8) return 8;
  if (maxValue <= 10) return 10;
  return Math.ceil(maxValue / 5) * 5;
});

const trendTicks = computed(() => {
  const maxValue = trendAxisMax.value;
  return [maxValue, Math.round(maxValue * 0.75), Math.round(maxValue * 0.5), Math.round(maxValue * 0.25), 0];
});

const statusBreakdown = computed(() => {
  const total = weekSchedules.value.length;
  return [
    { key: "completed", label: "已消课", count: completedWeekCount.value, color: statusColors.completed },
    { key: "pending", label: "待上课", count: pendingWeekCount.value, color: statusColors.pending },
    { key: "missed", label: "未打卡", count: missedWeekCount.value, color: statusColors.issue },
    { key: "abnormal", label: "异常", count: abnormalWeekCount.value, color: statusColors.abnormal },
    { key: "canceled", label: "已取消", count: canceledWeekCount.value, color: statusColors.canceled },
  ]
    .filter((item) => item.count > 0 || item.key !== "canceled")
    .map((item) => ({ ...item, percent: percent(item.count, total) }));
});

const donutSegments = computed(() => {
  const visibleItems = statusBreakdown.value.filter((item) => item.count > 0);
  const total = visibleItems.reduce((sum, item) => sum + Number(item.count || 0), 0);
  if (!total) return [];

  const gap = visibleItems.length > 1 ? DONUT_GAP_DEGREES : 0;
  const drawableLength = Math.max(0, 360 - gap * visibleItems.length);
  let cursor = 0;

  return visibleItems.map((item, index) => {
    const length = index === visibleItems.length - 1
      ? Math.max(0, 360 - cursor - gap)
      : Math.max(4, (Number(item.count || 0) / total) * drawableLength);
    const startAngle = cursor;
    const endAngle = cursor + length;
    const segment = {
      ...item,
      length,
      startAngle,
      endAngle,
      path: donutSegmentPath(startAngle, endAngle),
    };
    cursor += length + gap;
    return segment;
  });
});

const subjectDonutSegments = computed(() => {
  const completedSegment = donutSegments.value.find((item) => item.key === "completed");
  const visibleItems = subjectBreakdown.value.filter((item) => item.count > 0);
  const total = visibleItems.reduce((sum, item) => sum + Number(item.count || 0), 0);
  if (!completedSegment || !total) return [];

  const segmentLength = Math.max(0, completedSegment.endAngle - completedSegment.startAngle);
  const gap = visibleItems.length > 1 ? Math.min(SUBJECT_DONUT_GAP_DEGREES, segmentLength / (visibleItems.length * 2)) : 0;
  const drawableLength = Math.max(0, segmentLength - gap * visibleItems.length);
  let cursor = completedSegment.startAngle;

  return visibleItems.map((item, index) => {
    const length = index === visibleItems.length - 1
      ? Math.max(0, completedSegment.endAngle - cursor - gap)
      : Math.max(2.5, (Number(item.count || 0) / total) * drawableLength);
    const startAngle = cursor;
    const endAngle = cursor + length;
    const segment = {
      ...item,
      key: `subject-${item.label}`,
      length,
      path: donutSegmentPath(startAngle, endAngle, SUBJECT_DONUT_OUTER_RADIUS, SUBJECT_DONUT_INNER_RADIUS),
    };
    cursor += length + gap;
    return segment;
  });
});

const subjectBreakdown = computed(() => {
  const grouped = new Map();
  for (const item of completedWeekSchedules.value) {
    const label = item.course_name || "未设置科目";
    grouped.set(label, (grouped.get(label) || 0) + 1);
  }
  const total = completedWeekSchedules.value.length;
  return [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], index) => ({
      label,
      count,
      percent: percent(count, total),
      color: subjectColors[index % subjectColors.length],
    }));
});

const teacherRows = computed(() => {
  return (props.state.teachers || [])
    .map((teacher) => {
      const items = weekSchedules.value.filter((item) => Number(item.teacher_id) === Number(teacher.id));
      const completed = items.filter(isCompleted).length;
      const rowPercent = percent(completed, items.length);
      return {
        id: teacher.id,
        name: teacher.name || teacher.username || "未命名教师",
        total: items.length,
        completed,
        percent: rowPercent,
        tone: rowPercent >= 80 ? "is-good" : rowPercent >= 50 ? "is-mid" : "is-low",
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => b.completed - a.completed || b.percent - a.percent);
});
const visibleTeacherRows = computed(() => teacherRows.value.slice(0, 8));

const accountReviewCount = computed(
  () =>
    countPending(props.state.teacherAccounts) +
    countPending(props.state.parentAccounts) +
    countPending(props.state.admins)
);
const teacherAssignmentCount = computed(() =>
  (props.state.teachers || []).filter((teacher) => !String(teacher.subject || teacher.subjects || "").trim()).length
);

const actionItems = computed(() => [
  {
    iconComponent: Finished,
    tone: "blue",
    title: "账号审核",
    description: `${accountReviewCount.value} 个账号等待审核`,
    route: { name: "admin-review" },
  },
  {
    icon: qualificationIcon,
    tone: "amber",
    title: "老师授课分配",
    description: `${teacherAssignmentCount.value} 位老师待任命授课科目`,
    route: { name: "admin-review", query: { section: "subjects" } },
  },
  {
    icon: missedCheckinIcon,
    tone: "purple",
    title: "本周未完成打卡",
    description: `本周还有 ${missedWeekCount.value} 节课程待完成`,
    route: { name: "admin-schedule", query: { status: STATUS_MISSED } },
  },
  {
    icon: teacherScheduleIcon,
    tone: "green",
    title: "本周老师排课",
    description: `${scheduledTeacherCount.value} 位教师本周已有排课`,
    route: { name: "admin-coursetable" },
  },
  {
    icon: issueIcon,
    tone: "rose",
    title: "异常信息",
    description: `${abnormalWeekCount.value} 节异常打卡需要处理`,
    route: { name: "admin-schedule", query: { status: STATUS_ABNORMAL } },
  },
]);

const completedSegment = computed(() => percent(completedWeekCount.value, weekSchedules.value.length));
const pendingSegment = computed(() => percent(pendingWeekCount.value, weekSchedules.value.length));
const issueSegment = computed(() => percent(issueWeekCount.value, weekSchedules.value.length));

function isCompleted(item) {
  return item?.status === STATUS_COMPLETED;
}

function isCanceled(item) {
  return String(item?.status || "").includes(STATUS_CANCELED) || String(item?.status || "").includes("取消");
}

function isIssue(item) {
  return item?.status === STATUS_MISSED || item?.status === STATUS_ABNORMAL;
}

function goAction(item) {
  if (item?.route) router.push(item.route);
}

function countPending(items = []) {
  return (items || []).filter((item) => item.status === "待审核" || item.profile_status === "待审核" || item.teacher_status === "待审核").length;
}

function percent(value, total) {
  const numericTotal = Number(total || 0);
  if (!numericTotal) return 0;
  return Math.min(100, Math.round((Number(value || 0) / numericTotal) * 100));
}

function barHeight(value) {
  const numericValue = Number(value || 0);
  if (!numericValue) return 0;
  return Math.max(6, Math.round((numericValue / trendAxisMax.value) * 100));
}
</script>

<style scoped>
.admin-overview-page {
  display: grid;
  gap: 20px;
}

.admin-overview-hero,
.admin-overview-panel,
.admin-overview-metric {
  -webkit-backdrop-filter: blur(22px) saturate(1.35);
  backdrop-filter: blur(22px) saturate(1.35);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(255, 255, 255, 0.42));
  border: 1px solid rgba(255, 255, 255, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.62),
    0 8px 24px rgba(20, 42, 75, 0.045);
}

.admin-overview-hero {
  align-items: center;
  border-radius: 18px;
  display: flex;
  justify-content: space-between;
  padding: 26px 28px;
}

.admin-overview-hero span,
.admin-overview-panel__header p,
.admin-overview-metric span,
.admin-overview-metric small,
.admin-overview-week span,
.admin-action-item small,
.admin-teacher-row small,
.admin-subject-row small,
.admin-donut-list small {
  color: #61708a;
}

.admin-overview-hero > div:first-child > span {
  color: var(--role-accent);
  font-size: 13px;
  font-weight: 800;
}

.admin-overview-hero h2 {
  color: #111827;
  font-size: 28px;
  line-height: 1.25;
  margin: 8px 0 8px;
}

.admin-overview-hero p {
  color: #526078;
  line-height: 1.6;
  margin: 0;
}

.admin-overview-week {
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(90, 122, 170, 0.12);
  border-radius: 16px;
  display: grid;
  gap: 4px;
  min-width: 168px;
  padding: 14px 16px;
  text-align: right;
}

.admin-overview-week strong {
  color: #172033;
  font-size: 16px;
}

.admin-overview-metrics {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.admin-overview-metric {
  align-items: center;
  border-radius: 18px;
  display: flex;
  gap: 16px;
  min-height: 118px;
  padding: 20px 22px;
}

.admin-overview-metric__icon,
.admin-action-item__icon {
  align-items: center;
  background: var(--icon-bg, rgba(236, 246, 255, 0.72));
  border: 1px solid var(--icon-line, rgba(92, 145, 220, 0.18));
  border-radius: 16px;
  color: var(--icon-color, var(--role-accent));
  display: inline-flex;
  flex: 0 0 52px;
  height: 52px;
  justify-content: center;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.70),
    0 8px 18px var(--icon-shadow, rgba(92, 145, 220, 0.08));
  width: 52px;
}

.admin-action-item__icon {
  border-radius: 15px;
  flex-basis: 44px;
  height: 44px;
  width: 44px;
}

.admin-svg-icon {
  display: block;
  height: 32px;
  object-fit: contain;
  width: 32px;
}

.admin-action-item__icon .admin-svg-icon {
  height: 27px;
  width: 27px;
}

.admin-action-item__icon .el-icon {
  font-size: 24px;
  stroke-width: 1.5;
}

.admin-overview-metric__icon.is-blue,
.admin-action-item__icon.is-blue {
  --icon-bg: rgba(232, 243, 255, 0.76);
  --icon-line: rgba(92, 145, 220, 0.22);
  --icon-color: #2f6ff7;
  --icon-shadow: rgba(47, 111, 247, 0.10);
}

.admin-overview-metric__icon.is-green,
.admin-action-item__icon.is-green {
  --icon-bg: rgba(232, 248, 239, 0.78);
  --icon-line: rgba(79, 178, 116, 0.20);
  --icon-color: #16945a;
  --icon-shadow: rgba(22, 148, 90, 0.10);
}

.admin-overview-metric__icon.is-purple,
.admin-action-item__icon.is-purple {
  --icon-bg: rgba(241, 235, 255, 0.78);
  --icon-line: rgba(137, 104, 220, 0.20);
  --icon-color: #6b4fd8;
  --icon-shadow: rgba(107, 79, 216, 0.10);
}

.admin-overview-metric__icon.is-amber,
.admin-action-item__icon.is-amber {
  --icon-bg: rgba(255, 246, 225, 0.82);
  --icon-line: rgba(218, 154, 45, 0.22);
  --icon-color: #c77808;
  --icon-shadow: rgba(199, 120, 8, 0.10);
}

.admin-overview-metric__icon.is-cyan,
.admin-action-item__icon.is-cyan {
  --icon-bg: rgba(226, 248, 250, 0.80);
  --icon-line: rgba(67, 166, 177, 0.20);
  --icon-color: #168996;
  --icon-shadow: rgba(22, 137, 150, 0.10);
}

.admin-overview-metric__icon.is-rose,
.admin-action-item__icon.is-rose {
  --icon-bg: rgba(255, 235, 241, 0.80);
  --icon-line: rgba(219, 95, 126, 0.20);
  --icon-color: #d64d77;
  --icon-shadow: rgba(214, 77, 119, 0.10);
}

.admin-overview-metric div:last-child {
  display: grid;
  gap: 4px;
}

.admin-overview-metric span {
  font-size: 14px;
  font-weight: 700;
}

.admin-overview-metric strong {
  color: #111827;
  font-size: 34px;
  line-height: 1;
}

.admin-overview-metric small {
  font-size: 13px;
}

.admin-overview-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
}

.admin-overview-panel {
  border-radius: 18px;
  min-width: 0;
  padding: 22px;
}

.admin-overview-panel__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 20px;
}

.admin-overview-panel__header h3 {
  color: #111827;
  font-size: 18px;
  line-height: 1.3;
  margin: 0 0 6px;
}

.admin-overview-panel__header p {
  font-size: 13px;
  line-height: 1.5;
  margin: 0;
}

.admin-overview-legend {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.admin-overview-legend span {
  align-items: center;
  color: #526078;
  display: inline-flex;
  font-size: 13px;
  gap: 6px;
  white-space: nowrap;
}

.legend-dot,
.admin-subject-row i,
.admin-donut-list i,
.admin-status-chips i {
  border-radius: 999px;
  display: inline-block;
  height: 9px;
  width: 9px;
}

.legend-dot--scheduled {
  background: #7cb7ff;
}

.legend-dot--completed {
  background: #6fd49a;
}

.admin-trend-chart {
  min-height: 260px;
  padding: 8px 0 0;
}

.admin-trend-plot {
  display: grid;
  gap: 12px;
  grid-template-columns: 34px minmax(0, 1fr);
}

.admin-trend-axis {
  color: #718098;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  font-weight: 700;
  height: 210px;
  justify-content: space-between;
  line-height: 1;
  padding: 2px 0;
  text-align: right;
}

.admin-trend-body {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(7, minmax(44px, 1fr));
  min-width: 0;
  position: relative;
}

.admin-trend-grid-lines {
  display: flex;
  flex-direction: column;
  height: 210px;
  inset: 0 0 auto;
  justify-content: space-between;
  pointer-events: none;
  position: absolute;
  z-index: 0;
}

.admin-trend-grid-lines span {
  border-top: 1px solid rgba(90, 122, 170, 0.10);
  display: block;
  width: 100%;
}

.admin-trend-day {
  border-radius: 14px;
  display: grid;
  gap: 9px;
  grid-template-rows: 210px auto auto;
  justify-items: center;
  min-width: 0;
  outline: none;
  position: relative;
  z-index: 1;
}

.admin-trend-bars {
  align-items: end;
  border-radius: 14px;
  display: flex;
  gap: 7px;
  height: 210px;
  justify-content: center;
  padding: 8px 8px 0;
  position: relative;
  width: 100%;
}

.admin-trend-bar {
  border-radius: 999px 999px 6px 6px;
  min-height: 0;
  transition:
    height 180ms ease,
    opacity 160ms ease,
    transform 160ms ease;
  width: 14px;
}

.admin-trend-bar--scheduled {
  background: linear-gradient(180deg, rgba(124, 183, 255, 0.92), rgba(124, 183, 255, 0.46));
}

.admin-trend-bar--completed {
  background: linear-gradient(180deg, rgba(111, 212, 154, 0.92), rgba(111, 212, 154, 0.46));
}

.admin-trend-day:hover .admin-trend-bar,
.admin-trend-day:focus-visible .admin-trend-bar {
  opacity: 0.95;
  transform: translateY(-2px);
}

.admin-trend-tooltip {
  -webkit-backdrop-filter: blur(18px) saturate(1.25);
  backdrop-filter: blur(18px) saturate(1.25);
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(90, 122, 170, 0.14);
  border-radius: 14px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 14px 32px rgba(20, 42, 75, 0.12);
  display: grid;
  gap: 8px;
  left: 50%;
  min-width: 142px;
  opacity: 0;
  padding: 10px 12px;
  pointer-events: none;
  position: absolute;
  top: 18px;
  transform: translate(-50%, -10px);
  transition:
    opacity 160ms ease,
    transform 160ms ease;
  z-index: 5;
}

.admin-trend-tooltip strong {
  color: #172033;
  font-size: 13px;
}

.admin-trend-tooltip span {
  align-items: center;
  color: #526078;
  display: inline-flex;
  font-size: 12px;
  gap: 7px;
  white-space: nowrap;
}

.admin-trend-day:hover .admin-trend-tooltip,
.admin-trend-day:focus-visible .admin-trend-tooltip {
  opacity: 1;
  transform: translate(-50%, -18px);
}

.admin-trend-day strong {
  color: #172033;
  font-size: 13px;
}

.admin-trend-day small {
  color: #61708a;
  font-size: 12px;
}

.admin-donut-wrap {
  align-items: center;
  display: grid;
  gap: 18px;
  grid-template-columns: 176px minmax(0, 1fr);
}

.admin-donut {
  align-items: center;
  background: #ffffff;
  border-radius: 999px;
  box-shadow: 0 14px 30px rgba(104, 120, 150, 0.10);
  display: flex;
  height: 176px;
  justify-content: center;
  position: relative;
  width: 176px;
}

.admin-donut-svg {
  height: 100%;
  inset: 0;
  overflow: visible;
  position: absolute;
  width: 100%;
}

.admin-donut-segment {
  filter: drop-shadow(0 6px 10px rgba(96, 111, 135, 0.08));
  opacity: 0.98;
  stroke-linejoin: round;
  stroke-width: 5;
  transform-origin: 50% 50%;
  transition:
    d 220ms ease,
    opacity 160ms ease;
}

.admin-subject-donut-segment {
  filter:
    drop-shadow(0 2px 5px rgba(35, 48, 70, 0.10))
    drop-shadow(0 0 0 rgba(255, 255, 255, 0.01));
  opacity: 0.96;
  stroke: rgba(255, 255, 255, 0.72);
  stroke-linejoin: round;
  stroke-width: 1.4;
  transform-origin: 50% 50%;
}

.admin-donut::before {
  background: #ffffff;
  border-radius: inherit;
  content: "";
  inset: 48px;
  position: absolute;
  z-index: 1;
}

.admin-donut-center {
  display: grid;
  gap: 4px;
  position: relative;
  text-align: center;
  z-index: 2;
}

.admin-donut strong {
  color: #111827;
  font-size: 34px;
  line-height: 1;
}

.admin-donut span {
  color: #61708a;
  font-size: 13px;
}

.admin-donut-list,
.admin-subject-list,
.admin-action-list,
.admin-teacher-bars {
  display: grid;
  gap: 10px;
}

.admin-subject-list {
  column-gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  row-gap: 10px;
}

.admin-donut-list div,
.admin-subject-row {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto auto;
}

.admin-donut-list span,
.admin-subject-row span {
  align-items: center;
  color: #344054;
  display: inline-flex;
  font-size: 13px;
  gap: 8px;
  min-width: 0;
}

.admin-donut-list strong,
.admin-subject-row strong {
  color: #172033;
  font-size: 13px;
}

.admin-subject-breakdown {
  border-top: 1px solid rgba(90, 122, 170, 0.10);
  margin-top: 20px;
  padding-top: 18px;
}

.admin-subject-breakdown h4 {
  color: #172033;
  font-size: 14px;
  margin: 0 0 12px;
}

.admin-teacher-row {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(140px, 0.52fr) minmax(160px, 1fr) 46px;
}

.admin-teacher-row__title {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  min-width: 0;
}

.admin-teacher-row__title strong {
  color: #172033;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-teacher-row__title span {
  color: #61708a;
  flex: 0 0 auto;
  font-size: 13px;
}

.admin-teacher-row__bar {
  background: rgba(148, 163, 184, 0.16);
  border-radius: 999px;
  height: 12px;
  overflow: hidden;
}

.admin-teacher-row__bar i {
  border-radius: inherit;
  display: block;
  height: 100%;
  min-width: 4px;
}

.admin-teacher-row__bar i.is-good {
  background: #6fd49a;
}

.admin-teacher-row__bar i.is-mid {
  background: #ffd56a;
}

.admin-teacher-row__bar i.is-low {
  background: #8db7e8;
}

.admin-action-item {
  align-items: center;
  border-radius: 14px;
  display: grid;
  gap: 12px;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  padding: 10px 8px;
  transition: background 160ms ease;
}

.admin-action-item:hover {
  background: rgba(255, 255, 255, 0.48);
}

.admin-action-item div {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.admin-action-item strong {
  color: #172033;
  font-size: 14px;
}

.admin-action-item button,
.admin-text-button {
  background: rgba(255, 255, 255, 0.56);
  border: 1px solid rgba(90, 122, 170, 0.12);
  border-radius: 999px;
  color: var(--role-accent);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  padding: 6px 10px;
}

.admin-completion-panel {
  display: grid;
  gap: 14px;
}

.admin-completion-panel .admin-overview-panel__header {
  margin-bottom: 0;
}

.admin-completion-panel .admin-overview-panel__header > strong {
  color: #111827;
  font-size: 28px;
}

.admin-segment-progress {
  background: rgba(148, 163, 184, 0.14);
  border-radius: 999px;
  display: flex;
  height: 14px;
  overflow: hidden;
}

.admin-segment-progress i {
  display: block;
  min-width: 0;
}

.segment-completed,
.chip-completed {
  background: #6fd49a;
}

.segment-pending,
.chip-pending {
  background: #ffd56a;
}

.segment-issue,
.chip-issue {
  background: #e88732;
}

.admin-status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.admin-status-chips span {
  align-items: center;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(90, 122, 170, 0.10);
  border-radius: 999px;
  color: #526078;
  display: inline-flex;
  font-size: 13px;
  gap: 7px;
  padding: 7px 10px;
}

.admin-overview-empty {
  align-items: center;
  background: rgba(255, 255, 255, 0.38);
  border: 1px dashed rgba(90, 122, 170, 0.18);
  border-radius: 14px;
  color: #79869c;
  display: flex;
  justify-content: center;
  min-height: 72px;
  padding: 16px;
}

@media (max-width: 1200px) {
  .admin-overview-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .admin-overview-hero {
    align-items: stretch;
    display: grid;
  }

  .admin-overview-week {
    text-align: left;
  }

  .admin-overview-metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .admin-donut-wrap {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .admin-subject-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .admin-overview-metrics {
    grid-template-columns: 1fr;
  }

  .admin-overview-hero,
  .admin-overview-panel,
  .admin-overview-metric {
    padding: 18px;
  }

  .admin-trend-chart {
    overflow-x: auto;
  }

  .admin-trend-plot {
    min-width: 560px;
  }

  .admin-trend-body {
    gap: 8px;
  }

  .admin-trend-day {
    min-width: 58px;
  }

  .admin-teacher-row {
    grid-template-columns: 1fr;
  }

  .admin-subject-list {
    grid-template-columns: 1fr;
  }

  .admin-action-item {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .admin-action-item button {
    grid-column: 2;
    justify-self: start;
  }
}
</style>

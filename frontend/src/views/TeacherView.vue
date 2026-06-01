<template>
  <section v-if="!isTeacherApproved" class="teacher-page">
    <div class="teacher-hero">
      <div>
        <span class="teacher-kicker">老师端</span>
        <h2>{{ displayName }}，账号正在等待审核</h2>
        <p>管理员审核通过并任命教学科目后，你就可以查看课程表并进行打卡消课。</p>
      </div>
      <el-tag type="warning" size="large">{{ teacherStatus }}</el-tag>
    </div>

    <el-card shadow="never">
      <template #header>
        <strong>账户信息</strong>
      </template>
      <div class="profile-grid">
        <div class="profile-field">
          <span>登录账号</span>
          <strong>{{ teacherAccount?.username || auth?.user?.username || "未绑定" }}</strong>
        </div>
        <div class="profile-field">
          <span>老师姓名</span>
          <strong>{{ displayName }}</strong>
        </div>
        <div class="profile-field">
          <span>手机号</span>
          <strong>{{ teacherPhone }}</strong>
        </div>
        <div class="profile-field">
          <span>账号状态</span>
          <strong>{{ teacherStatus }}</strong>
        </div>
        <div class="profile-field">
          <span>教学科目</span>
          <strong>{{ teacherSubjects }}</strong>
        </div>
      </div>
    </el-card>
  </section>

  <section v-else class="teacher-page">
    <div class="teacher-hero">
      <div>
        <span class="teacher-kicker">老师端</span>
        <h2>{{ displayName }}的消课工作台</h2>
        <p>优先处理今天和本周待上课程，授课完成后在课程卡片中打卡消课。</p>
      </div>
      <div class="teacher-hero-meta">
        <span>本周课程</span>
        <strong>{{ weekSchedules.length }}</strong>
        <small>{{ teacherSubjects }}</small>
      </div>
    </div>

    <div class="teacher-summary-grid">
        <article class="next-teacher-card">
          <span class="summary-label">下一节课</span>
          <template v-if="nextLesson">
            <h3>{{ nextLesson.student_name }} · {{ nextLesson.course_name }}</h3>
            <div class="lesson-main-line">{{ nextLesson.student_grade || "年级未设置" }} · {{ categoryLabel(nextLesson) }}</div>
            <div class="lesson-time-line">{{ dateText(nextLesson) }} {{ timeRangeText(nextLesson) }}</div>
            <el-button type="primary" :disabled="nextLesson.status === '已消课'" @click="openCheckin(nextLesson)">
              打卡消课
            </el-button>
          </template>
          <template v-else>
            <h3>暂无待消课程</h3>
            <div class="lesson-main-line">本周没有待上课程，辛苦啦。</div>
          </template>
        </article>

        <article class="teacher-metric-card">
          <span class="summary-label">今日待上</span>
          <strong>{{ todayPendingCount }}</strong>
          <small>节课程</small>
        </article>
        <article class="teacher-metric-card">
          <span class="summary-label">本周已消</span>
          <strong>{{ completedWeekCount }}</strong>
          <small>节课程</small>
        </article>
      </div>

      <el-card class="teacher-card" shadow="never">
        <template #header>
          <div class="teacher-card-header">
            <div>
              <strong>今天课程</strong>
              <span>{{ todayDisplayLabel }}</span>
            </div>
            <el-tag type="info">{{ todaySchedules.length }} 节</el-tag>
          </div>
        </template>

        <div class="teacher-course-list">
          <van-empty v-if="!todaySchedules.length" description="今天暂无课程安排" />
          <CourseCard
            v-for="item in todaySchedules"
            :key="item.id"
            mode="teacher"
            :item="item"
            action-text="打卡消课"
            done-text="已完成"
            @action="openCheckin"
          />
        </div>
      </el-card>

      <div class="teacher-desktop-timetable">
        <WeeklyTimetable :schedules="teacherSchedules" title="我的周课程表" />
      </div>

      <el-card shadow="never" class="teacher-mobile-week-card">
        <template #header>
          <div class="teacher-card-header">
            <div>
              <strong>本周课程速览</strong>
              <span>按状态快速处理本周课程</span>
            </div>
          </div>
        </template>
        <MobileFilterTabs v-model="teacherCourseFilter" :options="teacherFilterOptions" aria-label="老师课程筛选" />
        <div class="teacher-course-list">
          <van-empty v-if="!filteredMobileWeekSchedules.length" description="暂无符合条件的课程" />
          <CourseCard
            v-for="item in filteredMobileWeekSchedules"
            :key="`mobile-week-${item.id}`"
            mode="teacher"
            :item="item"
            action-text="打卡消课"
            done-text="已完成"
            @action="openCheckin"
          />
        </div>
      </el-card>

      <el-card shadow="never" class="desktop-table">
        <template #header>
          <strong>本周课程列表</strong>
        </template>
        <el-table
          ref="weekTableRef"
          class="paginated-table"
          :data="weekSchedules"
          empty-text="暂无课程安排"
          stripe
          :style="{ '--table-visible-rows': 10 }"
        >
          <el-table-column prop="student_name" label="学生" min-width="100" />
          <el-table-column prop="student_grade" label="年级" min-width="90" />
          <el-table-column prop="course_name" label="科目" min-width="120" />
          <el-table-column label="类型" min-width="110">
            <template #default="{ row }">{{ categoryLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="日期" min-width="130">
            <template #default="{ row }">{{ dateLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="时间" min-width="160">
            <template #default="{ row }">{{ timeLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="课时" width="90">
            <template #default="{ row }">{{ formatHours(row.lesson_hours) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110">
            <template #default="{ row }">
              <StatusTag :status="row.status" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130">
            <template #default="{ row }">
              <el-button v-if="row.status !== '已消课'" type="primary" @click="openCheckin(row)">打卡消课</el-button>
              <span v-else class="muted-text">已完成</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card shadow="never">
        <template #header>
          <strong>历史授课记录</strong>
        </template>
        <el-timeline v-if="teacherRecords.length">
          <el-timeline-item v-for="item in teacherRecords" :key="item.id" :timestamp="item.checked_at">
            <strong>{{ item.course_name }} · {{ item.student_name }}</strong>
            <p>消课：{{ formatHours(item.lesson_hours) }} 课时</p>
            <p>课堂反馈：{{ item.feedback || "未填写" }}</p>
            <p>错题/备注：{{ item.wrong_notes || "未填写" }}</p>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无历史授课记录" />
      </el-card>

    <el-dialog v-model="dialogVisible" title="打卡消课" width="560px">
      <el-form :model="checkinForm" label-position="top">
        <el-form-item label="消课课时">
          <el-input-number v-model="checkinForm.lesson_hours" :min="0.5" :step="0.5" />
        </el-form-item>
        <el-form-item label="课堂反馈">
          <el-input v-model="checkinForm.feedback" placeholder="填写本次学习情况" type="textarea" />
        </el-form-item>
        <el-form-item label="错题/备注">
          <el-input v-model="checkinForm.wrong_notes" placeholder="填写错题、薄弱点或课后任务" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="checkin">确认消课</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "../api/client";
import { getAuth } from "../auth/session";
import CourseCard from "../components/CourseCard.vue";
import MobileFilterTabs from "../components/MobileFilterTabs.vue";
import StatusTag from "../components/StatusTag.vue";
import WeeklyTimetable from "../components/WeeklyTimetable.vue";
import { formatHours } from "../utils/format";
import {
  addDays,
  dateKey,
  formatCourseDateText,
  formatCourseTimeText,
  formatDate,
  formatScheduleTimeText,
  getMonday,
  parseDate,
  scheduleTimeValue,
} from "../utils/schedule-time";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["state-updated"]);

const route = useRoute();
const auth = getAuth();
const selectedSchedule = ref(null);
const dialogVisible = ref(false);
const weekTableRef = ref(null);
const teacherCourseFilter = ref("pending");
const checkinForm = reactive({ lesson_hours: 1, feedback: "", wrong_notes: "" });
const linkedTeacherId = Number(auth?.user?.related_id || 0);
const todayText = formatDate(new Date());
const weekStart = formatDate(getMonday(new Date()));
const weekEnd = formatDate(addDays(parseDate(weekStart), 6));

const teacherProfile = computed(() =>
  (props.state.teachers || []).find((item) => Number(item.id) === linkedTeacherId)
);
const teacherAccount = computed(() =>
  (props.state.teacherAccounts || []).find((item) => Number(item.related_id) === linkedTeacherId)
);
const teacherProfileStatus = computed(() => auth?.user?.profile_status || teacherProfile.value?.status || "启用");
const isTeacherApproved = computed(() => teacherProfileStatus.value === "启用");
const displayName = computed(() => auth?.user?.name || teacherProfile.value?.name || route.params.name || "老师");
const teacherStatus = computed(() => statusText(teacherProfileStatus.value));
const teacherPhone = computed(() => teacherAccount.value?.phone || teacherProfile.value?.phone || auth?.user?.phone || "未填写");
const teacherSubjects = computed(() => teacherProfile.value?.subject || "未任命科目");

const teacherSchedules = computed(() => {
  const schedules = linkedTeacherId
    ? props.state.schedules.filter((item) => Number(item.teacher_id) === linkedTeacherId)
    : props.state.schedules;
  return [...schedules].sort((a, b) => scheduleTimeValue(a) - scheduleTimeValue(b));
});

const weekSchedules = computed(() =>
  teacherSchedules.value.filter((item) => dateKey(item.planned_date) >= weekStart && dateKey(item.planned_date) <= weekEnd)
);

watch(weekSchedules, refreshWeekTableLayout, { flush: "post" });

async function refreshWeekTableLayout() {
  await nextTick();
  weekTableRef.value?.doLayout?.();
}
const todaySchedules = computed(() => teacherSchedules.value.filter((item) => dateKey(item.planned_date) === todayText));
const teacherRecords = computed(() => {
  if (!linkedTeacherId) return props.state.records;
  return props.state.records.filter((item) => Number(item.teacher_id) === linkedTeacherId);
});
const nextLesson = computed(() => teacherSchedules.value.find((item) => item.status !== "已消课" && scheduleTimeValue(item) >= Date.now()));
const todayPendingCount = computed(() => todaySchedules.value.filter((item) => item.status !== "已消课").length);
const completedWeekCount = computed(() => weekSchedules.value.filter((item) => item.status === "已消课").length);
const todayDisplayLabel = computed(() => `${dateText({ planned_date: todayText })} · 今日安排`);
const teacherFilterOptions = [
  { label: "待上", value: "pending" },
  { label: "今天", value: "today" },
  { label: "已消", value: "completed" },
  { label: "全部", value: "all" },
];
const filteredMobileWeekSchedules = computed(() => {
  if (teacherCourseFilter.value === "today") return todaySchedules.value;
  if (teacherCourseFilter.value === "completed") return weekSchedules.value.filter((item) => item.status === "已消课");
  if (teacherCourseFilter.value === "all") return weekSchedules.value;
  return weekSchedules.value.filter((item) => item.status !== "已消课");
});

function categoryLabel(row) {
  return row.course_category || "未设置";
}

function dateLabel(row) {
  return dateKey(row.planned_date) || "未设置";
}

function dateText(row) {
  return formatCourseDateText(row);
}

function timeLabel(row) {
  return formatScheduleTimeText({ ...row, planned_date: dateKey(row.planned_date) });
}

function timeRangeText(row) {
  return formatCourseTimeText(row);
}

function openCheckin(item) {
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
    emit("state-updated", payload);
    dialogVisible.value = false;
    ElMessage.success("已完成打卡消课");
  } catch (error) {
    ElMessage.error(error.message);
  }
}

function statusText(status) {
  if (status === "待审核") return "待审核";
  if (status === "已注销") return "需注销";
  return "已审核(正常)";
}

</script>

<style scoped>
.teacher-page {
  display: grid;
  gap: 16px;
}

.teacher-hero {
  align-items: stretch;
  background: linear-gradient(135deg, #ffffff 0%, #eff8f4 100%);
  border: 1px solid #dbe7f5;
  border-radius: 14px;
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr auto;
  padding: 22px 24px;
}

.teacher-kicker {
  color: #16875f;
  font-size: 13px;
  font-weight: 700;
}

.teacher-hero h2 {
  font-size: 26px;
  line-height: 1.25;
  margin: 8px 0;
}

.teacher-hero p {
  color: var(--muted);
  margin: 0;
}

.teacher-hero-meta {
  align-items: center;
  background: #ffffff;
  border: 1px solid #d9eadf;
  border-radius: 12px;
  display: grid;
  justify-items: center;
  min-width: 132px;
  padding: 14px 16px;
}

.teacher-hero-meta span,
.teacher-hero-meta small,
.summary-label {
  color: var(--muted);
  font-size: 13px;
}

.teacher-hero-meta strong,
.teacher-metric-card strong {
  color: var(--text);
  font-size: 28px;
  line-height: 1.1;
}

.teacher-summary-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1.6fr) repeat(2, minmax(130px, 0.7fr));
}

.next-teacher-card,
.teacher-metric-card {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 18px;
}

.next-teacher-card h3 {
  font-size: 22px;
  margin: 8px 0 6px;
}

.lesson-main-line,
.lesson-time-line,
.course-meta-line,
.course-time-line {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.lesson-time-line {
  margin-bottom: 12px;
}

.teacher-metric-card {
  align-content: center;
  display: grid;
  gap: 8px;
}

.teacher-card-header {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.teacher-card-header > div:first-child {
  display: grid;
  gap: 4px;
}

.teacher-card-header span {
  color: var(--muted);
  font-size: 13px;
}

.teacher-mobile-week-card {
  display: none;
}

.teacher-desktop-timetable {
  display: block;
}

.mobile-filter-tabs {
  background: #f4f7fb;
  border: 1px solid var(--line);
  border-radius: 10px;
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 12px;
  padding: 4px;
}

.mobile-filter-tabs button {
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  min-height: 38px;
}

.mobile-filter-tabs button.active {
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  color: #1d5fd6;
}

.teacher-course-list {
  display: grid;
  gap: 12px;
}

.teacher-course-item {
  align-items: center;
  background: #ffffff;
  border: 1px solid #dfe7f2;
  border-radius: 12px;
  display: grid;
  gap: 14px;
  grid-template-columns: 104px minmax(0, 1fr) auto;
  padding: 14px;
}

.teacher-course-item.completed {
  background: #fbfcff;
}

.teacher-course-time {
  align-items: center;
  background: #eaf8ef;
  border-radius: 10px;
  color: #16875f;
  display: grid;
  gap: 6px;
  justify-items: center;
  min-height: 82px;
  padding: 10px;
  text-align: center;
  white-space: pre-line;
}

.teacher-course-time span {
  color: var(--muted);
  font-size: 12px;
}

.course-title-line {
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.course-title-line strong {
  font-size: 17px;
}

.teacher-done-text {
  color: var(--muted);
  font-size: 14px;
  padding: 0 10px;
}

.profile-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.profile-field {
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 10px;
  display: grid;
  gap: 8px;
  padding: 14px;
}

.profile-field span {
  color: var(--muted);
  font-size: 13px;
}

@media (max-width: 760px) {
  .teacher-page {
    gap: 12px;
  }

  .teacher-hero {
    grid-template-columns: 1fr;
    padding: 18px;
  }

  .teacher-hero h2 {
    font-size: 22px;
  }

  .teacher-hero-meta {
    align-items: center;
    display: flex;
    justify-content: space-between;
    justify-items: initial;
    min-width: 0;
  }

  .teacher-summary-grid {
    grid-template-columns: 1fr 1fr;
  }

  .next-teacher-card {
    grid-column: 1 / -1;
  }

  .teacher-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .teacher-mobile-week-card {
    display: block;
  }

  .teacher-desktop-timetable {
    display: none;
  }

  .teacher-course-item {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .teacher-course-time {
    align-items: center;
    display: flex;
    justify-content: space-between;
    min-height: 44px;
    text-align: left;
  }

  .teacher-course-item .el-button {
    width: 100%;
  }
}
</style>

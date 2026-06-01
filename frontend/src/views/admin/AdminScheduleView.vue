<template>
  <section class="stack">
    <div class="admin-module-hero">
      <div>
        <span>管理员端</span>
        <h2>排课管理</h2>
        <p>集中完成排课、冲突检查、课程查询和排课列表维护。</p>
      </div>
      <div class="admin-module-metrics">
        <div>
          <strong>{{ totalScheduleCount }}</strong>
          <small>总排课</small>
        </div>
        <div>
          <strong>{{ pendingScheduleCount }}</strong>
          <small>待上课</small>
        </div>
        <div>
          <strong>{{ completedScheduleCount }}</strong>
          <small>已消课</small>
        </div>
      </div>
    </div>

    <el-card shadow="never">
      <template #header>
        <strong>课程编排</strong>
      </template>
      <el-form :model="scheduleForm" label-position="top">
        <el-row :gutter="16">
          <el-col :xs="8" :md="8">
            <el-form-item label="学生">
              <el-select v-model="scheduleForm.student_id" class="full" filterable placeholder="请选择学生">
                <el-option v-for="item in state.students" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="学生年级">
              <el-select v-model="scheduleForm.student_grade" class="full" placeholder="请选择年级">
                <el-option v-for="item in gradeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="课程类型">
              <el-select v-model="scheduleForm.course_category" class="full" placeholder="请选择课程类型">
                <el-option v-for="item in courseTypeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="老师">
              <el-select v-model="scheduleForm.teacher_id" class="full" filterable placeholder="请选择老师">
                <el-option
                  v-for="item in state.teachers"
                  :key="item.id"
                  :label="`${item.name}${item.subject ? `（${item.subject}）` : ''}`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="科目">
              <el-select
                v-model="scheduleForm.course_name"
                class="full"
                :disabled="!scheduleForm.teacher_id"
                placeholder="先选择老师"
              >
                <el-option v-for="item in subjectOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="日期">
              <el-date-picker v-model="scheduleForm.planned_date" class="full" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="星期">
              <el-input v-model="scheduleForm.weekday" disabled placeholder="选择日期后自动生成" />
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="开始时间">
              <el-time-select
                v-model="scheduleForm.start_time"
                class="full"
                start="07:00"
                step="00:30"
                end="22:00"
                @change="syncAutoLessonHours"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="结束时间">
              <el-time-select
                v-model="scheduleForm.end_time"
                class="full"
                start="07:00"
                step="00:30"
                end="22:00"
                :min-time="scheduleForm.start_time"
                @change="syncAutoLessonHours"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="课时（自动计算，可修改）">
              <el-input-number
                v-model="scheduleForm.lesson_hours"
                class="full"
                :min="0"
                :step="0.5"
                :precision="1"
                controls-position="right"
                placeholder="自动计算，可手动修改"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <div class="form-actions">
          <el-button type="primary" @click="submitSchedule">添加排课</el-button>
          <el-button @click="resetSchedule">清空表单</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card shadow="never" class="schedule-filter-card">
      <template #header>
        <div class="schedule-filter-header">
          <strong>排课查询</strong>
          <el-button v-if="hasScheduleFilters" text type="primary" @click="resetScheduleFilters">清空筛选</el-button>
        </div>
      </template>
      <el-form :model="scheduleFilters" label-position="top">
        <el-row :gutter="16">
          <el-col :xs="8" :md="8">
            <el-form-item label="按老师查看">
              <el-select
                v-model="scheduleFilters.teacher_id"
                class="full"
                clearable
                filterable
                placeholder="全部老师"
              >
                <el-option
                  v-for="item in state.teachers"
                  :key="item.id"
                  :label="`${item.name}${item.subject ? `（${item.subject}）` : ''}`"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="按学生查看">
              <el-select
                v-model="scheduleFilters.student_id"
                class="full"
                clearable
                filterable
                placeholder="全部学生"
              >
                <el-option v-for="item in state.students" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="按状态查看">
              <el-select
                v-model="scheduleFilters.status"
                class="full"
                clearable
                placeholder="全部状态"
              >
                <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="8" :md="8">
            <el-form-item label="查询结果">
              <div class="filter-summary">
                排课列表 {{ filteredSchedules.length }} 条
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <strong>排课列表</strong>
      </template>
      <el-table
        ref="scheduleTableRef"
        class="paginated-table"
        :data="pagedSchedules"
        empty-text="暂无符合条件的排课"
        stripe
        :style="{ '--table-visible-rows': schedulePageSize }"
      >
        <el-table-column prop="student_name" label="学生" min-width="100" />
        <el-table-column prop="student_grade" label="年级" min-width="90" />
        <el-table-column prop="course_name" label="科目" min-width="120" />
        <el-table-column label="类型" min-width="110">
          <template #default="{ row }">{{ categoryLabel(row) }}</template>
        </el-table-column>
        <el-table-column prop="teacher_name" label="老师" min-width="100" />
        <el-table-column label="日期" min-width="130">
          <template #default="{ row }">{{ row.planned_date || "未设置" }}</template>
        </el-table-column>
        <el-table-column label="时间" min-width="180">
          <template #default="{ row }">{{ timeLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="课时" width="90">
          <template #default="{ row }">{{ formatHours(row.lesson_hours) }}</template>
        </el-table-column>
        <el-table-column label="上课状态" width="110">
          <template #default="{ row }"><StatusTag :status="row.status" /></template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="danger" plain @click="removeSchedule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <CompactPagination
          v-model="schedulePage"
          :total="filteredSchedules.length"
          :page-size="schedulePageSize"
        />
      </div>
    </el-card>
  </section>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { api } from "../../api/client";
import CompactPagination from "../../components/CompactPagination.vue";
import StatusTag from "../../components/StatusTag.vue";
import { formatHours } from "../../utils/format";
import {
  calculateLessonHours,
  formatScheduleTimeText,
  timeToMinutes,
  weekdayFromValue,
} from "../../utils/schedule-time";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["state-updated"]);
const route = useRoute();
const router = useRouter();
const gradeOptions = ["初一", "初二", "初三"];
const courseTypeOptions = ["一对一", "小班课"];
const statusOptions = ["待上课", "未打卡", "已消课", "异常"];
const schedulePageSize = 10;
const schedulePage = ref(toPositivePage(route.query.page));
const scheduleTableRef = ref(null);

const scheduleForm = reactive({
  student_id: "",
  student_grade: "",
  teacher_id: "",
  course_name: "",
  course_category: "一对一",
  weekday: "",
  start_time: "09:00",
  end_time: "11:00",
  planned_date: "",
  lesson_hours: 2,
});

const scheduleFilters = reactive({
  teacher_id: queryId(route.query.teacher),
  student_id: queryId(route.query.student),
  status: statusValue(route.query.status),
});

const selectedStudent = computed(() =>
  (props.state.students || []).find((item) => Number(item.id) === Number(scheduleForm.student_id))
);

const selectedTeacher = computed(() =>
  (props.state.teachers || []).find((item) => Number(item.id) === Number(scheduleForm.teacher_id))
);

const subjectOptions = computed(() => {
  const subjectText = selectedTeacher.value?.subject || "";
  return subjectText
    .split(/[、,，/／;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
});

const hasScheduleFilters = computed(() => Boolean(scheduleFilters.teacher_id || scheduleFilters.student_id || scheduleFilters.status));
const totalScheduleCount = computed(() => (props.state.schedules || []).length);
const pendingScheduleCount = computed(() => (props.state.schedules || []).filter((item) => item.status === "待上课").length);
const completedScheduleCount = computed(() => (props.state.schedules || []).filter((item) => item.status === "已消课").length);

const filteredSchedules = computed(() =>
  (props.state.schedules || []).filter((item) => {
    const teacherMatched =
      !scheduleFilters.teacher_id || Number(item.teacher_id) === Number(scheduleFilters.teacher_id);
    const studentMatched =
      !scheduleFilters.student_id || Number(item.student_id) === Number(scheduleFilters.student_id);
    const statusMatched = !scheduleFilters.status || item.status === scheduleFilters.status;
    return teacherMatched && studentMatched && statusMatched;
  })
);

const scheduleTotalPages = computed(() => Math.max(1, Math.ceil(filteredSchedules.value.length / schedulePageSize)));
const pagedSchedules = computed(() => {
  const start = (schedulePage.value - 1) * schedulePageSize;
  return filteredSchedules.value.slice(start, start + schedulePageSize);
});

watch(
  () => [scheduleFilters.teacher_id, scheduleFilters.student_id, scheduleFilters.status, scheduleTotalPages.value],
  () => {
    normalizeSchedulePage();
    syncScheduleQuery();
  }
);

watch(schedulePage, () => {
  normalizeSchedulePage();
  syncScheduleQuery();
});

watch([schedulePage, pagedSchedules], refreshScheduleTableLayout, { flush: "post" });

watch(
  () => scheduleForm.student_id,
  () => {
    scheduleForm.student_grade = selectedStudent.value?.grade || "";
  }
);

watch(
  () => scheduleForm.teacher_id,
  () => {
    if (!subjectOptions.value.includes(scheduleForm.course_name)) {
      scheduleForm.course_name = subjectOptions.value[0] || "";
    }
  }
);

watch(
  () => scheduleForm.planned_date,
  () => {
    scheduleForm.weekday = getWeekday(scheduleForm.planned_date);
  }
);

async function refreshScheduleTableLayout() {
  await nextTick();
  scheduleTableRef.value?.doLayout?.();
}

watch(
  () => [scheduleForm.start_time, scheduleForm.end_time],
  syncAutoLessonHours,
  { immediate: true }
);

function syncAutoLessonHours() {
  const start = timeToMinutes(scheduleForm.start_time, null);
  const end = timeToMinutes(scheduleForm.end_time, null);
  if (start !== null && end !== null && end < start) {
    scheduleForm.end_time = "";
    scheduleForm.lesson_hours = 0;
    ElMessage.warning("结束时间不能早于开始时间，请重新选择结束时间");
    return;
  }
  scheduleForm.lesson_hours = calculateLessonHours(scheduleForm.start_time, scheduleForm.end_time);
}

function categoryLabel(row) {
  return row.course_category || "未设置";
}

function timeLabel(row) {
  return formatScheduleTimeText({
    ...row,
    weekday: row.weekday || getWeekday(row.planned_date) || "",
  });
}

function getWeekday(dateText) {
  return weekdayFromValue(dateText);
}

function resetScheduleFilters() {
  scheduleFilters.teacher_id = "";
  scheduleFilters.student_id = "";
  scheduleFilters.status = "";
  schedulePage.value = 1;
}

function normalizeSchedulePage() {
  const value = Number(schedulePage.value || 1);
  schedulePage.value = Math.min(Math.max(Math.trunc(value), 1), scheduleTotalPages.value);
}

function queryId(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : "";
}

function statusValue(value) {
  return statusOptions.includes(value) ? value : "";
}

function toPositivePage(value) {
  const number = Math.trunc(Number(value || 1));
  return Number.isFinite(number) && number > 0 ? number : 1;
}

function syncScheduleQuery() {
  router.replace({
    query: cleanQuery({
      ...route.query,
      teacher: scheduleFilters.teacher_id || undefined,
      student: scheduleFilters.student_id || undefined,
      status: scheduleFilters.status || undefined,
      page: schedulePage.value > 1 ? schedulePage.value : undefined,
    }),
  });
}

function cleanQuery(query) {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ""));
}

function resetSchedule() {
  Object.assign(scheduleForm, {
    student_id: "",
    student_grade: "",
    teacher_id: "",
    course_name: "",
    course_category: "一对一",
    weekday: "",
    start_time: "09:00",
    end_time: "11:00",
    planned_date: "",
    lesson_hours: 2,
  });
}

async function submitSchedule() {
  if (!scheduleForm.student_id || !scheduleForm.teacher_id || !scheduleForm.course_name) {
    ElMessage.warning("请先选择学生、老师和科目");
    return;
  }
  if (!scheduleForm.course_category) {
    ElMessage.warning("请选择课程类型");
    return;
  }
  if (!scheduleForm.planned_date) {
    ElMessage.warning("请选择上课日期");
    return;
  }
  if (!scheduleForm.student_grade) {
    ElMessage.warning("请选择学生年级");
    return;
  }
  if (!scheduleForm.start_time || !scheduleForm.end_time) {
    ElMessage.warning("请选择开始时间和结束时间");
    return;
  }
  if (timeToMinutes(scheduleForm.end_time) < timeToMinutes(scheduleForm.start_time)) {
    ElMessage.warning("结束时间不能早于开始时间");
    return;
  }
  if (!Number.isFinite(Number(scheduleForm.lesson_hours)) || Number(scheduleForm.lesson_hours) < 0) {
    ElMessage.warning("课时不能小于 0");
    return;
  }

  try {
    const payload = await api("/api/schedules", {
      method: "POST",
      body: JSON.stringify({
        ...scheduleForm,
        lesson_hours: Number(scheduleForm.lesson_hours),
      }),
    });
    emit("state-updated", payload);
    ElMessage.success("已添加排课，已保留本次填写内容");
  } catch (error) {
    if (String(error.message || "").includes("排课时间冲突")) {
      ElMessageBox.alert(error.message, "排课时间冲突", {
        type: "warning",
        confirmButtonText: "我知道了",
        customClass: "schedule-conflict-dialog",
      });
      return;
    }
    ElMessage.error(error.message);
  }
}

async function removeSchedule(row) {
  try {
    await ElMessageBox.confirm(`确定要删除“${row.student_name}的${row.course_name}”吗？`, "确认删除", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
    const payload = await api(`/api/schedules?id=${row.id}`, { method: "DELETE" });
    emit("state-updated", payload);
    ElMessage.success("已删除");
  } catch (error) {
    if (error !== "cancel") ElMessage.error(error.message || "已取消");
  }
}
</script>

<style scoped>
.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

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

@media (max-width: 760px) {
  .admin-module-hero {
    align-items: center;
    flex-direction: row;
  }
}
</style>

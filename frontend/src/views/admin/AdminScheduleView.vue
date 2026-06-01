<template>
  <section class="stack">
    <el-card shadow="never">
      <template #header>
        <strong>课程编排</strong>
      </template>
      <el-form :model="scheduleForm" label-position="top">
        <el-row :gutter="16">
          <el-col :xs="24" :md="8">
            <el-form-item label="学生">
              <el-select v-model="scheduleForm.student_id" class="full" filterable placeholder="请选择学生">
                <el-option v-for="item in state.students" :key="item.id" :label="item.name" :value="item.id" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="8">
            <el-form-item label="学生年级">
              <el-select v-model="scheduleForm.student_grade" class="full" placeholder="请选择年级">
                <el-option v-for="item in gradeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="8">
            <el-form-item label="课程类型">
              <el-select v-model="scheduleForm.course_category" class="full" placeholder="请选择课程类型">
                <el-option v-for="item in courseTypeOptions" :key="item" :label="item" :value="item" />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="8">
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

          <el-col :xs="24" :md="8">
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

          <el-col :xs="24" :md="8">
            <el-form-item label="日期">
              <el-date-picker v-model="scheduleForm.planned_date" class="full" value-format="YYYY-MM-DD" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="8">
            <el-form-item label="星期">
              <el-input v-model="scheduleForm.weekday" disabled placeholder="选择日期后自动生成" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="8">
            <el-form-item label="开始时间">
              <el-time-select v-model="scheduleForm.start_time" class="full" start="07:00" step="00:30" end="22:00" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="8">
            <el-form-item label="结束时间">
              <el-time-select v-model="scheduleForm.end_time" class="full" start="07:00" step="00:30" end="22:00" />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :md="8">
            <el-form-item label="自动课时">
              <el-input :model-value="`${formatHours(scheduleForm.lesson_hours)} 小时`" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <el-button type="primary" @click="submitSchedule">添加排课</el-button>
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
          <el-col :xs="24" :md="8">
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

          <el-col :xs="24" :md="8">
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

          <el-col :xs="24" :md="8">
            <el-form-item label="查询结果">
              <div class="filter-summary">
                排课列表 {{ filteredSchedules.length }} 条，当前周课程表 {{ filteredWeekScheduleCount }} 节
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <WeeklyTimetable :schedules="filteredSchedules" title="周课程表" />

    <el-card shadow="never">
      <template #header>
        <strong>排课列表</strong>
      </template>
      <el-table :data="pagedSchedules" empty-text="暂无符合条件的排课" stripe>
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
        <div v-if="filteredSchedules.length > schedulePageSize" class="compact-pagination">
          <el-button :disabled="schedulePage <= 1" @click="changeSchedulePage(-1)">上一页</el-button>
          <el-input-number
            v-model="schedulePage"
            class="page-input"
            :controls="false"
            :min="1"
            :max="scheduleTotalPages"
            @change="normalizeSchedulePage"
          />
          <span class="page-total">/ {{ scheduleTotalPages }}</span>
          <el-button :disabled="schedulePage >= scheduleTotalPages" @click="changeSchedulePage(1)">下一页</el-button>
        </div>
      </div>
    </el-card>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { api } from "../../api/client";
import StatusTag from "../../components/StatusTag.vue";
import WeeklyTimetable from "../../components/WeeklyTimetable.vue";
import { formatHours, formatScheduleTime } from "../../utils/format";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["state-updated"]);
const gradeOptions = ["初一", "初二", "初三"];
const courseTypeOptions = ["一对一", "小班课"];
const weekNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const schedulePageSize = 10;
const schedulePage = ref(1);

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
  teacher_id: "",
  student_id: "",
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

const hasScheduleFilters = computed(() => Boolean(scheduleFilters.teacher_id || scheduleFilters.student_id));

const filteredSchedules = computed(() =>
  (props.state.schedules || []).filter((item) => {
    const teacherMatched =
      !scheduleFilters.teacher_id || Number(item.teacher_id) === Number(scheduleFilters.teacher_id);
    const studentMatched =
      !scheduleFilters.student_id || Number(item.student_id) === Number(scheduleFilters.student_id);
    return teacherMatched && studentMatched;
  })
);

const filteredWeekScheduleCount = computed(() => countSchedulesInCurrentWeek(filteredSchedules.value));
const scheduleTotalPages = computed(() => Math.max(1, Math.ceil(filteredSchedules.value.length / schedulePageSize)));
const pagedSchedules = computed(() => {
  const start = (schedulePage.value - 1) * schedulePageSize;
  return filteredSchedules.value.slice(start, start + schedulePageSize);
});

watch(
  () => [scheduleFilters.teacher_id, scheduleFilters.student_id, scheduleTotalPages.value],
  () => {
    normalizeSchedulePage();
  }
);

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

watch(
  () => [scheduleForm.start_time, scheduleForm.end_time],
  () => {
    scheduleForm.lesson_hours = calculateLessonHours(scheduleForm.start_time, scheduleForm.end_time);
  },
  { immediate: true }
);

function categoryLabel(row) {
  return row.course_category || "未设置";
}

function timeLabel(row) {
  return formatScheduleTime({
    ...row,
    weekday: row.weekday || getWeekday(row.planned_date) || "",
  });
}

function getWeekday(dateText) {
  if (!dateText) return "";
  const date = parseDate(dateText);
  if (Number.isNaN(date.getTime())) return "";
  return weekNames[date.getDay()];
}

function resetScheduleFilters() {
  scheduleFilters.teacher_id = "";
  scheduleFilters.student_id = "";
  schedulePage.value = 1;
}

function normalizeSchedulePage() {
  const value = Number(schedulePage.value || 1);
  schedulePage.value = Math.min(Math.max(Math.trunc(value), 1), scheduleTotalPages.value);
}

function changeSchedulePage(delta) {
  schedulePage.value += delta;
  normalizeSchedulePage();
}

function calculateLessonHours(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null) return 1;
  if (end <= start) return 0.5;
  return Math.max(0.5, Math.round(((end - start) / 60) * 2) / 2);
}

function timeToMinutes(value) {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  return hour * 60 + minute;
}

function parseDate(value) {
  return new Date(`${value}T00:00:00`);
}

function countSchedulesInCurrentWeek(schedules) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);

  return schedules.filter((item) => {
    if (!item.planned_date) return false;
    const plannedDate = parseDate(item.planned_date);
    return plannedDate >= start && plannedDate <= end;
  }).length;
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

  try {
    const payload = await api("/api/schedules", {
      method: "POST",
      body: JSON.stringify(scheduleForm),
    });
    emit("state-updated", payload);
    resetSchedule();
    ElMessage.success("已添加排课");
  } catch (error) {
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

.compact-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input {
  width: 72px;
}

.page-total {
  min-width: 36px;
  color: #475569;
}
</style>

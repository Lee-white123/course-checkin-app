<template>
  <section class="stack">
    <el-card shadow="never">
      <template #header>
        <strong>家长查看</strong>
      </template>
      <div class="teacher-head">
        <div>
          <div class="teacher-title">当前家长：{{ displayName }}</div>
          <div class="teacher-subtitle">这里只展示关联学生的课程安排、上课记录和课后反馈。</div>
        </div>
        <el-tag type="info">关联学生：{{ studentName }}</el-tag>
      </div>
    </el-card>

    <WeeklyTimetable :schedules="studentSchedules" title="学生周课程表" />

    <el-card shadow="never">
      <template #header>
        <strong>课程安排</strong>
      </template>

      <div class="mobile-card-list">
        <van-empty v-if="!studentSchedules.length" description="暂无课程安排" />
        <van-card
          v-for="item in studentSchedules"
          :key="item.id"
          :desc="`${item.teacher_name} | ${dateLabel(item)} | ${timeLabel(item)} | ${formatHours(item.lesson_hours)}课时`"
          :title="item.course_name"
        >
          <template #tags>
            <van-tag :type="item.status === '已消课' ? 'success' : 'warning'">{{ item.status }}</van-tag>
          </template>
        </van-card>
      </div>

      <el-table class="desktop-table" :data="studentSchedules" empty-text="暂无课程安排" stripe>
        <el-table-column prop="course_name" label="科目" min-width="140" />
        <el-table-column prop="teacher_name" label="老师" min-width="100" />
        <el-table-column label="日期" min-width="130">
          <template #default="{ row }">{{ dateLabel(row) }}</template>
        </el-table-column>
        <el-table-column label="时间" min-width="180">
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
      </el-table>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <strong>历史上课记录</strong>
      </template>
      <el-timeline v-if="studentRecords.length">
        <el-timeline-item v-for="item in studentRecords" :key="item.id" :timestamp="item.checked_at">
          <strong>{{ item.course_name }} · {{ item.teacher_name }}</strong>
          <p>消课：{{ formatHours(item.lesson_hours) }} 课时</p>
          <p>课堂反馈：{{ item.feedback || "未填写" }}</p>
          <p>错题/备注：{{ item.wrong_notes || "未填写" }}</p>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="暂无上课记录" />
    </el-card>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { getAuth } from "../auth/session";
import StatusTag from "../components/StatusTag.vue";
import WeeklyTimetable from "../components/WeeklyTimetable.vue";
import { formatHours, formatScheduleTime } from "../utils/format";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const route = useRoute();
const auth = getAuth();
const linkedStudentId = Number(auth?.user?.related_id || 0);
const displayName = computed(() => auth?.user?.name || route.params.name || "家长");
const student = computed(() => props.state.students.find((item) => item.id === linkedStudentId));
const studentName = computed(() => student.value?.name || "暂无");

const studentSchedules = computed(() => {
  if (!linkedStudentId) return [];
  return props.state.schedules.filter((item) => item.student_id === linkedStudentId);
});

const studentRecords = computed(() => {
  if (!linkedStudentId) return [];
  return props.state.records.filter((item) => item.student_id === linkedStudentId);
});

function dateLabel(row) {
  return row.planned_date || "未设置";
}

function timeLabel(row) {
  return formatScheduleTime(row);
}
</script>

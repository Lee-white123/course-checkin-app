<template>
  <section>
    <el-row :gutter="14">
      <el-col v-for="item in metrics" :key="item.label" :xs="12" :sm="8" :lg="4">
        <el-card shadow="never" class="metric-card">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="section-card">
      <template #header>
        <strong>最近课程安排</strong>
      </template>
      <el-table :data="state.schedules.slice(0, 10)" empty-text="暂无课程安排" stripe>
        <el-table-column prop="student_name" label="学生" min-width="100" />
        <el-table-column prop="course_name" label="课程" min-width="150" />
        <el-table-column prop="teacher_name" label="老师" min-width="100" />
        <el-table-column label="时间" min-width="160">
          <template #default="{ row }">{{ formatScheduleTime(row) }}</template>
        </el-table-column>
        <el-table-column label="课时" width="90">
          <template #default="{ row }">{{ formatHours(row.lesson_hours) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </section>
</template>

<script setup>
import { computed } from "vue";
import StatusTag from "../components/StatusTag.vue";
import { formatHours, formatScheduleTime } from "../utils/format";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const metrics = computed(() => [
  ["老师数量", props.state.summary.teacher_count || 0],
  ["学生数量", props.state.summary.student_count || 0],
  ["待上课", props.state.summary.pending_schedule_count || 0],
  ["已消课", props.state.summary.completed_schedule_count || 0],
  ["购买课时", formatHours(props.state.summary.total_purchased_hours)],
  ["剩余课时", formatHours(props.state.summary.total_remaining_hours)],
].map(([label, value]) => ({ label, value })));
</script>

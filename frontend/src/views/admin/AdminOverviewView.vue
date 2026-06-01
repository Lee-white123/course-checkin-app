<template>
  <el-card shadow="never">
    <template #header>
      <strong>后台概览</strong>
    </template>
    <el-row :gutter="14">
      <el-col v-for="item in metrics" :key="item.label" :xs="12" :sm="8" :lg="4">
        <el-card shadow="never" class="metric-card">
          <div class="metric-label">{{ item.label }}</div>
          <div class="metric-value">{{ item.value }}</div>
        </el-card>
      </el-col>
    </el-row>
    <el-row :gutter="18" class="overview-panels">
      <el-col :xs="24" :lg="12">
        <div class="simple-panel">
          <div class="panel-title">课时消耗情况</div>
          <el-progress :percentage="consumedPercent" :stroke-width="14" />
          <div class="panel-note">
            已消耗 {{ formatHours(state.summary.total_consumed_hours) }} / 已购买
            {{ formatHours(state.summary.total_purchased_hours) }} 课时
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="12">
        <div class="simple-panel">
          <div class="panel-title">排课完成情况</div>
          <el-progress :percentage="scheduleDonePercent" :stroke-width="14" status="success" />
          <div class="panel-note">
            已消课 {{ state.summary.completed_schedule_count || 0 }} / 总排课
            {{ totalScheduleCount }} 节
          </div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script setup>
import { computed } from "vue";
import { formatHours } from "../../utils/format";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const totalScheduleCount = computed(
  () => Number(props.state.summary.pending_schedule_count || 0) + Number(props.state.summary.completed_schedule_count || 0)
);

const consumedPercent = computed(() => {
  const total = Number(props.state.summary.total_purchased_hours || 0);
  if (!total) return 0;
  return Math.min(100, Math.round((Number(props.state.summary.total_consumed_hours || 0) / total) * 100));
});

const scheduleDonePercent = computed(() => {
  if (!totalScheduleCount.value) return 0;
  return Math.round((Number(props.state.summary.completed_schedule_count || 0) / totalScheduleCount.value) * 100);
});

const metrics = computed(() => [
  ["管理员", props.state.summary.admin_count || 0],
  ["老师", props.state.summary.teacher_count || 0],
  ["学生", props.state.summary.student_count || 0],
  ["课程", props.state.summary.course_count || 0],
  ["待上课", props.state.summary.pending_schedule_count || 0],
  ["已消课", props.state.summary.completed_schedule_count || 0],
  ["剩余课时", formatHours(props.state.summary.total_remaining_hours)],
].map(([label, value]) => ({ label, value })));
</script>

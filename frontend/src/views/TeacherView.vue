<template>
  <section v-if="!isTeacherApproved" class="stack">
    <el-card shadow="never">
      <template #header>
        <strong>账号待审核</strong>
      </template>
      <el-result
        icon="info"
        title="老师账号正在等待审核"
        sub-title="管理员审核通过后，你就可以查看课程表并进行打卡消课。"
      />
    </el-card>
  </section>

  <section v-else class="stack">
    <el-card shadow="never">
      <template #header>
        <strong>老师消课</strong>
      </template>
      <div class="teacher-head">
        <div>
          <div class="teacher-title">当前老师：{{ displayName }}</div>
          <div class="teacher-subtitle">这里只展示与当前老师相关的课程安排，授课完成后可打卡消课。</div>
        </div>
        <el-tag type="info">共 {{ teacherSchedules.length }} 节课程</el-tag>
      </div>
    </el-card>

    <WeeklyTimetable :schedules="teacherSchedules" title="我的周课程表" />

    <div class="mobile-card-list">
      <van-empty v-if="!teacherSchedules.length" description="暂无课程安排" />
      <van-card
        v-for="item in teacherSchedules"
        :key="item.id"
        :desc="`${item.student_grade || '未设置年级'} | ${dateLabel(item)} | ${timeLabel(item)} | ${categoryLabel(item)} | ${formatHours(item.lesson_hours)}课时`"
        :title="`${item.course_name} · ${item.student_name}`"
      >
        <template #tags>
          <van-tag :type="item.status === '已消课' ? 'success' : 'warning'">{{ item.status }}</van-tag>
        </template>
        <template #footer>
          <van-button v-if="item.status !== '已消课'" size="small" type="primary" @click="openCheckin(item)">
            打卡消课
          </van-button>
        </template>
      </van-card>
    </div>

    <el-card shadow="never" class="desktop-table">
      <template #header>
        <strong>课程列表</strong>
      </template>
      <el-table :data="teacherSchedules" empty-text="暂无课程安排" stripe>
        <el-table-column prop="student_name" label="学生" min-width="100" />
        <el-table-column prop="student_grade" label="年级" min-width="90" />
        <el-table-column prop="course_name" label="科目" min-width="120" />
        <el-table-column label="类型" min-width="110">
          <template #default="{ row }">{{ categoryLabel(row) }}</template>
        </el-table-column>
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
import { computed, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "../api/client";
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
const emit = defineEmits(["state-updated"]);

const route = useRoute();
const auth = getAuth();
const linkedTeacherId = Number(auth?.user?.related_id || 0);
const teacherProfileStatus = computed(() => auth?.user?.profile_status || "启用");
const isTeacherApproved = computed(() => teacherProfileStatus.value === "启用");
const displayName = computed(() => auth?.user?.name || route.params.name || "老师");
const selectedSchedule = ref(null);
const dialogVisible = ref(false);
const checkinForm = reactive({ lesson_hours: 1, feedback: "", wrong_notes: "" });

const teacherSchedules = computed(() => {
  if (!linkedTeacherId) return props.state.schedules;
  return props.state.schedules.filter((item) => item.teacher_id === linkedTeacherId);
});

const teacherRecords = computed(() => {
  if (!linkedTeacherId) return props.state.records;
  return props.state.records.filter((item) => item.teacher_id === linkedTeacherId);
});

function categoryLabel(row) {
  return row.course_category || "未设置";
}

function dateLabel(row) {
  return row.planned_date || "未设置";
}

function timeLabel(row) {
  return formatScheduleTime(row);
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
</script>

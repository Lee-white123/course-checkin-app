<template>
  <TeacherPendingReview
    v-if="!isTeacherApproved"
    :auth="auth"
    :display-name="displayName"
    :teacher-account="teacherAccount"
    :teacher-phone="teacherPhone"
    :teacher-status="teacherStatus"
    :teacher-subjects="teacherSubjects"
  />

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
          <div class="lesson-main-line">{{ nextLesson.student_grade || "年级未设置" }} · {{ nextLesson.course_category || "未设置类型" }}</div>
          <div class="lesson-time-line">{{ formatCourseDateText(nextLesson) }} {{ formatCourseTimeText(nextLesson) }}</div>
          <el-button type="primary" :disabled="nextLesson.status === '已消课'" @click="openCheckin(nextLesson)">
            打卡消课
          </el-button>
        </template>
        <template v-else>
          <h3>暂无待消课程</h3>
          <div class="lesson-main-line">当前没有未来待上课程。</div>
        </template>
      </article>

      <article class="teacher-metric-card">
        <span class="summary-label">本周总课</span>
        <strong>{{ weekSchedules.length }}</strong>
        <small>节课程</small>
      </article>
      <article class="teacher-metric-card">
        <span class="summary-label">今日待上</span>
        <strong>{{ todayPendingCount }}</strong>
        <small>节课程</small>
      </article>
      <article class="teacher-metric-card">
        <span class="summary-label">本周已上</span>
        <strong>{{ completedWeekCount }}</strong>
        <small>节课程</small>
      </article>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="teacher-card-header">
          <div>
            <strong>今日课程</strong>
            <span>{{ todayDisplayLabel }}</span>
          </div>
          <el-tag type="info">{{ todaySchedules.length }} 节</el-tag>
        </div>
      </template>

      <div class="teacher-course-list">
        <van-empty v-if="!todaySchedules.length" description="今日无课程" />
        <TeacherLessonItem
          v-for="item in todaySchedules"
          :key="item.id"
          :item="item"
          @checkin="openCheckin"
        />
      </div>
    </el-card>

    <TeacherCheckinDialog v-model="dialogVisible" :form="checkinForm" @confirm="checkin" />
  </section>
</template>

<script setup>
import { computed } from "vue";
import { formatCourseDateText, formatCourseTimeText } from "../../utils/schedule-time";
import TeacherCheckinDialog from "./TeacherCheckinDialog.vue";
import TeacherLessonItem from "./TeacherLessonItem.vue";
import TeacherPendingReview from "./TeacherPendingReview.vue";
import { useTeacherPortal } from "./useTeacherPortal";
import "./teacher.css";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["state-updated"]);

const {
  auth,
  checkin,
  checkinForm,
  completedWeekCount,
  dialogVisible,
  displayName,
  isTeacherApproved,
  nextLesson,
  teacherAccount,
  teacherPhone,
  teacherStatus,
  teacherSubjects,
  todayPendingCount,
  todaySchedules,
  todayText,
  weekSchedules,
  openCheckin,
} = useTeacherPortal(props.state, emit);

const todayDisplayLabel = computed(() => `${formatCourseDateText({ planned_date: todayText })} · 今日安排`);
</script>

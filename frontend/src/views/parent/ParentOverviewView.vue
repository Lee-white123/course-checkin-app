<template>
  <section class="parent-page">
    <div class="parent-hero">
      <div>
        <span class="parent-kicker">家长端</span>
        <h2>{{ studentName }}的课程安排</h2>
        <p>{{ displayName }}，这里会集中展示孩子的本周课程、上课状态和历史反馈。</p>
      </div>
      <div class="parent-hero-meta">
        <span>{{ studentGrade }}</span>
        <strong>{{ weekSchedules.length }}</strong>
        <small>本周课程</small>
      </div>
    </div>

    <div class="parent-summary-grid">
      <article class="next-lesson-card">
        <span class="summary-label">下一节课</span>
        <template v-if="nextLesson">
          <h3>{{ nextLesson.course_name }}</h3>
          <div class="lesson-main-line">{{ nextLesson.teacher_name }} · {{ nextLesson.course_category || "未设置" }}</div>
          <div class="lesson-time-line">{{ formatCourseDateText(nextLesson) }} {{ formatCourseTimeText(nextLesson) }}</div>
          <StatusTag :status="nextLesson.status" />
        </template>
        <template v-else>
          <h3>暂无待上课程</h3>
          <div class="lesson-main-line">当前没有未来待上课程。</div>
        </template>
      </article>

      <article class="parent-metric-card">
        <span class="summary-label">本周总课</span>
        <strong>{{ weekSchedules.length }}</strong>
        <small>节课程</small>
      </article>
      <article class="parent-metric-card">
        <span class="summary-label">本周待上</span>
        <strong>{{ pendingWeekCount }}</strong>
        <small>节课程</small>
      </article>
      <article class="parent-metric-card">
        <span class="summary-label">本周已消</span>
        <strong>{{ completedWeekCount }}</strong>
        <small>节课程</small>
      </article>
    </div>

    <el-card shadow="never">
      <template #header>
        <div class="parent-card-header">
          <div>
            <strong>今日课程</strong>
            <span>{{ formatCourseDateText({ planned_date: todayText }) }} · 今日安排</span>
          </div>
          <el-tag type="info">{{ todaySchedules.length }} 节</el-tag>
        </div>
      </template>

      <div class="parent-course-list">
        <van-empty v-if="!todaySchedules.length" description="今日无课程" />
        <ParentCourseItem v-for="item in todaySchedules" :key="item.id" :item="item" />
      </div>
    </el-card>
  </section>
</template>

<script setup>
import StatusTag from "../../components/StatusTag.vue";
import { formatCourseDateText, formatCourseTimeText } from "../../utils/schedule-time";
import ParentCourseItem from "./ParentCourseItem.vue";
import { useParentPortal } from "./useParentPortal";
import "./parent.css";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const {
  displayName,
  studentName,
  studentGrade,
  weekSchedules,
  todaySchedules,
  todayText,
  nextLesson,
  pendingWeekCount,
  completedWeekCount,
} = useParentPortal(props.state);
</script>

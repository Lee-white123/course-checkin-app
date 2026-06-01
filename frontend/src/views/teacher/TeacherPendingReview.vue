<template>
  <section class="teacher-page">
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
</template>

<script setup>
defineProps({
  auth: {
    type: Object,
    default: null,
  },
  displayName: {
    type: String,
    required: true,
  },
  teacherAccount: {
    type: Object,
    default: null,
  },
  teacherPhone: {
    type: String,
    required: true,
  },
  teacherStatus: {
    type: String,
    required: true,
  },
  teacherSubjects: {
    type: String,
    required: true,
  },
});
</script>

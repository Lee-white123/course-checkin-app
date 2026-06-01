<template>
  <section class="account-page">
    <div class="account-hero">
      <div>
        <span class="account-kicker">我的账户</span>
        <h2>{{ profileTitle }}</h2>
        <p>这里集中管理当前登录账号的展示资料和密码。账号名、登录身份和审核状态由系统维护，不能在这里自行修改。</p>
      </div>
      <el-tag :type="statusTagType" size="large">{{ statusLabel }}</el-tag>
    </div>

    <el-alert
      v-if="mustChangePassword"
      title="当前密码是管理员重置的临时密码，请先修改密码。修改成功后需要重新登录。"
      type="warning"
      show-icon
      :closable="false"
    />

    <el-card shadow="never">
      <template #header>
        <div class="account-card-header">
          <div>
            <strong>账户信息</strong>
            <span>{{ roleLabel }}账号资料</span>
          </div>
          <div class="account-header-actions">
            <el-button type="primary" @click="openProfileDialog">修改资料</el-button>
            <el-button plain @click="openPasswordDialog">修改密码</el-button>
          </div>
        </div>
      </template>

      <div class="account-grid">
        <div v-for="item in accountFields" :key="item.label" class="account-field">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </el-card>

    <el-card v-if="relationFields.length" shadow="never">
      <template #header>
        <div class="account-card-header">
          <div>
            <strong>关联信息</strong>
            <span>{{ relationTitle }}</span>
          </div>
        </div>
      </template>

      <div class="account-grid">
        <div v-for="item in relationFields" :key="item.label" class="account-field">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="profileDialogVisible" title="修改资料" width="560px" class="account-dialog">
      <el-alert
        title="账号名和身份不能在这里修改。如需调整老师审核、管理员权限或账号停用，请在管理端对应模块处理。"
        type="info"
        :closable="false"
        show-icon
      />
      <el-form class="account-form" label-position="top" @submit.prevent>
        <el-form-item :label="nameLabel" :error="profileErrors.name">
          <el-input v-model="profileForm.name" :placeholder="namePlaceholder" maxlength="32" show-word-limit />
        </el-form-item>

        <el-form-item v-if="role !== 'admin'" label="手机号" :error="profileErrors.phone">
          <el-input v-model="profileForm.phone" placeholder="请输入有效的 11 位中国大陆手机号" maxlength="11" />
        </el-form-item>

        <template v-if="role === 'parent'">
          <el-form-item label="学生姓名" :error="profileErrors.student_name">
            <el-input v-model="profileForm.student_name" placeholder="请填写您孩子的姓名" maxlength="32" show-word-limit />
          </el-form-item>
          <el-form-item label="学生年级" :error="profileErrors.student_grade">
            <el-select v-model="profileForm.student_grade" placeholder="请选择您孩子的年级">
              <el-option v-for="grade in gradeOptions" :key="grade" :label="grade" :value="grade" />
            </el-select>
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="profileDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="profileSaving" @click="submitProfile">保存资料</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="560px" class="account-dialog">
      <el-alert
        title="密码支持纯数字、纯英文、数字英文组合，也支持加入 *_@。不能使用其它符号，不能全部是符号。"
        type="info"
        :closable="false"
        show-icon
      />
      <el-form class="account-form" label-position="top" @submit.prevent>
        <el-form-item label="原密码" :error="passwordErrors.current_password">
          <el-input v-model="passwordForm.current_password" type="password" placeholder="请输入当前密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" :error="passwordErrors.new_password">
          <el-input
            v-model="passwordForm.new_password"
            type="password"
            placeholder="8-32 位，可用英文、数字和符号 *_@"
            show-password
          />
          <div v-if="passwordForm.new_password" class="password-strength">
            <span>密码强度</span>
            <div class="strength-track">
              <i :class="`strength-${passwordStrength.level}`" :style="{ width: passwordStrength.width }" />
            </div>
            <strong>{{ passwordStrength.label }}</strong>
          </div>
        </el-form-item>
        <el-form-item label="确认新密码" :error="passwordErrors.confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="passwordSaving" @click="submitPassword">保存密码</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "../api/client";
import { clearAuth, getAuth, setAuth } from "../auth/session";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["state-updated"]);
const router = useRouter();

const gradeOptions = ["小升初", "初一", "初二", "初三"];
const authRef = ref(getAuth());
const profileDialogVisible = ref(false);
const passwordDialogVisible = ref(false);
const profileSaving = ref(false);
const passwordSaving = ref(false);
const profileForm = reactive({
  name: "",
  phone: "",
  student_name: "",
  student_grade: "",
});
const passwordForm = reactive({
  current_password: "",
  new_password: "",
  confirm_password: "",
});
const profileErrors = reactive({});
const passwordErrors = reactive({});

const role = computed(() => authRef.value?.role || authRef.value?.user?.role || "admin");
const user = computed(() => authRef.value?.user || {});
const mustChangePassword = computed(() => Number(user.value.must_change_password || 0) === 1);
const relatedId = computed(() => Number(user.value.related_id || 0));

const adminProfile = computed(() =>
  (props.state.admins || []).find((item) => item.username === user.value.username)
);
const teacherProfile = computed(() =>
  (props.state.teachers || []).find((item) => Number(item.id) === relatedId.value)
);
const teacherAccount = computed(() =>
  (props.state.teacherAccounts || []).find((item) =>
    Number(item.related_id) === relatedId.value || item.username === user.value.username
  )
);
const studentProfile = computed(() =>
  (props.state.students || []).find((item) => Number(item.id) === relatedId.value)
);
const parentAccount = computed(() =>
  (props.state.parentAccounts || []).find((item) =>
    Number(item.related_id) === relatedId.value || item.username === user.value.username
  )
);

const roleLabel = computed(() => {
  if (role.value === "teacher") return "老师";
  if (role.value === "parent") return "家长";
  return "管理员";
});

const nameLabel = computed(() => {
  if (role.value === "teacher") return "老师姓名";
  if (role.value === "parent") return "家长姓名";
  return "管理员名称";
});

const namePlaceholder = computed(() => {
  if (role.value === "teacher") return "请填写老师姓名";
  if (role.value === "parent") return "请填写孩子姓名+父母，例如小明妈妈";
  return "请填写管理员显示名称";
});

const currentProfile = computed(() => {
  if (role.value === "teacher") return teacherAccount.value || teacherProfile.value || user.value;
  if (role.value === "parent") return parentAccount.value || user.value;
  return adminProfile.value || user.value;
});

const profileTitle = computed(() => `${currentProfile.value?.name || user.value.name || roleLabel.value}的账户`);
const statusLabel = computed(() => {
  const status = currentProfile.value?.status || user.value.profile_status || "启用";
  if (status === "待审核") return "待审核";
  if (status === "禁用" || status === "已注销") return "需注销";
  return "正常";
});
const statusTagType = computed(() => {
  if (statusLabel.value === "待审核") return "warning";
  if (statusLabel.value === "需注销") return "danger";
  return "success";
});

const accountFields = computed(() => {
  const profile = currentProfile.value || {};
  const common = [
    { label: "登录身份", value: roleLabel.value },
    { label: "登录账号", value: profile.username || user.value.username || "未绑定" },
    { label: "显示姓名", value: profile.name || user.value.name || "未填写" },
    { label: "账号状态", value: statusLabel.value },
    { label: "密码状态", value: mustChangePassword.value ? "临时密码，需修改" : "正常" },
  ];

  if (role.value === "admin") {
    common.push(
      { label: "管理员类型", value: Number(profile.is_super || user.value.is_super || 0) === 1 ? "超级管理员" : "普通管理员" },
      { label: "登录限制", value: Number(profile.login_locked || 0) === 1 ? "已限制" : "正常" }
    );
  } else {
    common.push(
      { label: "手机号", value: profile.phone || user.value.phone || "未填写" },
      { label: "登录限制", value: Number(profile.login_locked || 0) === 1 ? "已限制" : "正常" }
    );
  }

  return common;
});

const relationTitle = computed(() => {
  if (role.value === "teacher") return "老师教学资料";
  if (role.value === "parent") return "关联学生资料";
  return "";
});

const relationFields = computed(() => {
  if (role.value === "teacher") {
    return [
      { label: "教学科目", value: teacherProfile.value?.subject || teacherAccount.value?.subject || "未任命科目" },
      { label: "审核状态", value: statusLabel.value },
      { label: "本周排课", value: `${weekScheduleCount.value} 节` },
    ];
  }

  if (role.value === "parent") {
    return [
      { label: "学生姓名", value: studentProfile.value?.name || "未绑定" },
      { label: "学生年级", value: studentProfile.value?.grade || "未设置" },
      { label: "本周课程", value: `${weekScheduleCount.value} 节` },
    ];
  }

  return [];
});

const weekScheduleCount = computed(() => {
  const start = getMonday(new Date());
  const end = addDays(start, 6);
  const startText = formatDate(start);
  const endText = formatDate(end);
  return (props.state.schedules || []).filter((item) => {
    const plannedDate = dateKey(item.planned_date);
    if (role.value === "teacher" && Number(item.teacher_id) !== relatedId.value) return false;
    if (role.value === "parent" && Number(item.student_id) !== relatedId.value) return false;
    return plannedDate >= startText && plannedDate <= endText;
  }).length;
});

const passwordStrength = computed(() => {
  const value = passwordForm.new_password;
  if (!value) return { level: "empty", label: "未输入", width: "0%" };
  const hasLetter = /[A-Za-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[*_@]/.test(value);
  const longEnough = value.length >= 12;
  const score = [hasLetter, hasNumber, hasSymbol, longEnough].filter(Boolean).length;
  if (score <= 1) return { level: "weak", label: "弱", width: "34%" };
  if (score <= 3) return { level: "medium", label: "中", width: "67%" };
  return { level: "strong", label: "强", width: "100%" };
});

function openProfileDialog() {
  clearErrors(profileErrors);
  profileForm.name = currentProfile.value?.name || user.value.name || "";
  profileForm.phone = currentProfile.value?.phone || user.value.phone || "";
  profileForm.student_name = studentProfile.value?.name || "";
  profileForm.student_grade = studentProfile.value?.grade || "";
  profileDialogVisible.value = true;
}

function openPasswordDialog() {
  clearErrors(passwordErrors);
  passwordForm.current_password = "";
  passwordForm.new_password = "";
  passwordForm.confirm_password = "";
  passwordDialogVisible.value = true;
}

async function submitProfile() {
  if (!validateProfile()) return;
  profileSaving.value = true;
  try {
    const payload = {
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
    };
    if (role.value === "parent") {
      payload.student_name = profileForm.student_name.trim();
      payload.student_grade = profileForm.student_grade;
    }
    const result = await api("/api/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    const nextAuth = {
      ...authRef.value,
      role: result.user.role || authRef.value?.role,
      user: result.user,
    };
    setAuth(nextAuth);
    authRef.value = nextAuth;
    emit("state-updated", await api("/api/bootstrap"));
    profileDialogVisible.value = false;
    ElMessage.success("资料已更新");
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    profileSaving.value = false;
  }
}

async function submitPassword() {
  if (!validatePassword()) return;
  passwordSaving.value = true;
  try {
    await api("/api/auth/password", {
      method: "PATCH",
      body: JSON.stringify({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
      }),
    });
    passwordDialogVisible.value = false;
    clearAuth();
    ElMessage.success("密码已更新，请重新登录");
    router.replace("/login");
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    passwordSaving.value = false;
  }
}

function validateProfile() {
  clearErrors(profileErrors);
  if (!profileForm.name.trim()) profileErrors.name = `请填写${nameLabel.value}`;
  if (profileForm.name.trim().length > 32) profileErrors.name = `${nameLabel.value}不能超过 32 个字符`;

  if (role.value !== "admin") {
    if (!profileForm.phone.trim()) profileErrors.phone = "请填写手机号";
    else if (!/^1[3-9]\d{9}$/.test(profileForm.phone.trim())) profileErrors.phone = "请输入有效的 11 位中国大陆手机号";
  }

  if (role.value === "parent") {
    if (!profileForm.student_name.trim()) profileErrors.student_name = "请填写您孩子的姓名";
    if (!profileForm.student_grade) profileErrors.student_grade = "请选择您孩子的年级";
  }

  return !Object.values(profileErrors).some(Boolean);
}

function validatePassword() {
  clearErrors(passwordErrors);
  if (!passwordForm.current_password) passwordErrors.current_password = "请输入原密码";
  if (!passwordForm.new_password) passwordErrors.new_password = "请输入新密码";
  if (!passwordForm.confirm_password) passwordErrors.confirm_password = "请再次输入新密码";

  const invalidChars = getInvalidPasswordChars(passwordForm.new_password);
  if (invalidChars.length) {
    passwordErrors.new_password = `密码不符合，不能出现 ${invalidChars.join("、")}`;
  } else if (passwordForm.new_password && !isValidPassword(passwordForm.new_password)) {
    passwordErrors.new_password = "密码需为 8-32 位，可使用英文、数字和符号 *_@，不能全部是符号";
  }
  if (passwordForm.new_password && passwordForm.confirm_password && passwordForm.new_password !== passwordForm.confirm_password) {
    passwordErrors.confirm_password = "两次输入的新密码不一致";
  }
  if (passwordForm.current_password && passwordForm.current_password === passwordForm.new_password) {
    passwordErrors.new_password = "新密码不能和原密码相同";
  }

  return !Object.values(passwordErrors).some(Boolean);
}

function isValidPassword(value) {
  const password = String(value || "");
  return /^[A-Za-z0-9*_@]{8,32}$/.test(password) && /[A-Za-z0-9]/.test(password);
}

function getInvalidPasswordChars(value) {
  return [...new Set([...String(value || "")].filter((char) => !/[A-Za-z0-9*_@]/.test(char)))];
}

function clearErrors(target) {
  for (const key of Object.keys(target)) delete target[key];
}

function getMonday(date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

function addDays(date, days) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateKey(value) {
  return String(value || "").slice(0, 10);
}

onMounted(() => {
  if (mustChangePassword.value) {
    openPasswordDialog();
  }
});
</script>

<style scoped>
.account-page {
  display: grid;
  gap: 16px;
}

.account-hero {
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0%, #f0f6ff 100%);
  border: 1px solid #dbe7f5;
  border-radius: 14px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 22px 24px;
}

.account-kicker {
  color: #246bfe;
  font-size: 13px;
  font-weight: 700;
}

.account-hero h2 {
  font-size: 26px;
  line-height: 1.25;
  margin: 8px 0;
}

.account-hero p {
  color: var(--muted);
  margin: 0;
}

.account-card-header {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.account-card-header > div:first-child {
  display: grid;
  gap: 4px;
}

.account-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.account-card-header span,
.account-field span {
  color: var(--muted);
  font-size: 13px;
}

.account-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.account-field {
  background: #f8fafc;
  border: 1px solid var(--line);
  border-radius: 10px;
  display: grid;
  gap: 8px;
  padding: 14px;
}

.account-form {
  display: grid;
  gap: 2px;
  margin-top: 16px;
}

.account-form :deep(.el-select) {
  width: 100%;
}

.password-strength {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: auto 1fr auto;
  margin-top: 10px;
  width: 100%;
}

.password-strength span,
.password-strength strong {
  color: var(--muted);
  font-size: 12px;
}

.strength-track {
  background: #edf1f7;
  border-radius: 999px;
  height: 8px;
  overflow: hidden;
}

.strength-track i {
  display: block;
  height: 100%;
  transition: width 180ms ease, background-color 180ms ease;
}

.strength-weak {
  background: #f56c6c;
}

.strength-medium {
  background: #e6a23c;
}

.strength-strong {
  background: #67c23a;
}

@media (max-width: 760px) {
  .account-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px;
  }

  .account-hero h2 {
    font-size: 22px;
  }

  .account-card-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .account-header-actions,
  .account-header-actions .el-button {
    width: 100%;
  }

  .account-header-actions {
    display: grid;
  }
}
</style>

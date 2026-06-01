<template>
  <main class="login-page auth-page">
    <div class="login-corner-brand" aria-label="学府助学">
      <img :src="xuefuLogo" alt="学府助学 XUEFU EDUCATION" />
    </div>

    <section class="login-panel">
      <div class="login-brand">
        <div class="eyebrow">老师/家长注册</div>
        <h1>创建访问账号</h1>
        <p>家长和老师可在这里自助注册。管理员账号不能自助注册，需要由超级管理员在后台创建。</p>
        <div class="auth-note">
          <strong>{{ roleIntro.title }}</strong>
          <span>{{ roleIntro.text }}</span>
        </div>
      </div>

      <div class="login-card register-card">
        <div class="auth-card-head">
          <strong>注册账号</strong>
          <span>请按实际身份填写信息，注册后再回到登录页进入系统。</span>
        </div>
        <el-form :model="form" label-position="top" @keyup.enter="submit">
          <div class="form-section">
            <div class="form-section-title">账号信息</div>
            <div class="register-role-lock">
              <span>注册身份</span>
              <strong>{{ roleLabel }}</strong>
              <el-button link type="primary" @click="router.push('/login')">重新选择</el-button>
            </div>
            <el-form-item label="账号" :error="errors.username">
              <el-input
                v-model="form.username"
                autocomplete="username"
                placeholder="4-32 位英文、数字或下划线"
                @blur="validateField('username')"
                @input="clearError('username')"
              />
            </el-form-item>
            <el-form-item label="密码" :error="errors.password">
              <el-input
                v-model="form.password"
                autocomplete="new-password"
                placeholder="8-32 位，可用英文、数字和符号 *_@"
                show-password
                type="password"
                @blur="validateField('password')"
                @input="clearError('password')"
              />
              <div v-if="form.password" class="password-strength">
                <div class="strength-bar" :aria-label="passwordStrength.label">
                  <span
                    v-for="index in 3"
                    :key="index"
                    :class="['strength-segment', { active: index <= passwordStrength.level }, passwordStrength.type]"
                  />
                </div>
                <span :class="['strength-label', passwordStrength.type]">{{ passwordStrength.label }}</span>
              </div>
            </el-form-item>
          </div>

          <template v-if="form.role === 'parent'">
            <div class="form-section">
              <div class="form-section-title">学生信息</div>
              <el-form-item label="学生姓名" :error="errors.student_name">
                <el-input
                  v-model="form.student_name"
                  placeholder="请填写您孩子的姓名"
                  @blur="validateField('student_name')"
                  @input="clearError('student_name')"
                />
              </el-form-item>
              <el-form-item label="学生年级" :error="errors.student_grade">
                <el-select
                  v-model="form.student_grade"
                  class="full"
                  placeholder="请选择您孩子的年级"
                  @blur="validateField('student_grade')"
                  @change="clearError('student_grade')"
                >
                  <el-option label="小升初" value="小升初" />
                  <el-option label="初一" value="初一" />
                  <el-option label="初二" value="初二" />
                  <el-option label="初三" value="初三" />
                </el-select>
              </el-form-item>
            </div>
          </template>

          <div class="form-section">
            <div class="form-section-title">联系信息</div>
            <el-form-item :label="form.role === 'teacher' ? '老师姓名' : '家长姓名'" :error="errors.name">
              <el-input
                v-model="form.name"
                :placeholder="namePlaceholder"
                @blur="validateField('name')"
                @input="clearError('name')"
              />
            </el-form-item>
            <el-form-item label="手机号" :error="errors.phone">
              <el-input
                v-model="form.phone"
                placeholder="请输入 11 位中国大陆手机号"
                @blur="validateField('phone')"
                @input="clearError('phone')"
              />
              <div class="field-help">每个手机号只能注册一次，用于区分不同用户。</div>
            </el-form-item>
          </div>

          <div class="form-section">
            <div class="form-section-title">安全验证</div>
            <el-form-item label="图形验证码" :error="errors.captcha_answer">
              <div class="captcha-row">
                <el-input
                  v-model="form.captcha_answer"
                  placeholder="请输入右侧验证码"
                  @blur="validateField('captcha_answer')"
                  @input="clearError('captcha_answer')"
                />
                <button class="captcha-image-button" type="button" @click="loadCaptcha" aria-label="刷新图形验证码">
                  <img v-if="captchaImage" :src="captchaImage" alt="图形验证码" />
                  <span v-else>刷新</span>
                </button>
              </div>
            </el-form-item>
          </div>

          <el-button class="login-button" type="primary" :loading="loading" @click="submit">注册</el-button>
        </el-form>

        <div class="login-actions">
          <span class="login-hint">注册成功后，请回到登录页使用新账号登录。</span>
          <el-button link type="primary" @click="router.push('/login')">返回登录</el-button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "../api/client";
import { getInvalidPasswordChars, isValidPassword, isValidPhone, isValidUsername } from "../utils/validators";
import xuefuLogo from "../assets/xuefu-transparent.png";

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const captchaImage = ref("");
const form = reactive({
  role: "parent",
  username: "",
  password: "",
  name: "",
  phone: "",
  captcha_id: "",
  captcha_answer: "",
  student_name: "",
  student_grade: "",
});

const errors = reactive({
  role: "",
  username: "",
  password: "",
  name: "",
  phone: "",
  captcha_answer: "",
  student_name: "",
  student_grade: "",
});

const passwordStrength = computed(() => {
  const password = form.password || "";
  if (!password) return { level: 0, label: "", type: "" };

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[*_@]/.test(password);
  const categoryCount = [hasLetter, hasNumber, hasSymbol].filter(Boolean).length;
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (categoryCount >= 2) score += 1;
  if (categoryCount >= 3) score += 1;

  if (score <= 1) return { level: 1, label: "密码强度：弱", type: "weak" };
  if (score <= 3) return { level: 2, label: "密码强度：中", type: "medium" };
  return { level: 3, label: "密码强度：强", type: "strong" };
});

const roleIntro = computed(() => {
  if (form.role === "teacher") {
    return {
      title: "老师注册",
      text: "提交后需要管理员审核，审核通过后才能进入老师端查看课程并消课。",
    };
  }
  return {
    title: "家长注册",
    text: "请填写孩子和家长信息，注册成功后可登录查看课程安排。",
  };
});

const roleLabel = computed(() => (form.role === "teacher" ? "老师" : "家长"));

const namePlaceholder = computed(() => {
  if (form.role === "teacher") return "请填写老师姓名";
  return form.student_name ? `请填写${form.student_name}父母，例如：${form.student_name}妈妈` : "请填写孩子姓名+父母，例如：小明妈妈";
});

watch(
  () => form.role,
  () => {
    errors.student_name = "";
    errors.student_grade = "";
  }
);

watch(
  () => route.query.role,
  () => {
    syncRoleFromRoute();
  }
);

function handleRoleChange() {
  errors.role = "";
  errors.student_name = "";
  errors.student_grade = "";
  if (form.role === "teacher") {
    form.student_name = "";
    form.student_grade = "";
  }
}

function syncRoleFromRoute() {
  const role = route.query.role === "teacher" ? "teacher" : "parent";
  form.role = role;
  handleRoleChange();
}

function clearError(field) {
  errors[field] = "";
}

function validateField(field) {
  const value = String(form[field] || "").trim();

  if (field === "role" && !form.role) errors.role = "请选择注册身份";
  if (field === "username") {
    if (!value) errors.username = "请输入账号";
    else if (!isValidUsername(value)) errors.username = "账号只能使用 4-32 位英文、数字或下划线";
  }
  if (field === "password") {
    const invalidChars = getInvalidPasswordChars(form.password);
    if (!form.password) errors.password = "请输入密码";
    else if (invalidChars.length) errors.password = `密码不符合，不能出现 ${invalidChars.join("、")}`;
    else if (!isValidPassword(form.password)) errors.password = "密码需为 8-32 位，可使用英文、数字和符号 *_@，不能全部是符号";
  }
  if (field === "name" && !value) errors.name = "请输入姓名";
  if (field === "phone") {
    if (!value) errors.phone = "请输入手机号";
    else if (!isValidPhone(value)) errors.phone = "请输入有效的 11 位中国大陆手机号";
  }
  if (field === "captcha_answer" && !value) errors.captcha_answer = "请输入图形验证码";
  if (field === "student_name" && form.role === "parent" && !value) errors.student_name = "请输入学生姓名";
  if (field === "student_grade" && form.role === "parent" && !value) errors.student_grade = "请输入学生年级";

  return !errors[field];
}

function validateForm() {
  Object.keys(errors).forEach((field) => {
    errors[field] = "";
  });

  const fields = ["role", "username", "password", "name", "phone", "captcha_answer"];
  if (form.role === "parent") fields.push("student_name", "student_grade");

  return fields.map(validateField).every(Boolean);
}

async function submit() {
  if (!validateForm()) {
    ElMessage.warning("请先修正注册信息");
    return;
  }

  loading.value = true;
  try {
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    });
    ElMessage.success("注册成功，请登录");
    router.replace("/login");
  } catch (error) {
    applyServerError(error);
    await loadCaptcha();
    ElMessage.error(error.message);
  } finally {
    loading.value = false;
  }
}

async function loadCaptcha() {
  try {
    const payload = await api("/api/auth/captcha");
    form.captcha_id = payload.captcha_id;
    form.captcha_answer = "";
    captchaImage.value = payload.image;
  } catch (error) {
    ElMessage.error(error.message || "验证码加载失败");
  }
}

function applyServerError(error) {
  const message = error.message || "";
  if (message.includes("验证码")) {
    errors.captcha_answer = message;
    return;
  }
  if (message.includes("手机号")) {
    errors.phone = message;
    return;
  }
  if (message.includes("账号")) {
    errors.username = message;
    return;
  }
  if (message.includes("密码")) {
    errors.password = message;
  }
}

onMounted(() => {
  syncRoleFromRoute();
  loadCaptcha();
});
</script>

<style scoped>
.password-strength {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}

.strength-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  width: 132px;
}

.strength-segment {
  height: 6px;
  border-radius: 999px;
  background: #d9e1ee;
}

.strength-segment.active.weak {
  background: #f56c6c;
}

.strength-segment.active.medium {
  background: #e6a23c;
}

.strength-segment.active.strong {
  background: #67c23a;
}

.strength-label {
  font-size: 13px;
  line-height: 1;
}

.strength-label.weak {
  color: #f56c6c;
}

.strength-label.medium {
  color: #b7791f;
}

.strength-label.strong {
  color: #529b2e;
}

.captcha-row {
  display: grid;
  grid-template-columns: 1fr 132px;
  gap: 10px;
  width: 100%;
}

.captcha-image-button {
  height: 44px;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  background: transparent;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.captcha-image-button img {
  display: block;
  width: 132px;
  height: 44px;
}

.field-help {
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 6px;
}

.register-role-lock {
  align-items: center;
  background: #f8fbff;
  border: 1px solid rgba(39, 78, 132, 0.16);
  border-radius: 10px;
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
  min-height: 44px;
  padding: 8px 12px;
}

.register-role-lock span {
  color: #667085;
  font-size: 14px;
}

.register-role-lock strong {
  color: #1d4ed8;
  font-size: 15px;
  margin-right: auto;
}

@media (max-width: 420px) {
  .password-strength {
    align-items: flex-start;
    flex-direction: column;
    gap: 6px;
  }

  .strength-bar {
    width: 100%;
  }

  .captcha-row {
    grid-template-columns: 1fr;
  }

  .captcha-image-button,
  .captcha-image-button img {
    width: 100%;
  }

  .register-role-lock {
    align-items: flex-start;
    flex-direction: column;
  }

  .register-role-lock strong {
    margin-right: 0;
  }
}
</style>

<template>
  <main class="login-page auth-page">
    <div class="login-corner-brand" aria-label="学府助学">
      <img :src="xuefuLogo" alt="学府助学 XUEFU EDUCATION" />
    </div>

    <section class="login-panel">
      <div class="login-brand">
        <h1>学府助学课时管理平台</h1>
        <div class="auth-note">
          <strong>{{ roleNote.title }}</strong>
          <span>{{ roleNote.text }}</span>
        </div>
      </div>

      <div class="login-card">
        <div class="auth-card-head">
          <strong>登录账号</strong>
          <span>{{ hintText }}</span>
        </div>
        <el-alert
          v-if="statusMessage"
          class="auth-alert"
          :title="statusMessage"
          type="error"
          show-icon
          :closable="false"
        />
        <el-form :model="form" label-position="top" @keyup.enter="submit">
          <el-form-item label="登录身份" :error="errors.role">
            <el-select v-model="form.role" class="full" @change="handleRoleChange">
              <el-option label="家长" value="parent" />
              <el-option label="老师" value="teacher" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </el-form-item>
          <el-form-item label="账号" :error="errors.username">
            <el-input
              v-model="form.username"
              autocomplete="username"
              placeholder="请输入账号"
              @blur="validateField('username')"
              @input="clearError('username')"
            />
          </el-form-item>
          <el-form-item label="密码" :error="errors.password">
            <el-input
              v-model="form.password"
              autocomplete="current-password"
              placeholder="请输入密码"
              show-password
              type="password"
              @blur="validateField('password')"
              @input="clearError('password')"
            />
          </el-form-item>
          <el-button class="login-button" type="primary" :loading="loading" @click="submit">登录</el-button>
        </el-form>

        <div class="login-actions">
          <span class="login-hint">{{ hintText }}</span>
          <el-button link type="primary" @click="registerDialogVisible = true">老师/家长注册</el-button>
        </div>
      </div>
    </section>

    <el-dialog v-model="registerDialogVisible" title="选择注册身份" width="420px" class="register-choice-dialog">
      <div class="register-choice-list">
        <button type="button" class="register-choice-card" @click="goRegister('parent')">
          <strong>家长注册</strong>
          <span>填写孩子和家长信息，注册后可查看课程安排。</span>
        </button>
        <button type="button" class="register-choice-card" @click="goRegister('teacher')">
          <strong>老师注册</strong>
          <span>填写老师信息，提交后等待管理员审核。</span>
        </button>
      </div>
    </el-dialog>
  </main>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "../api/client";
import { getRoleHome, setAuth } from "../auth/session";
import xuefuLogo from "../assets/xuefu-transparent.png";

const router = useRouter();
const loading = ref(false);
const registerDialogVisible = ref(false);
const form = reactive({
  username: "",
  password: "",
  role: "parent",
});

const errors = reactive({
  role: "",
  username: "",
  password: "",
});

const statusMessage = ref("");

const hintText = computed(() => {
  if (form.role === "teacher") return "老师账号注册后，需要等待管理员审核。";
  if (form.role === "admin") return "管理员账号由系统或超级管理员创建。";
  return "家长账号注册后，可查看课程安排。";
});

const roleNote = computed(() => {
  if (form.role === "teacher") {
    return {
      title: "老师登录",
      text: "请使用已注册并审核通过的老师账号登录，进入后可查看课程并完成消课。",
    };
  }
  if (form.role === "admin") {
    return {
      title: "管理员登录",
      text: "管理员账号由系统或超级管理员创建，用于课程编排、信息管理和权限管理。",
    };
  }
  return {
    title: "家长登录",
    text: "请使用注册时创建的家长账号登录，进入后可查看孩子的课程安排。",
  };
});

function handleRoleChange() {
  form.password = "";
  Object.keys(errors).forEach((field) => {
    errors[field] = "";
  });
  statusMessage.value = "";
}

function clearError(field) {
  errors[field] = "";
  statusMessage.value = "";
}

function validateField(field) {
  const value = String(form[field] || "").trim();
  if (field === "role" && !form.role) errors.role = "请选择登录身份";
  if (field === "username") errors.username = value ? "" : "请输入账号";
  if (field === "password") errors.password = form.password ? "" : "请输入密码";
  return !errors[field];
}

function validateForm() {
  Object.keys(errors).forEach((field) => {
    errors[field] = "";
  });
  return ["role", "username", "password"].map(validateField).every(Boolean);
}

function goRegister(role) {
  registerDialogVisible.value = false;
  router.push({ path: "/register", query: { role } });
}

async function submit() {
  if (!validateForm()) {
    statusMessage.value = "请先补全登录信息";
    ElMessage.warning("请先补全登录信息");
    return;
  }

  loading.value = true;
  statusMessage.value = "";
  try {
    const payload = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setAuth(payload);
    ElMessage.success("登录成功");
    router.replace(getLoginTarget(payload));
  } catch (error) {
    statusMessage.value = error.message || "登录失败，请检查账号和密码";
    if (statusMessage.value.includes("密码") || statusMessage.value.includes("账号")) {
      errors.password = statusMessage.value;
    }
    ElMessage.error(error.message);
  } finally {
    loading.value = false;
  }
}

function getLoginTarget(payload) {
  if (Number(payload?.user?.must_change_password || 0) !== 1) {
    return getRoleHome(payload);
  }

  const role = payload.role || payload.user?.role;
  const name = payload.user?.username || payload.user?.name || "user";
  if (role === "teacher") return `/teacher/${encodeURIComponent(name)}/account`;
  if (role === "parent") return `/parent/${encodeURIComponent(name)}/account`;
  return "/admin/account";
}
</script>

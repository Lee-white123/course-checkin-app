<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="login-brand">
        <div class="eyebrow">统一登录入口</div>
        <h1>课时消除管理系统</h1>
        <p>请选择登录身份，系统会进入对应的管理员端、老师端或家长端。</p>
      </div>

      <el-card shadow="never" class="login-card">
        <el-form :model="form" label-position="top" @keyup.enter="submit">
          <el-form-item label="登录身份">
            <el-select v-model="form.role" class="full" @change="handleRoleChange">
              <el-option label="家长" value="parent" />
              <el-option label="老师" value="teacher" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </el-form-item>
          <el-form-item label="账号">
            <el-input v-model="form.username" autocomplete="username" placeholder="请输入账号" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              autocomplete="current-password"
              placeholder="请输入密码"
              show-password
              type="password"
            />
          </el-form-item>
          <el-button class="login-button" type="primary" :loading="loading" @click="submit">登录</el-button>
        </el-form>

        <div class="login-actions">
          <span class="login-hint">{{ hintText }}</span>
          <el-button link type="primary" @click="router.push('/register')">老师/家长注册</el-button>
        </div>
      </el-card>
    </section>
  </main>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "../api/client";
import { getRoleHome, setAuth } from "../auth/session";

const router = useRouter();
const loading = ref(false);
const form = reactive({
  username: "",
  password: "",
  role: "parent",
});

const hintText = computed(() => {
  if (form.role === "teacher") return "老师账号需要先注册，或由机构提前创建。";
  if (form.role === "admin") return "管理员账号由系统或超级管理员创建。";
  return "家长账号需要先注册，系统里存在后才能登录。";
});

function handleRoleChange() {
  form.username = "";
  form.password = "";
}

async function submit() {
  if (!form.username || !form.password) {
    ElMessage.warning("请输入账号和密码");
    return;
  }

  loading.value = true;
  try {
    const payload = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setAuth(payload);
    ElMessage.success("登录成功");
    router.replace(getRoleHome(payload));
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    loading.value = false;
  }
}
</script>

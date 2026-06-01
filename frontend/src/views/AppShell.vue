<template>
  <div class="app-shell">
    <header class="app-header">
      <div>
        <div class="eyebrow">Vue 3 多端原型</div>
        <h1>课时消除管理系统</h1>
      </div>
      <div class="header-actions">
        <el-tag type="success" size="large">MySQL 远程数据库</el-tag>
        <span class="user-name">{{ currentUser?.name }}</span>
        <el-button plain @click="logout">退出登录</el-button>
      </div>
    </header>

    <el-menu class="desktop-nav" mode="horizontal" :default-active="activeMenu" @select="go">
      <el-menu-item v-for="item in menuItems" :key="item.name" :index="item.name">{{ item.label }}</el-menu-item>
    </el-menu>

    <main class="page-body">
      <router-view :state="state" @state-updated="replaceState" />
    </main>

    <van-tabbar class="mobile-nav" :model-value="activeMenu" @update:model-value="go">
      <van-tabbar-item v-for="item in menuItems" :key="item.name" :name="item.name" :icon="item.icon">
        {{ item.shortLabel }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { api } from "../api/client";
import { clearAuth, getAuth } from "../auth/session";

const router = useRouter();
const auth = ref(getAuth());
const currentUser = computed(() => auth.value?.user);
const currentRole = computed(() => auth.value?.role || auth.value?.user?.role || "admin");
const activeMenu = computed(() => currentRole.value);

const allMenus = {
  admin: [{ name: "admin", label: "后台管理", shortLabel: "管理", icon: "setting-o" }],
  teacher: [{ name: "teacher", label: "老师消课", shortLabel: "消课", icon: "records-o" }],
  parent: [{ name: "parent", label: "家长查看", shortLabel: "家长", icon: "friends-o" }],
};
const menuItems = computed(() => allMenus[currentRole.value] || allMenus.admin);

const state = reactive({
  admins: [],
  teacherAccounts: [],
  teachers: [],
  students: [],
  courses: [],
  schedules: [],
  records: [],
  summary: {},
});

function replaceState(payload) {
  Object.assign(state, payload);
}

async function loadBootstrap() {
  replaceState(await api("/api/bootstrap"));
}

function go(name) {
  const userName = currentUser.value?.username || currentUser.value?.name || "user";
  if (name === "admin") router.push("/admin/overview");
  if (name === "teacher") router.push(`/teacher/${encodeURIComponent(userName)}`);
  if (name === "parent") router.push(`/parent/${encodeURIComponent(userName)}`);
}

function logout() {
  clearAuth();
  router.replace("/login");
}

onMounted(async () => {
  try {
    await loadBootstrap();
  } catch (error) {
    ElMessage.error(error.message);
    if (!getAuth()) router.replace("/login");
  }
});
</script>

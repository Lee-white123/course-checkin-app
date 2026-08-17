<template>
  <div class="app-shell" :class="[{ 'is-sidebar-collapsed': sidebarCollapsed }, `role-${currentRole}`]">
    <aside class="app-sidebar" aria-label="系统导航">
      <div class="sidebar-brand">
        <div class="brand-mark" aria-label="学府助学 Logo">
          <img :src="xuefuMark" alt="学府助学" />
        </div>
        <div class="brand-copy">
          <strong>学府助学</strong>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div v-for="section in menuSections" :key="section.label" class="sidebar-nav-section">
          <div class="sidebar-section-label">{{ section.label }}</div>
          <button
            v-for="item in section.items"
            :key="item.name"
            class="sidebar-nav-item"
            :class="{ active: activeMenu === item.name }"
            type="button"
            @click="go(item.name)"
          >
            <el-icon><component :is="item.iconComponent" /></el-icon>
            <span>{{ item.label }}</span>
          </button>
        </div>
      </nav>

      <div class="sidebar-user-card">
        <span class="sidebar-user-avatar">{{ userInitial }}</span>
        <div class="sidebar-user-copy">
          <strong>{{ userDisplayName }}</strong>
          <span>{{ sidebarRoleName }}</span>
        </div>
      </div>
    </aside>

    <section class="app-workspace">
      <header class="app-header">
        <div class="topbar-left">
          <button class="topbar-menu-button" type="button" :aria-label="sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'" @click="sidebarCollapsed = !sidebarCollapsed">
            <el-icon><component :is="sidebarCollapsed ? Expand : Fold" /></el-icon>
          </button>
          <div class="topbar-title">
            <span>{{ roleLabel }}</span>
            <strong>{{ pageTitle }}</strong>
          </div>
        </div>
        <div class="header-actions">
            <button
              class="theme-cycle-button"
              type="button"
              :title="`当前主题：${activeThemeOption.label}`"
              :aria-label="`当前主题：${activeThemeOption.label}，点击切换主题`"
              @click="cycleTheme"
            >
              <el-icon><component :is="themeIcon" /></el-icon>
            </button>
            <el-dropdown trigger="click" @command="handleUserCommand">
              <button class="user-dropdown-trigger" type="button" aria-label="用户菜单">
                <span class="user-avatar">{{ userInitial }}</span>
                <span>你好，{{ userDisplayName }}</span>
                <el-icon><ArrowDown /></el-icon>
              </button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="account">
                    <el-icon><User /></el-icon>
                    <span>我的账户</span>
                  </el-dropdown-item>
                  <el-dropdown-item disabled class="theme-menu-label">
                    <span>主题模式</span>
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-for="theme in themeOptions"
                    :key="theme.value"
                    :command="`theme:${theme.value}`"
                    :class="{ 'is-theme-active': activeTheme === theme.value }"
                  >
                    <span class="theme-dot" :class="`theme-dot-${theme.value}`"></span>
                    <span>{{ theme.label }}</span>
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>
                    <span>退出登录</span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <button
              v-if="showAdminTodoDock"
              class="admin-todo-trigger"
              type="button"
              :aria-expanded="!adminTodoCollapsed"
              :aria-label="adminTodoCollapsed ? `展开 ${adminTodoAlerts.length} 项待处理提醒` : '收起待处理提醒'"
              :title="adminTodoCollapsed ? `展开 ${adminTodoAlerts.length} 项待处理` : '收起待处理提醒'"
              @click="adminTodoCollapsed = !adminTodoCollapsed"
            >
              <el-icon><component :is="adminTodoCollapsed ? Expand : Fold" /></el-icon>
            </button>
        </div>
      </header>

      <section
        v-if="showAdminTodoDock && !adminTodoCollapsed"
        class="admin-todo-dock"
        aria-live="polite"
      >
        <div class="admin-todo-list">
          <button
            v-for="item in adminTodoAlerts"
            :key="item.key"
            class="admin-todo-card"
            :class="`is-${item.tone}`"
            type="button"
            @click="goTodoAlert(item)"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.description }}</small>
            </span>
          </button>
        </div>
      </section>

      <main class="page-body">
        <StateBlock
          v-if="bootstrapLoading"
          type="loading"
          title="正在加载系统数据"
          description="正在同步账号、课程和排课信息，请稍等。"
        />
        <StateBlock
          v-else-if="bootstrapError"
          type="error"
          title="系统数据加载失败"
          :description="bootstrapError"
          action-text="重新加载"
          @action="loadBootstrap"
        />
        <router-view v-else :state="state" @state-updated="replaceState" />
      </main>
    </section>

    <van-tabbar class="mobile-nav" :model-value="activeMenu" @update:model-value="go">
      <van-tabbar-item v-for="item in menuItems" :key="item.name" :name="item.name" :icon="item.icon">
        {{ item.shortLabel }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowDown,
  Avatar,
  Calendar,
  Clock,
  Expand,
  Finished,
  Fold,
  House,
  Monitor,
  Moon,
  Operation,
  Reading,
  School,
  Setting,
  Sunny,
  SwitchButton,
  TrendCharts,
  User,
  WarningFilled,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { api } from "../api/client";
import { clearAuth, getAuth } from "../auth/session";
import StateBlock from "../components/StateBlock.vue";
import xuefuMark from "../assets/xuefu-mark.png";

const router = useRouter();
const route = useRoute();
const auth = ref(getAuth());
const bootstrapLoading = ref(true);
const bootstrapError = ref("");
const sidebarCollapsed = ref(false);
const THEME_STORAGE_KEY = "course-checkin-theme";
const activeTheme = ref(localStorage.getItem(THEME_STORAGE_KEY) || "auto");
const themeOptions = [
  { value: "light", label: "明亮" },
  { value: "dark", label: "暗色" },
  { value: "auto", label: "自动" },
];
const activeThemeOption = computed(() => themeOptions.find((option) => option.value === activeTheme.value) || themeOptions[2]);
const themeIcon = computed(() => {
  if (activeTheme.value === "light") return Sunny;
  if (activeTheme.value === "dark") return Moon;
  return Monitor;
});
const currentUser = computed(() => auth.value?.user);
const currentRole = computed(() => auth.value?.role || auth.value?.user?.role || "admin");
const userDisplayName = computed(() => currentUser.value?.name || currentUser.value?.username || "用户");
const userInitial = computed(() => userDisplayName.value.trim().charAt(0) || "用");
const activeMenu = computed(() => {
  const routeName = String(route.name || "");
  return menuItems.value.find((item) => item.routeName === routeName || item.name === routeName)?.name || menuItems.value[0]?.name;
});

const allMenus = {
  admin: [
    { name: "admin-overview", routeName: "admin-overview", label: "数据总览", shortLabel: "总览", section: "后台工作", icon: "wap-home-o", iconComponent: TrendCharts },
    { name: "admin-review", routeName: "admin-review", label: "账号审核", shortLabel: "审核", section: "信息管理", icon: "certificate", iconComponent: Finished },
    { name: "admin-teachers", routeName: "admin-teachers", label: "教师管理", shortLabel: "教师", section: "信息管理", icon: "friends-o", iconComponent: School },
    { name: "admin-students", routeName: "admin-students", label: "学员管理", shortLabel: "学员", section: "信息管理", icon: "friends-o", iconComponent: Avatar },
    { name: "admin-schedule", routeName: "admin-schedule", label: "排课管理", shortLabel: "排课", section: "系统管理", icon: "calendar-o", iconComponent: Operation },
    { name: "admin-coursetable", routeName: "admin-coursetable", label: "完整课程表", shortLabel: "课表", section: "系统管理", icon: "calendar-o", iconComponent: Calendar },
    { name: "admin-permissions", routeName: "admin-permissions", label: "管理员授权", shortLabel: "授权", section: "权限管理", icon: "setting-o", iconComponent: Setting, superOnly: true },
    { name: "admin-account", routeName: "admin-account", label: "我的账户", shortLabel: "我的", section: "我的", icon: "user-o", iconComponent: User },
  ],
  teacher: [
    { name: "teacher-overview", routeName: "teacher-overview", label: "基本信息", shortLabel: "概览", section: "课程信息", icon: "wap-home-o", iconComponent: House },
    { name: "teacher-courses", routeName: "teacher-courses", label: "查看课程", shortLabel: "课程", section: "课程信息", icon: "records-o", iconComponent: Reading },
    { name: "teacher-schedule", routeName: "teacher-schedule", label: "完整课程表", shortLabel: "课表", section: "课程信息", icon: "calendar-o", iconComponent: Calendar },
    { name: "teacher-history", routeName: "teacher-history", label: "历史上课记录", shortLabel: "记录", section: "课程信息", icon: "clock-o", iconComponent: Clock },
    { name: "teacher-account", routeName: "teacher-account", label: "我的账户", shortLabel: "我的", section: "我的", icon: "user-o", iconComponent: User },
  ],
  parent: [
    { name: "parent-overview", routeName: "parent-overview", label: "基本信息", shortLabel: "概览", section: "课程信息", icon: "wap-home-o", iconComponent: House },
    { name: "parent-courses", routeName: "parent-courses", label: "查看课程", shortLabel: "课程", section: "课程信息", icon: "records-o", iconComponent: Reading },
    { name: "parent-schedule", routeName: "parent-schedule", label: "完整课程表", shortLabel: "课表", section: "课程信息", icon: "calendar-o", iconComponent: Calendar },
    { name: "parent-history", routeName: "parent-history", label: "历史上课记录", shortLabel: "记录", section: "课程信息", icon: "clock-o", iconComponent: Clock },
    { name: "parent-account", routeName: "parent-account", label: "我的账户", shortLabel: "我的", section: "我的", icon: "user-o", iconComponent: User },
  ],
};
const menuItems = computed(() => {
  const items = allMenus[currentRole.value] || allMenus.admin;
  if (currentRole.value !== "admin") return items;
  return items.filter((item) => !item.superOnly || currentUser.value?.username === "admin" || Number(currentUser.value?.is_super || 0) === 1);
});
const menuSections = computed(() => {
  const sections = [];
  for (const item of menuItems.value) {
    const label = item.section || "常用";
    const existing = sections.find((section) => section.label === label);
    if (existing) {
      existing.items.push(item);
    } else {
      sections.push({ label, items: [item] });
    }
  }
  return sections;
});
const roleLabel = computed(() => {
  if (currentRole.value === "teacher") return "老师端";
  if (currentRole.value === "parent") return "家长端";
  return "管理员端";
});
const sidebarRoleName = computed(() => {
  if (currentRole.value === "teacher") return "教师";
  if (currentRole.value === "parent") return "家长";
  return currentUser.value?.username === "admin" || Number(currentUser.value?.is_super || 0) === 1 ? "校区管理员" : "管理员";
});
const pageTitle = computed(() => menuItems.value.find((item) => item.name === activeMenu.value)?.label || "学府助学");
const abnormalScheduleCount = computed(() => (state.schedules || []).filter((item) => item.status === "异常").length);
const accountReviewCount = computed(
  () =>
    countPending(state.teacherAccounts) +
    countPending(state.parentAccounts) +
    countPending(state.admins)
);
const teacherAssignmentCount = computed(() =>
  (state.teachers || []).filter((teacher) => !String(teacher.subject || teacher.subjects || "").trim()).length
);
const adminTodoAlerts = computed(() => {
  if (currentRole.value !== "admin") return [];
  return [
    abnormalScheduleCount.value > 0 && {
      key: "abnormal",
      tone: "danger",
      icon: WarningFilled,
      title: `${abnormalScheduleCount.value} 节异常打卡待处理`,
      description: "请尽快核对课时并重新安排课程",
      route: { name: "admin-schedule", query: { status: "异常" } },
    },
    accountReviewCount.value > 0 && {
      key: "review",
      tone: "violet",
      icon: Finished,
      title: `${accountReviewCount.value} 个账号等待审核`,
      description: "请及时完成老师、家长或管理员身份审核",
      route: { name: "admin-review" },
    },
    teacherAssignmentCount.value > 0 && {
      key: "subjects",
      tone: "amber",
      icon: School,
      title: `${teacherAssignmentCount.value} 位老师待任命科目`,
      description: "请为老师配置可授课科目",
      route: { name: "admin-review", query: { section: "subjects" } },
    },
  ].filter(Boolean);
});
const showAdminTodoDock = computed(() => adminTodoAlerts.value.length > 0);
const adminTodoCollapsed = ref(false);
const todoNoticeShown = ref(false);

const state = reactive({
  admins: [],
  teacherAccounts: [],
  parentAccounts: [],
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
  bootstrapLoading.value = true;
  bootstrapError.value = "";
  try {
    replaceState(await api("/api/bootstrap"));
  } catch (error) {
    bootstrapError.value = error.message || "请检查后端服务和数据库连接状态。";
    if (!getAuth()) router.replace("/login");
  } finally {
    bootstrapLoading.value = false;
  }
}

function go(name) {
  const target = menuItems.value.find((item) => item.name === name);
  if (!target) return;

  if (mustChangePassword.value && !target.name.endsWith("account")) {
    ElMessage.warning("请先修改管理员重置的临时密码");
    return;
  }

  const userName = currentUser.value?.username || currentUser.value?.name || "user";
  if (currentRole.value === "admin") {
    router.push({ name: target.routeName });
  } else {
    router.push({ name: target.routeName, params: { name: userName } });
  }
}

function goTodoAlert(item) {
  if (item?.route) router.push(item.route);
}

function countPending(items = []) {
  return (items || []).filter((item) => item.status === "待审核" || item.profile_status === "待审核" || item.teacher_status === "待审核").length;
}

const mustChangePassword = computed(() => Number(currentUser.value?.must_change_password || 0) === 1);

function accountPath() {
  const userName = currentUser.value?.username || currentUser.value?.name || "user";
  if (currentRole.value === "teacher") return `/teacher/${encodeURIComponent(userName)}/account`;
  if (currentRole.value === "parent") return `/parent/${encodeURIComponent(userName)}/account`;
  return "/admin/account";
}

function handleUserCommand(command) {
  if (String(command).startsWith("theme:")) {
    setTheme(String(command).replace("theme:", ""));
    return;
  }

  if (command === "account") {
    const accountMenu = menuItems.value.find((item) => item.name.endsWith("account"));
    if (accountMenu) go(accountMenu.name);
    return;
  }

  if (command === "logout") logout();
}

async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {
    // 本地会话仍然要清理，避免退出时因为网络问题卡住用户。
  } finally {
    clearAuth();
    router.replace("/login");
  }
}

function applyTheme(theme) {
  const normalizedTheme = themeOptions.some((option) => option.value === theme) ? theme : "auto";
  document.documentElement.dataset.theme = normalizedTheme;
  document.documentElement.style.colorScheme = normalizedTheme === "dark" ? "dark" : normalizedTheme === "light" ? "light" : "light dark";
}

function setTheme(theme) {
  const normalizedTheme = themeOptions.some((option) => option.value === theme) ? theme : "auto";
  activeTheme.value = normalizedTheme;
  localStorage.setItem(THEME_STORAGE_KEY, normalizedTheme);
  applyTheme(normalizedTheme);
}

function cycleTheme() {
  const themeOrder = ["light", "dark", "auto"];
  const currentIndex = themeOrder.indexOf(activeTheme.value);
  setTheme(themeOrder[(currentIndex + 1) % themeOrder.length]);
}

onMounted(async () => {
  applyTheme(activeTheme.value);
  await loadBootstrap();
  if (!bootstrapError.value && mustChangePassword.value && !["admin-account", "teacher-account", "parent-account"].includes(route.name)) {
    ElMessage.warning("当前为临时密码，请先修改密码");
    router.replace(accountPath());
  }
});

watch(
  () => adminTodoAlerts.value.length,
  (count) => {
    if (currentRole.value !== "admin" || !count) {
      todoNoticeShown.value = false;
      return;
    }
    if (todoNoticeShown.value) return;
    todoNoticeShown.value = true;
    ElMessage.warning(`当前有 ${count} 项待处理事项需要关注`);
  }
);
</script>

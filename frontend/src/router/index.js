import { createRouter, createWebHistory } from "vue-router";
import { getAuth, getRoleHome } from "../auth/session";

const LoginView = () => import("../views/LoginView.vue");
const RegisterView = () => import("../views/RegisterView.vue");
const AppShell = () => import("../views/AppShell.vue");
const AccountView = () => import("../views/AccountView.vue");
const AdminLayout = () => import("../views/admin/AdminLayout.vue");
const AdminOverviewView = () => import("../views/admin/AdminOverviewView.vue");
const AdminTeachersView = () => import("../views/admin/AdminTeachersView.vue");
const AdminStudentsView = () => import("../views/admin/AdminStudentsView.vue");
const AdminReviewView = () => import("../views/admin/AdminReviewView.vue");
const AdminScheduleView = () => import("../views/admin/AdminScheduleView.vue");
const AdminCourseTableView = () => import("../views/admin/AdminCourseTableView.vue");
const AdminPermissionsView = () => import("../views/admin/AdminPermissionsView.vue");
const TeacherOverviewView = () => import("../views/teacher/TeacherOverviewView.vue");
const TeacherCoursesView = () => import("../views/teacher/TeacherCoursesView.vue");
const TeacherScheduleView = () => import("../views/teacher/TeacherScheduleView.vue");
const TeacherHistoryView = () => import("../views/teacher/TeacherHistoryView.vue");
const ParentOverviewView = () => import("../views/parent/ParentOverviewView.vue");
const ParentCoursesView = () => import("../views/parent/ParentCoursesView.vue");
const ParentScheduleView = () => import("../views/parent/ParentScheduleView.vue");
const ParentHistoryView = () => import("../views/parent/ParentHistoryView.vue");

const routes = [
  { path: "/", redirect: "/login" },
  { path: "/login", name: "login", component: LoginView, meta: { public: true } },
  { path: "/register", name: "register", component: RegisterView, meta: { public: true } },
  {
    path: "/",
    component: AppShell,
    children: [
      {
        path: "admin",
        component: AdminLayout,
        redirect: { name: "admin-overview" },
        meta: { role: "admin" },
        children: [
          { path: "overview", name: "admin-overview", component: AdminOverviewView, meta: { role: "admin" } },
          { path: "users", redirect: { name: "admin-teachers" } },
          { path: "review", name: "admin-review", component: AdminReviewView, meta: { role: "admin" } },
          { path: "teachers", name: "admin-teachers", component: AdminTeachersView, meta: { role: "admin" } },
          { path: "students", name: "admin-students", component: AdminStudentsView, meta: { role: "admin" } },
          { path: "audit", redirect: { name: "admin-review" } },
          { path: "schedule", name: "admin-schedule", component: AdminScheduleView, meta: { role: "admin" } },
          { path: "coursetable", name: "admin-coursetable", component: AdminCourseTableView, meta: { role: "admin" } },
          { path: "courses", redirect: { name: "admin-schedule" } },
          { path: "permissions", name: "admin-permissions", component: AdminPermissionsView, meta: { role: "admin" } },
          { path: "account", name: "admin-account", component: AccountView, meta: { role: "admin", label: "我的账户" } },
        ],
      },
      { path: "admin/:name", redirect: { name: "admin-overview" } },
      { path: "dashboard", redirect: { name: "admin-overview" } },
      { path: "teacher/:name/overview", name: "teacher-overview", component: TeacherOverviewView, meta: { role: "teacher", label: "基本信息" } },
      { path: "teacher/:name/courses", name: "teacher-courses", component: TeacherCoursesView, meta: { role: "teacher", label: "查看本周课程" } },
      { path: "teacher/:name/schedule", name: "teacher-schedule", component: TeacherScheduleView, meta: { role: "teacher", label: "完整课程表" } },
      { path: "teacher/:name/history", name: "teacher-history", component: TeacherHistoryView, meta: { role: "teacher", label: "历史上课记录" } },
      { path: "teacher/:name/account", name: "teacher-account", component: AccountView, meta: { role: "teacher", label: "我的账户" } },
      {
        path: "teacher/:name?",
        name: "teacher",
        redirect: (to) => {
          const auth = getAuth();
          const name = to.params.name || auth?.user?.username || auth?.user?.name || "user";
          return `/teacher/${encodeURIComponent(name)}/overview`;
        },
        meta: { role: "teacher", label: "老师端" },
      },
      { path: "parent/:name/overview", name: "parent-overview", component: ParentOverviewView, meta: { role: "parent", label: "基本信息" } },
      { path: "parent/:name/courses", name: "parent-courses", component: ParentCoursesView, meta: { role: "parent", label: "查看课程" } },
      { path: "parent/:name/schedule", name: "parent-schedule", component: ParentScheduleView, meta: { role: "parent", label: "完整课程表" } },
      { path: "parent/:name/history", name: "parent-history", component: ParentHistoryView, meta: { role: "parent", label: "历史上课记录" } },
      { path: "parent/:name/account", name: "parent-account", component: AccountView, meta: { role: "parent", label: "我的账户" } },
      {
        path: "parent/:name?",
        name: "parent",
        redirect: (to) => {
          const auth = getAuth();
          const name = to.params.name || auth?.user?.username || auth?.user?.name || "user";
          return `/parent/${encodeURIComponent(name)}/overview`;
        },
        meta: { role: "parent", label: "家长端" },
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/login" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = getAuth();

  if (to.meta.public) {
    if (auth && (to.name === "login" || to.name === "register")) return { path: getAuthEntry(auth), replace: true };
    return true;
  }

  if (!auth) return { path: "/login", replace: true };

  const requiredRole = to.meta.role;
  const role = auth.role || auth.user?.role;
  if (requiredRole && role !== requiredRole) return { path: getRoleHome(auth), replace: true };
  if (to.name === "admin-permissions" && !isSuperAdmin(auth)) {
    return { name: "admin-review", replace: true };
  }
  if (Number(auth.user?.must_change_password || 0) === 1 && !["admin-account", "teacher-account", "parent-account"].includes(to.name)) {
    return { path: getAuthEntry(auth), replace: true };
  }

  return true;
});

function getAuthEntry(auth) {
  if (Number(auth.user?.must_change_password || 0) !== 1) return getRoleHome(auth);

  const role = auth.role || auth.user?.role;
  const name = auth.user?.username || auth.user?.name || "user";
  if (role === "teacher") return `/teacher/${encodeURIComponent(name)}/account`;
  if (role === "parent") return `/parent/${encodeURIComponent(name)}/account`;
  return "/admin/account";
}

function isSuperAdmin(auth) {
  const user = auth?.user || {};
  return user.username === "admin" || Number(user.is_super || 0) === 1;
}

export default router;

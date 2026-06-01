import { createRouter, createWebHistory } from "vue-router";
import { getAuth, getRoleHome } from "../auth/session";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import AppShell from "../views/AppShell.vue";
import AdminLayout from "../views/admin/AdminLayout.vue";
import AdminOverviewView from "../views/admin/AdminOverviewView.vue";
import AdminUsersView from "../views/admin/AdminUsersView.vue";
import AdminScheduleView from "../views/admin/AdminScheduleView.vue";
import AdminPermissionsView from "../views/admin/AdminPermissionsView.vue";
import TeacherView from "../views/TeacherView.vue";
import ParentView from "../views/ParentView.vue";

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
          { path: "users", name: "admin-users", component: AdminUsersView, meta: { role: "admin" } },
          { path: "audit", redirect: { name: "admin-permissions" } },
          { path: "schedule", name: "admin-schedule", component: AdminScheduleView, meta: { role: "admin" } },
          { path: "courses", redirect: { name: "admin-schedule" } },
          { path: "permissions", name: "admin-permissions", component: AdminPermissionsView, meta: { role: "admin" } },
        ],
      },
      { path: "admin/:name", redirect: { name: "admin-overview" } },
      { path: "dashboard", redirect: { name: "admin-overview" } },
      { path: "teacher/:name?", name: "teacher", component: TeacherView, meta: { role: "teacher", label: "老师消课" } },
      { path: "parent/:name?", name: "parent", component: ParentView, meta: { role: "parent", label: "家长查看" } },
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
    if (auth && (to.name === "login" || to.name === "register")) return { path: getRoleHome(auth), replace: true };
    return true;
  }

  if (!auth) return { path: "/login", replace: true };

  const requiredRole = to.meta.role;
  const role = auth.role || auth.user?.role;
  if (requiredRole && role !== requiredRole) return { path: getRoleHome(auth), replace: true };

  return true;
});

export default router;

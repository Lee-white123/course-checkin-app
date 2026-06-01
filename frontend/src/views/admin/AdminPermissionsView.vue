<template>
  <div class="permission-page">
    <el-card shadow="never">
      <template #header>
        <strong>老师审核</strong>
      </template>

      <div class="audit-toolbar">
        <el-input
          v-model="auditSearchDraft"
          clearable
          placeholder="按老师姓名、账号、手机号或状态查找"
          @keyup.enter="applyAuditSearch"
        />
        <el-button type="primary" @click="applyAuditSearch">查找</el-button>
        <el-button @click="resetAuditSearch">重置</el-button>
      </div>

      <el-table :data="pagedAuditTeacherAccounts" empty-text="暂无老师账号">
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="name" label="姓名" min-width="110" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column label="状态" width="140">
          <template #default="{ row }">
            <el-tag :type="teacherStatusTagType(row.teacher_status)">
              {{ teacherStatusLabel(row.teacher_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="账号审核" width="130" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.teacher_status !== '启用'"
              class="action-button"
              type="primary"
              plain
              @click="setTeacherStatus(row, '启用')"
            >
              审核通过
            </el-button>
            <span v-else class="muted-text">-</span>
          </template>
        </el-table-column>
        <el-table-column label="账号停用" width="130" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.teacher_status !== '禁用'"
              class="action-button"
              type="danger"
              plain
              @click="setTeacherStatus(row, '禁用')"
            >
              停用账号
            </el-button>
            <span v-else class="muted-text">-</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <div v-if="filteredAuditTeacherAccounts.length > permissionPageSize" class="compact-pagination">
          <el-button :disabled="auditPage <= 1" @click="changePage('audit', -1)">上一页</el-button>
          <el-input-number
            v-model="auditPage"
            class="page-input"
            :controls="false"
            :min="1"
            :max="auditTotalPages"
            @change="normalizePage('audit')"
          />
          <span class="page-total">/ {{ auditTotalPages }}</span>
          <el-button :disabled="auditPage >= auditTotalPages" @click="changePage('audit', 1)">下一页</el-button>
        </div>
      </div>
    </el-card>

    <el-card shadow="never">
      <template #header>
        <strong>老师科目任命</strong>
      </template>

      <el-row :gutter="18">
        <el-col :xs="24" :lg="10">
          <el-form :model="subjectForm" label-position="top">
            <el-form-item label="选择已审核老师账号">
              <el-select
                v-model="subjectForm.teacher_id"
                class="full"
                filterable
                placeholder="请选择已审核老师账号"
              >
                <el-option
                  v-for="item in approvedTeacherAccounts"
                  :key="item.id"
                  :label="teacherOptionLabel(item)"
                  :value="Number(item.related_id)"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="教学科目">
              <el-checkbox-group v-model="subjectForm.subjects" class="subject-checks">
                <el-checkbox-button v-for="item in subjectOptions" :key="item" :label="item" :value="item" />
              </el-checkbox-group>
            </el-form-item>
            <el-button type="primary" @click="saveTeacherSubjects">保存教学科目</el-button>
          </el-form>
        </el-col>

        <el-col :xs="24" :lg="14">
          <el-table :data="pagedSubjectTeacherAccounts" empty-text="暂无老师账号">
            <el-table-column prop="username" label="账号" min-width="120" />
            <el-table-column prop="name" label="姓名" min-width="110" />
            <el-table-column label="状态" width="140">
              <template #default="{ row }">
                <el-tag :type="teacherStatusTagType(row.teacher_status)">
                  {{ teacherStatusLabel(row.teacher_status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="当前科目" min-width="180">
              <template #default="{ row }">
                <span>{{ row.subject || "未任命" }}</span>
              </template>
            </el-table-column>
            <el-table-column label="职务" width="130">
              <template #default="{ row }">
                <el-tag :type="Number(row.is_admin || 0) === 1 ? 'info' : 'success'">
                  {{ Number(row.is_admin || 0) === 1 ? "普通管理员" : "老师" }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-bar">
            <div v-if="sortedSubjectTeacherAccounts.length > permissionPageSize" class="compact-pagination">
              <el-button :disabled="subjectPage <= 1" @click="changePage('subject', -1)">上一页</el-button>
              <el-input-number
                v-model="subjectPage"
                class="page-input"
                :controls="false"
                :min="1"
                :max="subjectTotalPages"
                @change="normalizePage('subject')"
              />
              <span class="page-total">/ {{ subjectTotalPages }}</span>
              <el-button :disabled="subjectPage >= subjectTotalPages" @click="changePage('subject', 1)">下一页</el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card v-if="isSuperAdmin" shadow="never">
      <template #header>
        <strong>普通管理员任命</strong>
      </template>

      <el-row :gutter="18">
        <el-col :xs="24" :lg="10">
          <el-form :model="adminForm" label-position="top">
            <el-form-item label="选择已审核老师账号">
              <el-select v-model="adminForm.username" class="full" filterable placeholder="请选择已审核老师账号">
                <el-option
                  v-for="item in appointableTeacherAccounts"
                  :key="item.id"
                  :label="`${item.name}（${item.username}）`"
                  :value="item.username"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="管理员显示名称">
              <el-input v-model="adminForm.name" placeholder="可选，默认使用老师姓名" />
            </el-form-item>
            <el-button type="primary" @click="appointAdmin">任命为普通管理员</el-button>
          </el-form>
        </el-col>

        <el-col :xs="24" :lg="14">
          <el-table :data="pagedAdminRows" empty-text="暂无管理员">
            <el-table-column prop="username" label="账号" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column label="权限" width="120">
              <template #default="{ row }">
                <el-tag :type="Number(row.is_super) === 1 || row.username === 'admin' ? 'danger' : 'info'">
                  {{ Number(row.is_super) === 1 || row.username === "admin" ? "超级管理员" : "普通管理员" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="登录限制" width="150">
              <template #default="{ row }">
                <el-tag v-if="Number(row.login_locked || 0) === 1" type="danger">已限制</el-tag>
                <span v-else class="muted-text">正常</span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="任命时间" min-width="160" />
            <el-table-column label="操作" width="210">
              <template #default="{ row }">
                <el-button
                  v-if="Number(row.login_locked || 0) === 1"
                  type="warning"
                  plain
                  @click="unlockLogin('admin', row.id)"
                >
                  解除限制
                </el-button>
                <el-button
                  v-if="row.username !== 'admin' && Number(row.is_super || 0) !== 1"
                  type="danger"
                  plain
                  @click="revokeAdmin(row)"
                >
                  撤销权限
                </el-button>
                <span v-else class="muted-text">不可撤销</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-bar">
            <div v-if="sortedAdminRows.length > permissionPageSize" class="compact-pagination">
              <el-button :disabled="adminPage <= 1" @click="changePage('admin', -1)">上一页</el-button>
              <el-input-number
                v-model="adminPage"
                class="page-input"
                :controls="false"
                :min="1"
                :max="adminTotalPages"
                @change="normalizePage('admin')"
              />
              <span class="page-total">/ {{ adminTotalPages }}</span>
              <el-button :disabled="adminPage >= adminTotalPages" @click="changePage('admin', 1)">下一页</el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { api } from "../../api/client";
import { getAuth } from "../../auth/session";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["state-updated"]);
const subjectOptions = ["语文", "数学", "英语", "物理", "化学"];
const permissionPageSize = 5;
const auth = getAuth();
const currentUser = computed(() => auth?.user || {});
const isSuperAdmin = computed(() => currentUser.value.username === "admin" || Number(currentUser.value.is_super || 0) === 1);
const operator = computed(() => ({
  role: "admin",
  username: currentUser.value.username,
  is_super: isSuperAdmin.value ? 1 : Number(currentUser.value.is_super || 0),
}));

const adminForm = reactive({ username: "", name: "" });
const subjectForm = reactive({ teacher_id: "", subjects: [] });
const auditSearchDraft = ref("");
const auditKeyword = ref("");
const auditPage = ref(1);
const subjectPage = ref(1);
const adminPage = ref(1);
const teacherAccounts = computed(() =>
  (props.state.teacherAccounts || []).filter((item) => Number(item.related_id || 0) > 0)
);
const sortedAuditTeacherAccounts = computed(() =>
  [...teacherAccounts.value].sort((a, b) => {
    const statusDiff = auditStatusOrder(a.teacher_status) - auditStatusOrder(b.teacher_status);
    if (statusDiff !== 0) return statusDiff;
    return Number(b.id || 0) - Number(a.id || 0);
  })
);
const filteredAuditTeacherAccounts = computed(() => {
  const keyword = auditKeyword.value.trim().toLowerCase();
  if (!keyword) return sortedAuditTeacherAccounts.value;
  return sortedAuditTeacherAccounts.value.filter((row) =>
    [row.username, row.name, row.phone, teacherStatusLabel(row.teacher_status)].some((value) =>
      String(value || "").toLowerCase().includes(keyword)
    )
  );
});
const sortedSubjectTeacherAccounts = computed(() =>
  [...teacherAccounts.value].sort((a, b) => {
    const statusDiff = subjectAssignmentOrder(a) - subjectAssignmentOrder(b);
    if (statusDiff !== 0) return statusDiff;
    return Number(b.id || 0) - Number(a.id || 0);
  })
);
const sortedAdminRows = computed(() =>
  [...(props.state.admins || [])].sort((a, b) => {
    const statusDiff = auditStatusOrder(a.status) - auditStatusOrder(b.status);
    if (statusDiff !== 0) return statusDiff;
    return Number(b.id || 0) - Number(a.id || 0);
  })
);
const pagedAuditTeacherAccounts = computed(() => paginate(filteredAuditTeacherAccounts.value, auditPage.value));
const pagedSubjectTeacherAccounts = computed(() => paginate(sortedSubjectTeacherAccounts.value, subjectPage.value));
const pagedAdminRows = computed(() => paginate(sortedAdminRows.value, adminPage.value));
const auditTotalPages = computed(() => getTotalPages(filteredAuditTeacherAccounts.value.length));
const subjectTotalPages = computed(() => getTotalPages(sortedSubjectTeacherAccounts.value.length));
const adminTotalPages = computed(() => getTotalPages(sortedAdminRows.value.length));
const approvedTeacherAccounts = computed(() =>
  teacherAccounts.value.filter((item) => item.teacher_status === "启用")
);
const appointableTeacherAccounts = computed(() =>
  approvedTeacherAccounts.value.filter((item) => Number(item.is_admin || 0) !== 1)
);
const selectedTeacher = computed(() =>
  teacherAccounts.value.find((item) => Number(item.related_id) === Number(subjectForm.teacher_id))
);

watch(
  selectedTeacher,
  (teacher) => {
    subjectForm.subjects = splitSubjects(teacher?.subject);
  }
);

watch([auditTotalPages, subjectTotalPages, adminTotalPages], () => {
  normalizePage("audit");
  normalizePage("subject");
  normalizePage("admin");
});

function applyAuditSearch() {
  auditKeyword.value = auditSearchDraft.value.trim();
  auditPage.value = 1;
}

function resetAuditSearch() {
  auditSearchDraft.value = "";
  auditKeyword.value = "";
  auditPage.value = 1;
}

function splitSubjects(value) {
  return String(value || "")
    .split(/[、,，/／;；\s]+/)
    .map((item) => item.trim())
    .filter((item) => subjectOptions.includes(item));
}

function teacherStatusLabel(status) {
  if (status === "待审核") return "待审核";
  if (status === "禁用") return "需注销";
  return "已审核(正常)";
}

function teacherStatusTagType(status) {
  if (status === "待审核") return "warning";
  if (status === "禁用") return "danger";
  return "success";
}

function teacherOptionLabel(item) {
  const subject = item.subject ? `｜${item.subject}` : "｜未任命科目";
  return `${item.name}（${item.username}）｜${teacherStatusLabel(item.teacher_status)}${subject}`;
}

function paginate(rows, page) {
  const start = (page - 1) * permissionPageSize;
  return rows.slice(start, start + permissionPageSize);
}

function getTotalPages(total) {
  return Math.max(1, Math.ceil(total / permissionPageSize));
}

function getPageState(type) {
  const map = {
    audit: { page: auditPage, total: auditTotalPages },
    subject: { page: subjectPage, total: subjectTotalPages },
    admin: { page: adminPage, total: adminTotalPages },
  };
  return map[type];
}

function normalizePage(type) {
  const state = getPageState(type);
  const value = Number(state.page.value || 1);
  state.page.value = Math.min(Math.max(Math.trunc(value), 1), state.total.value);
}

function changePage(type, delta) {
  const state = getPageState(type);
  state.page.value += delta;
  normalizePage(type);
}

function auditStatusOrder(status) {
  if (status === "待审核") return 0;
  if (status === "禁用") return 1;
  return 2;
}

function subjectAssignmentOrder(item) {
  if (item.teacher_status === "待审核") return 0;
  if (!item.subject) return 1;
  if (item.teacher_status === "禁用") return 2;
  return 3;
}

function resetAdmin() {
  Object.assign(adminForm, { username: "", name: "" });
}

async function reloadBootstrap() {
  emit("state-updated", await api("/api/bootstrap"));
}

async function setTeacherStatus(row, status) {
  try {
    await api("/api/teachers/status", {
      method: "PUT",
      body: JSON.stringify({
        teacher_id: row.related_id,
        status,
        operator: operator.value,
      }),
    });
    await reloadBootstrap();
    ElMessage.success(status === "启用" ? "已通过老师审核" : "已停用老师账号");
  } catch (error) {
    ElMessage.error(error.message);
  }
}

async function unlockLogin(role, id) {
  try {
    await api("/api/auth/unlock", {
      method: "POST",
      body: JSON.stringify({
        role,
        id,
        operator: operator.value,
      }),
    });
    await reloadBootstrap();
    ElMessage.success("已解除登录限制");
  } catch (error) {
    ElMessage.error(error.message);
  }
}

async function saveTeacherSubjects() {
  if (!subjectForm.teacher_id) {
    ElMessage.warning("请先选择一个已注册的老师账号");
    return;
  }
  if (selectedTeacher.value?.teacher_status !== "启用") {
    ElMessage.warning("请先通过老师审核，再任命教学科目");
    return;
  }
  if (!subjectForm.subjects.length) {
    ElMessage.warning("请至少选择一个教学科目");
    return;
  }

  try {
    await api("/api/teachers/subjects", {
      method: "PUT",
      body: JSON.stringify({
        teacher_id: subjectForm.teacher_id,
        subjects: subjectForm.subjects,
        operator: operator.value,
      }),
    });
    await reloadBootstrap();
    ElMessage.success("已保存老师教学科目");
  } catch (error) {
    ElMessage.error(error.message);
  }
}

async function appointAdmin() {
  if (!adminForm.username) {
    ElMessage.warning("请先选择一个已审核的老师账号");
    return;
  }

  try {
    await api("/api/admins", {
      method: "POST",
      body: JSON.stringify({
        ...adminForm,
        operator: operator.value,
      }),
    });
    resetAdmin();
    await reloadBootstrap();
    ElMessage.success("已任命为普通管理员");
  } catch (error) {
    ElMessage.error(error.message);
  }
}

async function revokeAdmin(row) {
  try {
    await ElMessageBox.confirm(`确定撤销“${row.name}”的管理员权限吗？老师账号本身会保留。`, "确认撤销权限", {
      type: "warning",
      confirmButtonText: "撤销",
      cancelButtonText: "取消",
    });
    await api(`/api/admins?id=${row.id}`, {
      method: "DELETE",
      body: JSON.stringify({ operator: operator.value }),
    });
    await reloadBootstrap();
    ElMessage.success("已撤销管理员权限");
  } catch (error) {
    if (error !== "cancel") ElMessage.error(error.message || "已取消");
  }
}
</script>

<style scoped>
.permission-page {
  display: grid;
  gap: 18px;
}

.full {
  width: 100%;
}

.subject-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.audit-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.audit-toolbar :deep(.el-input) {
  max-width: 360px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 14px;
}

.compact-pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-input {
  width: 72px;
}

.page-total {
  min-width: 36px;
  color: #475569;
}

.action-button {
  min-width: 88px;
}
</style>

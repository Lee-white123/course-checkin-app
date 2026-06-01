<template>
  <div class="admin-module-hero">
    <div>
      <span>管理员端</span>
      <h2>{{ moduleTitle }}</h2>
      <p>{{ moduleDescription }}</p>
    </div>
    <div class="admin-module-metrics">
      <div v-for="metric in moduleMetrics" :key="metric.label">
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.label }}</small>
      </div>
    </div>
  </div>

  <el-card shadow="never">
    <template #header>
      <strong>{{ moduleTitle }}</strong>
    </template>

    <el-alert
      class="section-alert"
      show-icon
      :title="moduleAlert"
      type="info"
    />

    <div class="table-toolbar">
      <el-input
        v-model="searchDraft"
        clearable
        :placeholder="searchPlaceholder"
        @keyup.enter="applySearch"
      />
      <el-select v-if="activeTab === 'teachers'" v-model="teacherStatusFilter" class="toolbar-select" placeholder="老师状态" clearable>
        <el-option label="待审核" value="待审核" />
        <el-option label="已审核(正常)" value="启用" />
        <el-option label="需注销" value="禁用" />
      </el-select>
      <el-select v-if="activeTab === 'teachers'" v-model="teacherLoginFilter" class="toolbar-select" placeholder="登录状态" clearable>
        <el-option label="正常" value="normal" />
        <el-option label="已限制" value="locked" />
      </el-select>
      <el-select v-if="activeTab === 'students'" v-model="studentGradeFilter" class="toolbar-select" placeholder="学生年级" clearable>
        <el-option label="小升初" value="小升初" />
        <el-option label="初一" value="初一" />
        <el-option label="初二" value="初二" />
        <el-option label="初三" value="初三" />
      </el-select>
      <el-select v-if="activeTab === 'students'" v-model="studentLoginFilter" class="toolbar-select" placeholder="家长登录状态" clearable>
        <el-option label="正常" value="normal" />
        <el-option label="已限制" value="locked" />
      </el-select>
      <el-button type="primary" @click="applySearch">查找</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <section v-if="isTeacherMode" class="single-table-section">
        <el-table
          ref="teacherTableRef"
          class="paginated-table"
          :data="pagedTeacherRows"
          empty-text="暂无老师"
          stripe
          fit
          :style="{ '--table-visible-rows': pageSize }"
        >
          <el-table-column label="编号" width="80">
            <template #default="{ $index }">{{ rowNumber(teacherPage, $index) }}</template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" min-width="110" />
          <el-table-column prop="username" label="登录账号" min-width="120" />
          <el-table-column prop="subject" label="授课科目" min-width="140" />
          <el-table-column prop="phone" label="电话" min-width="130" />
          <el-table-column label="状态" width="130">
            <template #default="{ row }">
              <el-tag :type="teacherStatusTagType(row.status)">{{ teacherStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="schedule_count" label="排课数" width="90" />
          <el-table-column prop="record_count" label="已消课" width="90" />
          <el-table-column label="登录状态" width="130">
            <template #default="{ row }">
              <el-tag v-if="Number(row.login_locked || 0) === 1" type="danger">已限制</el-tag>
              <span v-else class="muted-text">正常</span>
            </template>
          </el-table-column>
          <el-table-column label="重置密码" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.account_id"
                class="action-button"
                plain
                @click="openResetPassword(row, 'teacher')"
              >
                重置密码
              </el-button>
              <span v-else class="muted-text">-</span>
            </template>
          </el-table-column>
          <el-table-column label="解除限制" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="Number(row.login_locked || 0) === 1"
                class="action-button"
                type="warning"
                plain
                @click="unlockTeacher(row)"
              >
                解除限制
              </el-button>
              <span v-else class="muted-text">-</span>
            </template>
          </el-table-column>
          <el-table-column label="注销账号" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                class="action-button"
                type="danger"
                plain
                @click="remove('/api/teachers', row.id, row.name, '注销')"
              >
                注销
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-bar">
          <CompactPagination
            v-model="teacherPage"
            :total="filteredTeacherRows.length"
            :page-size="pageSize"
          />
        </div>
    </section>

    <section v-if="isStudentMode" class="single-table-section">
        <el-table
          ref="studentTableRef"
          class="paginated-table"
          :data="pagedStudentRows"
          empty-text="暂无学生"
          stripe
          fit
          :style="{ '--table-visible-rows': pageSize }"
        >
          <el-table-column label="编号" width="80">
            <template #default="{ $index }">{{ rowNumber(studentPage, $index) }}</template>
          </el-table-column>
          <el-table-column prop="name" label="学生" min-width="110" />
          <el-table-column prop="grade" label="年级" min-width="90" />
          <el-table-column prop="parent_name" label="家长" min-width="120" />
          <el-table-column prop="parent_username" label="家长账号" min-width="120" />
          <el-table-column prop="parent_phone" label="家长电话" min-width="130" />
          <el-table-column label="当前安排课时" min-width="120">
            <template #default="{ row }">{{ formatHours(row.scheduled_hours) }}</template>
          </el-table-column>
          <el-table-column label="已消课时" min-width="110">
            <template #default="{ row }">{{ formatHours(row.consumed_hours) }}</template>
          </el-table-column>
          <el-table-column label="登录状态" width="130">
            <template #default="{ row }">
              <el-tag v-if="Number(row.parent_login_locked || 0) === 1" type="danger">已限制</el-tag>
              <span v-else class="muted-text">正常</span>
            </template>
          </el-table-column>
          <el-table-column label="重置密码" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.parent_account_id"
                class="action-button"
                plain
                @click="openResetPassword(row, 'parent')"
              >
                重置密码
              </el-button>
              <span v-else class="muted-text">-</span>
            </template>
          </el-table-column>
          <el-table-column label="解除限制" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="Number(row.parent_login_locked || 0) === 1"
                class="action-button"
                type="warning"
                plain
                @click="unlockParent(row)"
              >
                解除限制
              </el-button>
              <span v-else class="muted-text">-</span>
            </template>
          </el-table-column>
          <el-table-column label="注销账号" width="120" fixed="right">
            <template #default="{ row }">
              <el-button
                class="action-button"
                type="danger"
                plain
                @click="remove('/api/students', row.id, row.name, '注销')"
              >
                注销
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-bar">
          <CompactPagination
            v-model="studentPage"
            :total="filteredStudentRows.length"
            :page-size="pageSize"
          />
        </div>
    </section>
  </el-card>

  <el-dialog v-model="resetDialogVisible" title="重置密码" width="520px">
    <el-alert
      type="warning"
      show-icon
      :closable="false"
      title="管理员只能重置密码，不能查看原密码。请把临时密码告知用户，并提醒用户登录后到“我的账户”修改密码。"
    />
    <el-form class="reset-password-form" label-position="top" @submit.prevent>
      <el-form-item label="目标账号">
        <el-input :model-value="resetForm.label" disabled />
      </el-form-item>
      <el-form-item label="临时密码" :error="resetErrors.new_password">
        <div class="reset-password-row">
          <el-input v-model="resetForm.new_password" show-password placeholder="8-32 位，可用英文、数字和符号 *_@" />
          <el-button @click="generateResetPassword">重新生成</el-button>
        </div>
      </el-form-item>
      <el-form-item label="确认临时密码" :error="resetErrors.confirm_password">
        <el-input v-model="resetForm.confirm_password" show-password placeholder="请再次输入临时密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="resetDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="resetSaving" @click="submitResetPassword">确认重置</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { api } from "../../api/client";
import CompactPagination from "../../components/CompactPagination.vue";
import { formatHours } from "../../utils/format";
import { getAuth } from "../../auth/session";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: "teachers",
  },
});

const emit = defineEmits(["state-updated"]);
const route = useRoute();
const router = useRouter();
const pageSize = 10;
const activeTab = ref(props.mode === "students" ? "students" : "teachers");
const searchDraft = ref(String(route.query.keyword || ""));
const keyword = ref(String(route.query.keyword || ""));
const teacherStatusFilter = ref(String(route.query.teacherStatus || ""));
const teacherLoginFilter = ref(String(route.query.teacherLogin || ""));
const studentGradeFilter = ref(String(route.query.studentGrade || ""));
const studentLoginFilter = ref(String(route.query.studentLogin || ""));
const teacherPage = ref(toPositivePage(route.query.teacherPage));
const studentPage = ref(toPositivePage(route.query.studentPage));
const teacherTableRef = ref(null);
const studentTableRef = ref(null);
const resetDialogVisible = ref(false);
const resetSaving = ref(false);
const resetForm = reactive({
  role: "",
  id: 0,
  label: "",
  new_password: "",
  confirm_password: "",
});
const resetErrors = reactive({});

const isTeacherMode = computed(() => activeTab.value === "teachers");
const isStudentMode = computed(() => activeTab.value === "students");

const teacherAccountMap = computed(() => {
  const map = new Map();
  for (const item of props.state.teacherAccounts || []) {
    map.set(Number(item.related_id), item);
  }
  return map;
});

const parentAccountMap = computed(() => {
  const map = new Map();
  for (const item of props.state.parentAccounts || []) {
    map.set(Number(item.related_id), item);
  }
  return map;
});

const auth = getAuth();
const operator = {
  role: "admin",
  username: auth?.user?.username,
  is_super: Number(auth?.user?.is_super || 0),
};

const searchPlaceholder = computed(() =>
  activeTab.value === "teachers"
    ? "按老师姓名、账号、电话或科目查找"
    : "按学生姓名、家长姓名、账号或电话查找"
);

const moduleTitle = computed(() => (isTeacherMode.value ? "老师管理" : "学生管理"));
const moduleDescription = computed(() =>
  isTeacherMode.value
    ? "查看老师账号、审核状态、授课科目和登录限制，处理密码重置、解除限制与账号注销。"
    : "查看家长账号和学生信息，核对学生年级、课程安排、登录限制与账号注销。"
);
const moduleAlert = computed(() =>
  isTeacherMode.value
    ? "老师信息由老师注册和后台审核产生；这里主要负责查看、核对、重置密码、注销和解除登录限制。"
    : "学生信息由家长注册产生；这里主要负责查看家长账号、学生资料、重置密码、注销和解除登录限制。"
);

const teacherRows = computed(() =>
  (props.state.teachers || []).map((teacher) => {
    const account = teacherAccountMap.value.get(Number(teacher.id));
    return {
      ...teacher,
      account_id: account?.id,
      username: account?.username || "未绑定",
      login_locked: account?.login_locked || 0,
      failed_login_count: account?.failed_login_count || 0,
      schedule_count: (props.state.schedules || []).filter((item) => Number(item.teacher_id) === Number(teacher.id)).length,
      record_count: (props.state.records || []).filter((item) => Number(item.teacher_id) === Number(teacher.id)).length,
    };
  })
);

const studentRows = computed(() =>
  (props.state.students || []).map((student) => {
    const parentAccount = parentAccountMap.value.get(Number(student.id));
    const studentSchedules = (props.state.schedules || []).filter((item) => Number(item.student_id) === Number(student.id));
    const studentRecords = (props.state.records || []).filter((item) => Number(item.student_id) === Number(student.id));
    return {
      ...student,
      parent_account_id: parentAccount?.id,
      parent_username: parentAccount?.username || "未绑定",
      parent_login_locked: parentAccount?.login_locked || 0,
      parent_failed_login_count: parentAccount?.failed_login_count || 0,
      scheduled_hours: sumHours(studentSchedules.filter((item) => item.status === "待上课")),
      consumed_hours: sumHours(studentRecords),
    };
  })
);

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase());

const filteredTeacherRows = computed(() => {
  return teacherRows.value.filter((row) => {
    const keywordMatched =
      !normalizedKeyword.value ||
      [row.name, row.username, row.phone, row.subject, teacherStatusLabel(row.status)]
        .some((value) => String(value || "").toLowerCase().includes(normalizedKeyword.value));
    const statusMatched = !teacherStatusFilter.value || row.status === teacherStatusFilter.value;
    const loginMatched =
      !teacherLoginFilter.value ||
      (teacherLoginFilter.value === "locked"
        ? Number(row.login_locked || 0) === 1
        : Number(row.login_locked || 0) !== 1);
    return keywordMatched && statusMatched && loginMatched;
  });
});

const filteredStudentRows = computed(() => {
  return studentRows.value.filter((row) => {
    const keywordMatched =
      !normalizedKeyword.value ||
      [row.name, row.grade, row.parent_name, row.parent_username, row.parent_phone]
        .some((value) => String(value || "").toLowerCase().includes(normalizedKeyword.value));
    const gradeMatched = !studentGradeFilter.value || row.grade === studentGradeFilter.value;
    const loginMatched =
      !studentLoginFilter.value ||
      (studentLoginFilter.value === "locked"
        ? Number(row.parent_login_locked || 0) === 1
        : Number(row.parent_login_locked || 0) !== 1);
    return keywordMatched && gradeMatched && loginMatched;
  });
});

const pagedTeacherRows = computed(() => paginate(filteredTeacherRows.value, teacherPage.value));
const pagedStudentRows = computed(() => paginate(filteredStudentRows.value, studentPage.value));
const teacherPendingCount = computed(() => teacherRows.value.filter((row) => row.status === "待审核").length);
const lockedTeacherCount = computed(() => teacherRows.value.filter((row) => Number(row.login_locked || 0) === 1).length);
const parentAccountCount = computed(() => (props.state.parentAccounts || []).length);
const lockedParentCount = computed(() => studentRows.value.filter((row) => Number(row.parent_login_locked || 0) === 1).length);
const moduleMetrics = computed(() =>
  isTeacherMode.value
    ? [
        { label: "老师账号", value: teacherRows.value.length },
        { label: "待审核账号", value: teacherPendingCount.value },
        { label: "受限账号", value: lockedTeacherCount.value },
      ]
    : [
        { label: "家长账号", value: parentAccountCount.value },
        { label: "受限账号", value: lockedParentCount.value },
      ]
);

watch(
  () => props.mode,
  (mode) => {
    activeTab.value = mode === "students" ? "students" : "teachers";
  },
  { immediate: true }
);

watch([keyword, teacherStatusFilter, teacherLoginFilter, studentGradeFilter, studentLoginFilter, activeTab], () => {
  teacherPage.value = 1;
  studentPage.value = 1;
});

watch(
  [activeTab, keyword, teacherStatusFilter, teacherLoginFilter, studentGradeFilter, studentLoginFilter, teacherPage, studentPage],
  syncUsersQuery
);

watch(
  () => [filteredTeacherRows.value.length, filteredStudentRows.value.length],
  () => {
    teacherPage.value = clampPage(teacherPage.value, filteredTeacherRows.value.length);
    studentPage.value = clampPage(studentPage.value, filteredStudentRows.value.length);
  }
);

watch(
  [activeTab, teacherPage, studentPage, pagedTeacherRows, pagedStudentRows],
  refreshUsersTableLayout,
  { flush: "post" }
);

async function refreshUsersTableLayout() {
  await nextTick();
  teacherTableRef.value?.doLayout?.();
  studentTableRef.value?.doLayout?.();
}

function applySearch() {
  keyword.value = searchDraft.value.trim();
}

function resetSearch() {
  searchDraft.value = "";
  keyword.value = "";
  teacherStatusFilter.value = "";
  teacherLoginFilter.value = "";
  studentGradeFilter.value = "";
  studentLoginFilter.value = "";
}

function paginate(rows, page) {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

function rowNumber(page, index) {
  return (page - 1) * pageSize + index + 1;
}

function clampPage(page, total) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(Math.max(Math.trunc(Number(page || 1)), 1), totalPages);
}

function toPositivePage(value) {
  const number = Math.trunc(Number(value || 1));
  return Number.isFinite(number) && number > 0 ? number : 1;
}

function syncUsersQuery() {
  router.replace({
    query: cleanQuery({
      ...route.query,
      tab: undefined,
      keyword: keyword.value || undefined,
      teacherStatus: isTeacherMode.value ? teacherStatusFilter.value || undefined : undefined,
      teacherLogin: isTeacherMode.value ? teacherLoginFilter.value || undefined : undefined,
      studentGrade: isStudentMode.value ? studentGradeFilter.value || undefined : undefined,
      studentLogin: isStudentMode.value ? studentLoginFilter.value || undefined : undefined,
      teacherPage: isTeacherMode.value && teacherPage.value > 1 ? teacherPage.value : undefined,
      studentPage: isStudentMode.value && studentPage.value > 1 ? studentPage.value : undefined,
    }),
  });
}

function cleanQuery(query) {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== ""));
}

function sumHours(rows) {
  return rows.reduce((total, item) => total + Number(item.lesson_hours || 0), 0);
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

async function unlockTeacher(row) {
  if (!row.account_id) {
    ElMessage.warning("该老师还没有绑定登录账号");
    return;
  }
  try {
    await api("/api/auth/unlock", {
      method: "POST",
      body: JSON.stringify({
        role: "teacher",
        id: row.account_id,
        operator,
      }),
    });
    emit("state-updated", await api("/api/bootstrap"));
    ElMessage.success("已解除登录限制");
  } catch (error) {
    ElMessage.error(error.message);
  }
}

async function unlockParent(row) {
  if (!row.parent_account_id) {
    ElMessage.warning("该学生还没有绑定家长登录账号");
    return;
  }
  try {
    await api("/api/auth/unlock", {
      method: "POST",
      body: JSON.stringify({
        role: "parent",
        id: row.parent_account_id,
        operator,
      }),
    });
    emit("state-updated", await api("/api/bootstrap"));
    ElMessage.success("已解除登录限制");
  } catch (error) {
    ElMessage.error(error.message);
  }
}

function openResetPassword(row, role) {
  clearResetErrors();
  if (role === "teacher") {
    if (!row.account_id) {
      ElMessage.warning("该老师还没有绑定登录账号");
      return;
    }
    resetForm.role = "teacher";
    resetForm.id = row.account_id;
    resetForm.label = `${row.name}（${row.username}）`;
  } else {
    if (!row.parent_account_id) {
      ElMessage.warning("该学生还没有绑定家长登录账号");
      return;
    }
    resetForm.role = "parent";
    resetForm.id = row.parent_account_id;
    resetForm.label = `${row.parent_name || row.name}（${row.parent_username}）`;
  }
  generateResetPassword();
  resetDialogVisible.value = true;
}

function generateResetPassword() {
  const password = createTempPassword();
  resetForm.new_password = password;
  resetForm.confirm_password = password;
}

async function submitResetPassword() {
  if (!validateResetPassword()) return;
  resetSaving.value = true;
  try {
    await api("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        role: resetForm.role,
        id: resetForm.id,
        new_password: resetForm.new_password,
        confirm_password: resetForm.confirm_password,
      }),
    });
    emit("state-updated", await api("/api/bootstrap"));
    resetDialogVisible.value = false;
    ElMessage.success("密码已重置，请将临时密码告知用户");
  } catch (error) {
    ElMessage.error(error.message);
  } finally {
    resetSaving.value = false;
  }
}

function validateResetPassword() {
  clearResetErrors();
  if (!resetForm.new_password) resetErrors.new_password = "请填写临时密码";
  if (!resetForm.confirm_password) resetErrors.confirm_password = "请再次输入临时密码";

  const invalidChars = getInvalidPasswordChars(resetForm.new_password);
  if (invalidChars.length) {
    resetErrors.new_password = `密码不符合，不能出现 ${invalidChars.join("、")}`;
  } else if (resetForm.new_password && !isValidPassword(resetForm.new_password)) {
    resetErrors.new_password = "密码需为 8-32 位，可使用英文、数字和符号 *_@，不能全部是符号";
  }
  if (resetForm.new_password && resetForm.confirm_password && resetForm.new_password !== resetForm.confirm_password) {
    resetErrors.confirm_password = "两次输入的临时密码不一致";
  }

  return !Object.values(resetErrors).some(Boolean);
}

function isValidPassword(value) {
  const password = String(value || "");
  return /^[A-Za-z0-9*_@]{8,32}$/.test(password) && /[A-Za-z0-9]/.test(password);
}

function getInvalidPasswordChars(value) {
  return [...new Set([...String(value || "")].filter((char) => !/[A-Za-z0-9*_@]/.test(char)))];
}

function createTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let password = "Ck";
  for (let index = 0; index < 8; index += 1) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function clearResetErrors() {
  for (const key of Object.keys(resetErrors)) delete resetErrors[key];
}

async function remove(path, id, label, actionLabel) {
  try {
    await ElMessageBox.confirm(
      `确定要${actionLabel}“${label}”吗？相关排课、消课记录和登录账号也可能一起删除。`,
      `确认${actionLabel}`,
      {
        type: "warning",
        confirmButtonText: actionLabel,
        cancelButtonText: "取消",
      }
    );
    const payload = await api(`${path}?id=${id}`, { method: "DELETE" });
    emit("state-updated", payload);
    ElMessage.success(`已${actionLabel}`);
  } catch (error) {
    if (error !== "cancel") ElMessage.error(error.message || "已取消");
  }
}
</script>

<style scoped>
.table-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-start;
  margin: 12px 0 14px;
}

.table-toolbar :deep(.el-input) {
  max-width: 360px;
}

.toolbar-select {
  width: 168px;
}

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.action-button {
  min-width: 88px;
}

.reset-password-form {
  display: grid;
  gap: 2px;
  margin-top: 16px;
}

.reset-password-row {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) auto;
  width: 100%;
}

@media (max-width: 760px) {
  .table-toolbar {
    align-items: stretch;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .table-toolbar :deep(.el-input),
  .toolbar-select {
    max-width: none;
    width: 100%;
  }

  .table-toolbar :deep(.el-input) {
    grid-column: 1 / -1;
  }

  .reset-password-row {
    grid-template-columns: 1fr;
  }
}

.admin-module-hero {
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0%, #f2f7ff 100%);
  border: 1px solid #dbe7f5;
  border-radius: 14px;
  display: flex;
  gap: 18px;
  justify-content: space-between;
  margin-bottom: 18px;
  padding: 22px 24px;
}

.admin-module-hero span {
  color: #246bfe;
  font-size: 13px;
  font-weight: 700;
}

.admin-module-hero h2 {
  font-size: 24px;
  margin: 8px 0;
}

.admin-module-hero p {
  color: var(--muted);
  margin: 0;
}

.admin-module-metrics {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(86px, 1fr));
  min-width: 210px;
}

.admin-module-metrics div {
  background: #ffffff;
  border: 1px solid #dbe7f5;
  border-radius: 10px;
  display: grid;
  gap: 5px;
  justify-items: center;
  padding: 12px;
}

.admin-module-metrics strong {
  font-size: 24px;
}

.admin-module-metrics small {
  color: var(--muted);
}

@media (max-width: 760px) {
  .admin-module-hero {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

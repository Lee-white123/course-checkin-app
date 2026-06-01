<template>
  <el-card shadow="never">
    <template #header>
      <strong>信息管理</strong>
    </template>

    <el-alert
      class="section-alert"
      show-icon
      title="老师和家长/学生信息由注册产生；后台这里主要负责查看、核对、注销和解除登录限制。"
      type="info"
    />

    <div class="table-toolbar">
      <el-input
        v-model="searchDraft"
        clearable
        :placeholder="searchPlaceholder"
        @keyup.enter="applySearch"
      />
      <el-button type="primary" @click="applySearch">查找</el-button>
      <el-button @click="resetSearch">重置</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="老师信息" name="teachers">
        <el-table :data="pagedTeacherRows" empty-text="暂无老师" stripe fit>
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
          <el-pagination
            v-if="filteredTeacherRows.length > pageSize"
            v-model:current-page="teacherPage"
            background
            layout="prev, pager, next, total"
            :page-size="pageSize"
            :total="filteredTeacherRows.length"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="学生信息" name="students">
        <el-table :data="pagedStudentRows" empty-text="暂无学生" stripe fit>
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
          <el-pagination
            v-if="filteredStudentRows.length > pageSize"
            v-model:current-page="studentPage"
            background
            layout="prev, pager, next, total"
            :page-size="pageSize"
            :total="filteredStudentRows.length"
          />
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { api } from "../../api/client";
import { formatHours } from "../../utils/format";
import { getAuth } from "../../auth/session";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["state-updated"]);
const pageSize = 10;
const activeTab = ref("teachers");
const searchDraft = ref("");
const keyword = ref("");
const teacherPage = ref(1);
const studentPage = ref(1);

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
      scheduled_hours: sumHours(studentSchedules.filter((item) => item.status !== "已消课")),
      consumed_hours: sumHours(studentRecords),
    };
  })
);

const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase());

const filteredTeacherRows = computed(() => {
  if (!normalizedKeyword.value) return teacherRows.value;
  return teacherRows.value.filter((row) =>
    [row.name, row.username, row.phone, row.subject, teacherStatusLabel(row.status)]
      .some((value) => String(value || "").toLowerCase().includes(normalizedKeyword.value))
  );
});

const filteredStudentRows = computed(() => {
  if (!normalizedKeyword.value) return studentRows.value;
  return studentRows.value.filter((row) =>
    [row.name, row.grade, row.parent_name, row.parent_username, row.parent_phone]
      .some((value) => String(value || "").toLowerCase().includes(normalizedKeyword.value))
  );
});

const pagedTeacherRows = computed(() => paginate(filteredTeacherRows.value, teacherPage.value));
const pagedStudentRows = computed(() => paginate(filteredStudentRows.value, studentPage.value));

watch(keyword, () => {
  teacherPage.value = 1;
  studentPage.value = 1;
});

function applySearch() {
  keyword.value = searchDraft.value.trim();
}

function resetSearch() {
  searchDraft.value = "";
  keyword.value = "";
}

function paginate(rows, page) {
  const start = (page - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

function rowNumber(page, index) {
  return (page - 1) * pageSize + index + 1;
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

.pagination-bar {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.action-button {
  min-width: 88px;
}
</style>

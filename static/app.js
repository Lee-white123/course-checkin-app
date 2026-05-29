let state = {
  teachers: [],
  students: [],
  courses: [],
  schedules: [],
  records: [],
  summary: {},
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function statusBadge(status) {
  const cls = status === "已消课" ? "done" : "pending";
  return `<span class="status ${cls}">${status}</span>`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "操作失败");
  }
  return payload;
}

async function loadData() {
  state = await api("/api/bootstrap");
  render();
}

function formToJson(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function fillSelect(selector, rows, labelFn) {
  const select = $(selector);
  select.innerHTML = rows.map((row) => `<option value="${row.id}">${labelFn(row)}</option>`).join("");
}

function deleteButton(type, id, label) {
  return `<button class="danger" type="button" data-delete-type="${type}" data-delete-id="${id}" data-delete-label="${label}">删除</button>`;
}

function renderMetrics() {
  const items = [
    ["老师数量", state.summary.teacher_count || 0],
    ["学生数量", state.summary.student_count || 0],
    ["待上课", state.summary.pending_schedule_count || 0],
    ["已消课", state.summary.completed_schedule_count || 0],
    ["购买课时", state.summary.total_purchased_hours || 0],
    ["剩余课时", state.summary.total_remaining_hours || 0],
  ];
  $("#metrics").innerHTML = items
    .map(([label, value]) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`)
    .join("");
}

function renderDashboardSchedules() {
  $("#dashboardSchedules").innerHTML =
    state.schedules
      .slice(0, 10)
      .map(
        (item) => `
        <tr>
          <td>${item.student_name}</td>
          <td>${item.course_name}</td>
          <td>${item.teacher_name}</td>
          <td>${item.weekday} ${item.start_time}-${item.end_time}</td>
          <td>${item.lesson_hours}</td>
          <td>${statusBadge(item.status)}</td>
        </tr>
      `
      )
      .join("") || `<tr><td colspan="6">暂无课程安排</td></tr>`;
}

function renderSelects() {
  fillSelect("#scheduleForm select[name='student_id']", state.students, (row) => `${row.name}（${row.grade || "未填年级"}）`);
  fillSelect("#scheduleForm select[name='teacher_id']", state.teachers, (row) => `${row.name}（${row.subject || "未填科目"}）`);
  fillSelect("#scheduleForm select[name='course_id']", state.courses, (row) => `${row.name}（${row.hours_per_lesson}课时）`);
  fillSelect("#teacherSelect", state.teachers, (row) => `${row.name}（${row.subject || "老师"}）`);
  fillSelect("#studentSelect", state.students, (row) => `${row.name}（${row.parent_name || "家长未填"}）`);
}

function renderStudentCards() {
  $("#studentBalanceCards").innerHTML =
    state.students
      .map((student) => {
        const remaining = Number(student.purchased_hours) - Number(student.consumed_hours);
        return `
          <article class="student-card">
            <div class="course-title">${student.name} ${student.grade ? `· ${student.grade}` : ""}</div>
            <div class="meta">
              家长：${student.parent_name || "未填写"} ${student.parent_phone || ""}<br />
              已购 ${student.purchased_hours} 课时，已消 ${student.consumed_hours} 课时，剩余 ${remaining} 课时
            </div>
          </article>
        `;
      })
      .join("") || `<div class="empty">暂无学生</div>`;
}

function renderManageCards() {
  $("#teacherCards").innerHTML =
    state.teachers
      .map(
        (teacher) => `
          <article class="manage-card">
            <div>
              <div class="course-title">${teacher.name}</div>
              <div class="meta">科目：${teacher.subject || "未填写"}<br />电话：${teacher.phone || "未填写"}</div>
            </div>
            ${deleteButton("teachers", teacher.id, teacher.name)}
          </article>
        `
      )
      .join("") || `<div class="empty">暂无老师</div>`;

  $("#studentCards").innerHTML =
    state.students
      .map(
        (student) => `
          <article class="manage-card">
            <div>
              <div class="course-title">${student.name}</div>
              <div class="meta">年级：${student.grade || "未填写"}<br />家长：${student.parent_name || "未填写"}</div>
            </div>
            ${deleteButton("students", student.id, student.name)}
          </article>
        `
      )
      .join("") || `<div class="empty">暂无学生</div>`;

  $("#courseCards").innerHTML =
    state.courses
      .map(
        (course) => `
          <article class="manage-card">
            <div>
              <div class="course-title">${course.name}</div>
              <div class="meta">类型：${course.category || "未分类"}<br />单次课时：${course.hours_per_lesson}</div>
            </div>
            ${deleteButton("courses", course.id, course.name)}
          </article>
        `
      )
      .join("") || `<div class="empty">暂无课程</div>`;

  $("#scheduleCards").innerHTML =
    state.schedules
      .map(
        (schedule) => `
          <article class="manage-card">
            <div>
              <div class="course-title">${schedule.student_name} · ${schedule.course_name}</div>
              <div class="meta">${schedule.teacher_name}　${schedule.weekday} ${schedule.start_time}-${schedule.end_time}<br />状态：${schedule.status}</div>
            </div>
            ${deleteButton("schedules", schedule.id, `${schedule.student_name}的${schedule.course_name}`)}
          </article>
        `
      )
      .join("") || `<div class="empty">暂无排课</div>`;
}

function recordHtml(record) {
  return `
    <article class="record-item">
      <div class="course-title">${record.course_name} · ${record.student_name}</div>
      <div class="meta">
        老师：${record.teacher_name}　消课：${record.lesson_hours} 课时　时间：${record.checked_at}<br />
        课堂反馈：${record.feedback || "未填写"}<br />
        错题/备注：${record.wrong_notes || "未填写"}
      </div>
    </article>
  `;
}

function renderRecords() {
  $("#adminRecords").innerHTML = state.records.map(recordHtml).join("") || `<div class="empty">暂无消课记录</div>`;
}

function courseItemHtml(item, withCheckin = false) {
  const form = withCheckin && item.status !== "已消课"
    ? `
      <form class="checkin-form" data-schedule-id="${item.id}">
        <label>消课课时<input name="lesson_hours" type="number" min="0.5" step="0.5" value="${item.lesson_hours}" /></label>
        <label>课堂反馈<textarea name="feedback" rows="2" placeholder="本次学习情况"></textarea></label>
        <label>错题/备注<textarea name="wrong_notes" rows="2" placeholder="错题、薄弱点、课后任务"></textarea></label>
        <button type="submit">打卡消课</button>
      </form>
    `
    : "";
  return `
    <article class="course-item">
      <div>
        <div class="course-title">${item.course_name} · ${item.student_name}</div>
        <div class="meta">
          老师：${item.teacher_name}　类型：${item.course_category || "未分类"}<br />
          时间：${item.weekday} ${item.start_time}-${item.end_time}${item.planned_date ? `　日期：${item.planned_date}` : ""}<br />
          课时：${item.lesson_hours}　备注：${item.remark || "无"}
        </div>
      </div>
      <div>${statusBadge(item.status)}</div>
      ${form}
    </article>
  `;
}

function renderTeacherView() {
  const teacherId = Number($("#teacherSelect").value || state.teachers[0]?.id);
  const rows = state.schedules.filter((item) => item.teacher_id === teacherId);
  $("#teacherSchedules").innerHTML = rows.map((item) => courseItemHtml(item, true)).join("") || `<div class="empty">该老师暂无课程</div>`;
}

function renderParentView() {
  const studentId = Number($("#studentSelect").value || state.students[0]?.id);
  const schedules = state.schedules.filter((item) => item.student_id === studentId);
  const records = state.records.filter((item) => item.student_id === studentId);
  $("#parentSchedules").innerHTML = schedules.map((item) => courseItemHtml(item, false)).join("") || `<div class="empty">该学生暂无课程安排</div>`;
  $("#parentRecords").innerHTML = records.map(recordHtml).join("") || `<div class="empty">该学生暂无上课记录</div>`;
}

function render() {
  renderMetrics();
  renderDashboardSchedules();
  renderSelects();
  renderManageCards();
  renderStudentCards();
  renderRecords();
  renderTeacherView();
  renderParentView();
}

function bindTabs() {
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((item) => item.classList.remove("active"));
      $$(".panel").forEach((item) => item.classList.remove("active"));
      tab.classList.add("active");
      $(`#${tab.dataset.tab}`).classList.add("active");
    });
  });
}

function bindForms() {
  const formConfigs = [
    ["#teacherForm", "/api/teachers", "老师已保存"],
    ["#studentForm", "/api/students", "学生已保存"],
    ["#courseForm", "/api/courses", "课程已保存"],
    ["#scheduleForm", "/api/schedules", "排课已添加"],
  ];

  formConfigs.forEach(([selector, path, message]) => {
    $(selector).addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      try {
        state = await api(path, {
          method: "POST",
          body: JSON.stringify(formToJson(form)),
        });
        form.reset();
        showToast(message);
        render();
      } catch (error) {
        showToast(error.message);
      }
    });
  });

  $("#teacherSchedules").addEventListener("submit", async (event) => {
    if (!event.target.matches(".checkin-form")) return;
    event.preventDefault();
    const scheduleId = event.target.dataset.scheduleId;
    try {
      state = await api(`/api/schedules/${scheduleId}/checkin`, {
        method: "POST",
        body: JSON.stringify(formToJson(event.target)),
      });
      showToast("已完成打卡消课");
      render();
    } catch (error) {
      showToast(error.message);
    }
  });

  $("#admin").addEventListener("click", async (event) => {
    const button = event.target.closest("[data-delete-type]");
    if (!button) return;

    const type = button.dataset.deleteType;
    const id = button.dataset.deleteId;
    const label = button.dataset.deleteLabel;
    const confirmed = window.confirm(`确定要删除“${label}”吗？相关排课和消课记录也可能一起删除。`);
    if (!confirmed) return;

    try {
      state = await api(`/api/${type}?id=${id}`, { method: "DELETE" });
      showToast("已删除");
      render();
    } catch (error) {
      showToast(error.message);
    }
  });

  $("#teacherSelect").addEventListener("change", renderTeacherView);
  $("#studentSelect").addEventListener("change", renderParentView);
}

bindTabs();
bindForms();
loadData().catch((error) => showToast(error.message));

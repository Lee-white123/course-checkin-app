const { cleanText, nowText } = require("../../utils/format");
const { AppError } = require("../../utils/appError");
const userRepository = require("./user.repository");

const TEACHING_SUBJECTS = ["语文", "数学", "英语", "物理", "化学"];

function normalizeSubjects(value) {
  const subjects = Array.isArray(value)
    ? value.map(cleanText).filter(Boolean)
    : String(value || "")
      .split(/[、,，/／;；\s]+/)
      .map(cleanText)
      .filter(Boolean);

  const invalidSubject = subjects.find((subject) => !TEACHING_SUBJECTS.includes(subject));
  if (invalidSubject) {
    throw new AppError(`暂不支持“${invalidSubject}”，教学科目只能选择语文、数学、英语、物理、化学`, 400);
  }

  return [...new Set(subjects)];
}

async function listUsers() {
  return {
    teachers: await userRepository.listTeachers(),
    students: await userRepository.listStudents(),
  };
}

async function createTeacher(input) {
  assertAdminOperator(input.operator, "只有管理员可以新增老师信息");
  const subjects = normalizeSubjects(input.subject);
  const teacherId = await userRepository.createTeacher({
    name: cleanText(input.name),
    phone: cleanText(input.phone),
    status: input.status || "启用",
    created_at: nowText(),
  });

  if (subjects.length) {
    await userRepository.updateTeacherSubject(teacherId, subjects.join("、"));
  }
}

async function createStudent(input) {
  assertAdminOperator(input.operator, "只有管理员可以新增学生信息");
  await userRepository.createStudent({
    name: cleanText(input.name),
    grade: cleanText(input.grade),
    parent_name: cleanText(input.parent_name),
    parent_phone: cleanText(input.parent_phone),
    purchased_hours: Number(input.purchased_hours || 0),
    status: input.status || "启用",
    created_at: nowText(),
  });
}

async function deleteTeacher(input) {
  assertAdminOperator(input.operator, "只有管理员可以注销老师信息");
  await userRepository.deleteTeacher(Number(input.id));
}

async function deleteStudent(input) {
  assertAdminOperator(input.operator, "只有管理员可以注销学生信息");
  await userRepository.deleteStudent(Number(input.id));
}

function assertAdminOperator(operator, message = "只有管理员可以执行该操作") {
  if (operator?.role !== "admin" || !operator?.username) {
    throw new AppError(message, 403);
  }
}

async function updateTeacherSubjects(input) {
  assertAdminOperator(input.operator);

  const teacherId = Number(input.teacher_id || input.teacherId || 0);
  if (!teacherId) {
    throw new AppError("请选择要任命科目的老师", 400);
  }

  const teacher = await userRepository.findTeacherById(teacherId);
  if (!teacher) {
    throw new AppError("老师不存在", 404);
  }
  if (teacher.status !== "启用") {
    throw new AppError("请先通过老师审核，再任命教学科目", 400);
  }

  const subjects = normalizeSubjects(input.subjects);

  if (!subjects.length) {
    throw new AppError("请至少选择一个教学科目", 400);
  }

  await userRepository.updateTeacherSubject(teacherId, subjects.join("、"));

  return {
    teacher_id: teacherId,
    subject: subjects.join("、"),
  };
}

async function updateTeacherStatus(input) {
  assertAdminOperator(input.operator);

  const teacherId = Number(input.teacher_id || input.teacherId || 0);
  if (!teacherId) {
    throw new AppError("请选择要审核的老师", 400);
  }
  if (!await userRepository.findTeacherById(teacherId)) {
    throw new AppError("老师不存在", 404);
  }

  const status = cleanText(input.status);
  if (!["待审核", "启用", "禁用"].includes(status)) {
    throw new AppError("老师状态只能设置为待审核、启用或禁用", 400);
  }

  await userRepository.updateTeacherStatus(teacherId, status);
  return {
    teacher_id: teacherId,
    status,
  };
}

module.exports = {
  createStudent,
  createTeacher,
  deleteStudent,
  deleteTeacher,
  listUsers,
  updateTeacherSubjects,
  updateTeacherStatus,
};

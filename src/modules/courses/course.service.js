const { AppError } = require("../../utils/appError");
const { cleanText, nowText } = require("../../utils/format");
const userRepository = require("../users/user.repository");
const courseRepository = require("./course.repository");
const { getScheduleIssueReasons, resolveScheduleStatus } = require("./schedule-status");

async function listCourseData() {
  return {
    courses: await courseRepository.listCourses(),
    schedules: (await courseRepository.listSchedules()).map((item) => {
      const status = resolveScheduleStatus(item);
      const issueReasons = getScheduleIssueReasons({ ...item, status });
      return {
        ...item,
        status,
        status_reason: issueReasons.join("；"),
      };
    }),
  };
}

function roundToHalfHour(hours) {
  if (hours < 0.5) return 0;
  return Math.round(hours * 2) / 2;
}

function calculateLessonHours(startTime, endTime) {
  const [startHour, startMinute] = String(startTime || "").split(":").map(Number);
  const [endHour, endMinute] = String(endTime || "").split(":").map(Number);
  if ([startHour, startMinute, endHour, endMinute].some((item) => Number.isNaN(item))) return 1;

  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const diffMinutes = end - start;
  if (diffMinutes < 30) return 0;
  return roundToHalfHour(diffMinutes / 60);
}

function normalizeLessonHours(inputValue, fallbackValue) {
  const value = Number(inputValue);
  if (!Number.isFinite(value) || value < 0) return fallbackValue;
  return roundToHalfHour(value);
}

async function getOrCreateCourseId(input) {
  const courseId = Number(input.course_id || 0);
  if (courseId) return courseId;

  const courseName = cleanText(input.course_name);
  const courseCategory = cleanText(input.course_category);
  if (!courseName) {
    throw new AppError("请选择课程科目", 400);
  }
  if (!["一对一", "小班课"].includes(courseCategory)) {
    throw new AppError("请选择课程类型", 400);
  }

  const existingCourse = await courseRepository.findCourseByNameAndCategory(courseName, courseCategory);
  if (existingCourse) return existingCourse.id;

  return courseRepository.createCourse({
    name: courseName,
    category: courseCategory,
    hours_per_lesson: normalizeLessonHours(input.lesson_hours, 1),
    created_at: nowText(),
  });
}

async function createCourse(input) {
  assertAdminOperator(input.operator, "只有管理员可以创建课程");
  const name = cleanText(input.name);
  if (!name) {
    throw new AppError("请填写课程名称", 400);
  }

  await courseRepository.createCourse({
    name,
    category: cleanText(input.category),
    hours_per_lesson: Number(input.hours_per_lesson || 1),
    created_at: nowText(),
  });
}

async function createSchedule(input) {
  assertAdminOperator(input.operator, "只有管理员可以新增排课");
  const studentId = Number(input.student_id);
  const teacherId = Number(input.teacher_id);
  const startTime = cleanText(input.start_time);
  const endTime = cleanText(input.end_time);
  const studentGrade = cleanText(input.student_grade);
  const plannedDate = cleanText(input.planned_date);

  if (!studentId || !teacherId) {
    throw new AppError("请选择学生和老师", 400);
  }
  if (!startTime || !endTime) {
    throw new AppError("请选择开始时间和结束时间", 400);
  }
  if (!plannedDate) {
    throw new AppError("请选择上课日期", 400);
  }

  if (timeToMinutes(endTime) < timeToMinutes(startTime)) {
    throw new AppError("结束时间不能早于开始时间", 400);
  }
  const lessonHours = normalizeLessonHours(input.lesson_hours, calculateLessonHours(startTime, endTime));

  const conflicts = await courseRepository.findScheduleConflicts({
    student_id: studentId,
    teacher_id: teacherId,
    planned_date: plannedDate,
    start_time: startTime,
    end_time: endTime,
  });
  if (conflicts.length) {
    throw new AppError(buildConflictMessage(conflicts, studentId, teacherId), 409);
  }

  const courseId = await getOrCreateCourseId(input);

  if (studentGrade) {
    await userRepository.updateStudentGrade(studentId, studentGrade);
  }

  await courseRepository.createSchedule({
    student_id: studentId,
    teacher_id: teacherId,
    course_id: courseId,
    weekday: cleanText(input.weekday),
    start_time: startTime,
    end_time: endTime,
    planned_date: plannedDate,
    lesson_hours: lessonHours,
    remark: "",
    created_at: nowText(),
  });
}

function timeToMinutes(value) {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return 0;
  return hour * 60 + minute;
}

function buildConflictMessage(conflicts, studentId, teacherId) {
  const lines = conflicts.slice(0, 3).map((conflict, index) => {
    const reasons = [];
    if (Number(conflict.teacher_id) === Number(teacherId)) {
      reasons.push(`老师“${conflict.teacher_name}”已有课程`);
    }
    if (Number(conflict.student_id) === Number(studentId)) {
      reasons.push(`学生“${conflict.student_name}”已有课程`);
    }

    const start = String(conflict.start_time).slice(0, 5);
    const end = String(conflict.end_time).slice(0, 5);
    const reasonText = reasons.join("，");
    return `${index + 1}. ${reasonText}：${conflict.planned_date} ${start}-${end}，${conflict.student_name} / ${conflict.teacher_name} / ${conflict.course_name}`;
  });
  const extraText = conflicts.length > 3 ? `\n另外还有 ${conflicts.length - 3} 条冲突，请调整老师、学生或上课时间。` : "";
  return `排课时间冲突，当前课程不能保存：\n${lines.join("\n")}${extraText}`;
}

async function deleteCourse(input) {
  assertAdminOperator(input.operator, "只有管理员可以删除课程");
  await courseRepository.deleteCourse(Number(input.id));
}

async function deleteSchedule(input) {
  assertAdminOperator(input.operator, "只有管理员可以删除排课");
  await courseRepository.deleteSchedule(Number(input.id));
}

function assertAdminOperator(operator, message = "只有管理员可以执行该操作") {
  if (operator?.role !== "admin" || !operator?.username) {
    throw new AppError(message, 403);
  }
}

module.exports = {
  createCourse,
  createSchedule,
  deleteCourse,
  deleteSchedule,
  listCourseData,
};

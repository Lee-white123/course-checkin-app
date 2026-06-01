const { AppError } = require("../../utils/appError");
const { cleanText, nowText } = require("../../utils/format");
const userRepository = require("../users/user.repository");
const courseRepository = require("./course.repository");

async function listCourseData() {
  return {
    courses: await courseRepository.listCourses(),
    schedules: await courseRepository.listSchedules(),
  };
}

function roundToHalfHour(hours) {
  return Math.max(0.5, Math.round(hours * 2) / 2);
}

function calculateLessonHours(startTime, endTime) {
  const [startHour, startMinute] = String(startTime || "").split(":").map(Number);
  const [endHour, endMinute] = String(endTime || "").split(":").map(Number);
  if ([startHour, startMinute, endHour, endMinute].some((item) => Number.isNaN(item))) return 1;

  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  if (end <= start) return 0.5;
  return roundToHalfHour((end - start) / 60);
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
    hours_per_lesson: Number(input.lesson_hours || 1),
    created_at: nowText(),
  });
}

async function createCourse(input) {
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

  const lessonHours = calculateLessonHours(startTime, endTime);
  if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
    throw new AppError("结束时间必须晚于开始时间", 400);
  }

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
  const conflict = conflicts[0];
  const reason =
    Number(conflict.teacher_id) === Number(teacherId)
      ? `老师“${conflict.teacher_name}”该时间已有课程`
      : `学生“${conflict.student_name}”该时间已有课程`;
  return `${reason}：${conflict.planned_date} ${String(conflict.start_time).slice(0, 5)}-${String(conflict.end_time).slice(0, 5)}，${conflict.student_name} / ${conflict.teacher_name} / ${conflict.course_name}`;
}

async function deleteCourse(id) {
  await courseRepository.deleteCourse(Number(id));
}

async function deleteSchedule(id) {
  await courseRepository.deleteSchedule(Number(id));
}

module.exports = {
  createCourse,
  createSchedule,
  deleteCourse,
  deleteSchedule,
  listCourseData,
};

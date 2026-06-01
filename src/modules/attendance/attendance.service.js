const { withTransaction } = require("../../database/db");
const { AppError } = require("../../utils/appError");
const { cleanText, nowText } = require("../../utils/format");
const courseRepository = require("../courses/course.repository");
const { STATUS_COMPLETED, getCheckinStatus } = require("../courses/schedule-status");
const userRepository = require("../users/user.repository");
const attendanceRepository = require("./attendance.repository");

async function listRecords() {
  return attendanceRepository.listLessonRecords();
}

async function checkin(scheduleId, input) {
  assertCheckinOperator(input.operator);
  const id = Number(scheduleId);
  const schedule = await courseRepository.getScheduleById(id);
  if (!schedule) {
    throw new AppError("课程安排不存在", 404);
  }
  if (input.operator.role === "teacher" && Number(input.operator.related_id || 0) !== Number(schedule.teacher_id)) {
    throw new AppError("老师只能消除自己负责的课程", 403);
  }
  if (schedule.checked_at || schedule.status === "已消课" || schedule.status === "异常") {
    throw new AppError("该课程已经打卡，不能重复打卡", 400);
  }

  const checkedAt = nowText();
  const lessonHours = Number(input.lesson_hours || schedule.lesson_hours);
  const checkinStatus = getCheckinStatus(schedule, checkedAt, lessonHours);

  await withTransaction(async (trx) => {
    await attendanceRepository.createLessonRecord({
      schedule_id: id,
      student_id: schedule.student_id,
      teacher_id: schedule.teacher_id,
      course_id: schedule.course_id,
      lesson_hours: lessonHours,
      feedback: cleanText(input.feedback),
      wrong_notes: cleanText(input.wrong_notes),
      checked_at: checkedAt,
    }, trx);
    await courseRepository.markScheduleChecked(id, checkedAt, checkinStatus, trx);
    if (checkinStatus.status === STATUS_COMPLETED) {
      await userRepository.increaseConsumedHours(schedule.student_id, lessonHours, trx);
    }
  });
}

function assertCheckinOperator(operator) {
  if (operator?.role === "admin") return;
  if (operator?.role === "teacher" && operator.profile_status === "启用") return;
  throw new AppError("只有已审核老师或管理员可以消课", 403);
}

module.exports = {
  checkin,
  listRecords,
};

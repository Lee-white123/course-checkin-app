const { withTransaction } = require("../../database/db");
const { AppError } = require("../../utils/appError");
const { cleanText, nowText } = require("../../utils/format");
const courseRepository = require("../courses/course.repository");
const userRepository = require("../users/user.repository");
const attendanceRepository = require("./attendance.repository");

async function listRecords() {
  return attendanceRepository.listLessonRecords();
}

async function checkin(scheduleId, input) {
  const id = Number(scheduleId);
  const schedule = await courseRepository.getScheduleById(id);
  if (!schedule) {
    throw new AppError("课程安排不存在", 404);
  }
  if (schedule.status === "已消课") {
    throw new AppError("该课程已经消课，不能重复打卡", 400);
  }

  const checkedAt = nowText();
  const lessonHours = Number(input.lesson_hours || schedule.lesson_hours);

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
    await courseRepository.markScheduleChecked(id, checkedAt, lessonHours, trx);
    await userRepository.increaseConsumedHours(schedule.student_id, lessonHours, trx);
  });
}

module.exports = {
  checkin,
  listRecords,
};

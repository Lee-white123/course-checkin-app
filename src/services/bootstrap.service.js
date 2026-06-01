const attendanceService = require("../modules/attendance/attendance.service");
const authService = require("../modules/auth/auth.service");
const courseService = require("../modules/courses/course.service");
const userService = require("../modules/users/user.service");

async function fetchBootstrap() {
  const [admins, teacherAccounts, parentAccounts, users, courseData, records] = await Promise.all([
    authService.listAdmins(),
    authService.listTeacherAccounts(),
    authService.listParentAccounts(),
    userService.listUsers(),
    courseService.listCourseData(),
    attendanceService.listRecords(),
  ]);

  const { teachers, students } = users;
  const { courses, schedules } = courseData;

  const totalPurchased = students.reduce((sum, item) => sum + Number(item.purchased_hours || 0), 0);
  const totalConsumed = students.reduce((sum, item) => sum + Number(item.consumed_hours || 0), 0);

  return {
    admins,
    teacherAccounts,
    parentAccounts,
    teachers,
    students,
    courses,
    schedules,
    records,
    summary: {
      admin_count: admins.length,
      teacher_count: teachers.length,
      student_count: students.length,
      course_count: courses.length,
      pending_schedule_count: schedules.filter((item) => item.status === "待上课").length,
      completed_schedule_count: schedules.filter((item) => item.status === "已消课").length,
      total_purchased_hours: totalPurchased,
      total_consumed_hours: totalConsumed,
      total_remaining_hours: totalPurchased - totalConsumed,
    },
  };
}

module.exports = {
  fetchBootstrap,
};

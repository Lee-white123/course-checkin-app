const attendanceService = require("../modules/attendance/attendance.service");
const authService = require("../modules/auth/auth.service");
const courseService = require("../modules/courses/course.service");
const userService = require("../modules/users/user.service");

async function fetchBootstrap(auth = null) {
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

  const visibleData = filterByAuth({
    auth,
    admins,
    teacherAccounts,
    parentAccounts,
    teachers,
    students,
    courses,
    schedules,
    records,
  });

  const visibleStudents = visibleData.students;
  const visibleSchedules = visibleData.schedules;

  const totalPurchased = visibleStudents.reduce((sum, item) => sum + Number(item.purchased_hours || 0), 0);
  const totalConsumed = visibleStudents.reduce((sum, item) => sum + Number(item.consumed_hours || 0), 0);

  return {
    ...visibleData,
    summary: {
      admin_count: visibleData.admins.length,
      teacher_count: visibleData.teachers.length,
      student_count: visibleStudents.length,
      course_count: visibleData.courses.length,
      pending_schedule_count: visibleSchedules.filter((item) => item.status === "待上课").length,
      completed_schedule_count: visibleSchedules.filter((item) => item.status === "已消课").length,
      total_purchased_hours: totalPurchased,
      total_consumed_hours: totalConsumed,
      total_remaining_hours: totalPurchased - totalConsumed,
    },
  };
}

function filterByAuth(data) {
  const { auth } = data;
  if (!auth || auth.role === "admin") {
    return {
      admins: data.admins,
      teacherAccounts: data.teacherAccounts,
      parentAccounts: data.parentAccounts,
      teachers: data.teachers,
      students: data.students,
      courses: data.courses,
      schedules: data.schedules,
      records: data.records,
    };
  }

  if (auth.role === "teacher") {
    const teacherId = Number(auth.related_id || 0);
    const schedules = data.schedules.filter((item) => Number(item.teacher_id) === teacherId);
    const studentIds = new Set(schedules.map((item) => Number(item.student_id)));
    return {
      admins: [],
      teacherAccounts: data.teacherAccounts.filter((item) => Number(item.related_id) === teacherId),
      parentAccounts: [],
      teachers: data.teachers.filter((item) => Number(item.id) === teacherId),
      students: data.students.filter((item) => studentIds.has(Number(item.id))),
      courses: data.courses,
      schedules,
      records: data.records.filter((item) => Number(item.teacher_id) === teacherId),
    };
  }

  if (auth.role === "parent") {
    const studentId = Number(auth.related_id || 0);
    const schedules = data.schedules.filter((item) => Number(item.student_id) === studentId);
    const teacherIds = new Set(schedules.map((item) => Number(item.teacher_id)));
    return {
      admins: [],
      teacherAccounts: [],
      parentAccounts: data.parentAccounts.filter((item) => Number(item.related_id) === studentId),
      teachers: data.teachers.filter((item) => teacherIds.has(Number(item.id))),
      students: data.students.filter((item) => Number(item.id) === studentId),
      courses: data.courses,
      schedules,
      records: data.records.filter((item) => Number(item.student_id) === studentId),
    };
  }

  return {
    admins: [],
    teacherAccounts: [],
    parentAccounts: [],
    teachers: [],
    students: [],
    courses: [],
    schedules: [],
    records: [],
  };
}

module.exports = {
  fetchBootstrap,
};

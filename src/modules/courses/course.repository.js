const db = require("../../database/db");

async function listCourses() {
  return db.query("SELECT * FROM courses ORDER BY id DESC");
}

async function listSchedules() {
  return db.query(`
    SELECT
      s.*,
      st.name AS student_name,
      st.grade AS student_grade,
      st.parent_name,
      st.parent_phone,
      t.name AS teacher_name,
      COALESCE((
        SELECT GROUP_CONCAT(sub.name ORDER BY sub.sort_order SEPARATOR '、')
        FROM teacher_subjects ts
        JOIN subjects sub ON sub.id = ts.subject_id
        WHERE ts.teacher_id = t.id
      ), '') AS teacher_subject,
      c.name AS course_name,
      c.category AS course_category
    FROM schedules s
    JOIN students st ON st.id = s.student_id
    JOIN teachers t ON t.id = s.teacher_id
    JOIN courses c ON c.id = s.course_id
    ORDER BY
      CASE s.status WHEN '待上课' THEN 0 ELSE 1 END,
      s.id DESC
  `);
}

async function getScheduleById(id) {
  return db.queryOne("SELECT * FROM schedules WHERE id = ?", [id]);
}

async function findCourseByNameAndCategory(name, category) {
  return db.queryOne("SELECT * FROM courses WHERE name = ? AND category = ?", [name, category]);
}

async function findScheduleConflicts({ student_id, teacher_id, planned_date, start_time, end_time }) {
  return db.query(
    `
      SELECT
        s.id,
        s.student_id,
        s.teacher_id,
        s.planned_date,
        s.start_time,
        s.end_time,
        s.status,
        st.name AS student_name,
        t.name AS teacher_name,
        c.name AS course_name
      FROM schedules s
      JOIN students st ON st.id = s.student_id
      JOIN teachers t ON t.id = s.teacher_id
      JOIN courses c ON c.id = s.course_id
      WHERE s.planned_date = ?
        AND (? < s.end_time AND ? > s.start_time)
        AND (s.teacher_id = ? OR s.student_id = ?)
      ORDER BY s.start_time ASC
    `,
    [planned_date, start_time, end_time, teacher_id, student_id]
  );
}

async function createCourse(data) {
  const result = await db.execute(
    "INSERT INTO courses(name, category, hours_per_lesson, created_at) VALUES (?, ?, ?, ?)",
    [data.name, data.category, data.hours_per_lesson, data.created_at]
  );
  return Number(result.insertId);
}

async function createSchedule(data) {
  await db.execute(
    `
      INSERT INTO schedules(student_id, teacher_id, course_id, weekday, start_time, end_time, planned_date, lesson_hours, remark, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '待上课', ?)
    `,
    [
      data.student_id,
      data.teacher_id,
      data.course_id,
      data.weekday,
      data.start_time,
      data.end_time,
      data.planned_date || null,
      data.lesson_hours,
      data.remark || null,
      data.created_at,
    ]
  );
}

async function markScheduleChecked(id, checkedAt, lessonHours, trx) {
  const executor = trx || db;
  await executor.execute("UPDATE schedules SET status = '已消课', checked_at = ?, lesson_hours = ? WHERE id = ?", [
    checkedAt,
    lessonHours,
    id,
  ]);
}

async function deleteCourse(id) {
  await db.execute("DELETE FROM courses WHERE id = ?", [id]);
}

async function deleteSchedule(id) {
  await db.execute("DELETE FROM schedules WHERE id = ?", [id]);
}

module.exports = {
  createCourse,
  createSchedule,
  deleteCourse,
  deleteSchedule,
  findCourseByNameAndCategory,
  findScheduleConflicts,
  getScheduleById,
  listCourses,
  listSchedules,
  markScheduleChecked,
};

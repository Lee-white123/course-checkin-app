const db = require("../../database/db");

async function listLessonRecords() {
  return db.query(`
    SELECT
      r.*,
      st.name AS student_name,
      t.name AS teacher_name,
      c.name AS course_name,
      c.category AS course_category,
      s.weekday,
      s.start_time,
      s.end_time
    FROM lesson_records r
    JOIN students st ON st.id = r.student_id
    JOIN teachers t ON t.id = r.teacher_id
    JOIN courses c ON c.id = r.course_id
    JOIN schedules s ON s.id = r.schedule_id
    ORDER BY r.id DESC
  `);
}

async function createLessonRecord(data, trx) {
  const executor = trx || db;
  await executor.execute(
    `
      INSERT INTO lesson_records(schedule_id, student_id, teacher_id, course_id, lesson_hours, feedback, wrong_notes, checked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.schedule_id,
      data.student_id,
      data.teacher_id,
      data.course_id,
      data.lesson_hours,
      data.feedback || null,
      data.wrong_notes || null,
      data.checked_at,
    ]
  );
}

module.exports = {
  createLessonRecord,
  listLessonRecords,
};

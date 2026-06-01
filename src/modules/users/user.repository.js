const db = require("../../database/db");

const BASE_SUBJECTS = [
  ["语文", "启用", 1],
  ["数学", "启用", 2],
  ["英语", "启用", 3],
  ["物理", "启用", 4],
  ["化学", "启用", 5],
];

async function listTeachers() {
  return db.query(`
    SELECT
      t.*,
      COALESCE((
        SELECT GROUP_CONCAT(s.name ORDER BY s.sort_order SEPARATOR '、')
        FROM teacher_subjects ts
        JOIN subjects s ON s.id = ts.subject_id
        WHERE ts.teacher_id = t.id
      ), '') AS subject
    FROM teachers t
    ORDER BY t.id DESC
  `);
}

async function listStudents() {
  return db.query("SELECT * FROM students ORDER BY id DESC");
}

async function createTeacher(data) {
  const result = await db.execute("INSERT INTO teachers(name, phone, status, created_at) VALUES (?, ?, ?, ?)", [
    data.name,
    data.phone,
    data.status,
    data.created_at,
  ]);
  return Number(result.insertId);
}

async function createStudent(data) {
  await db.execute(
    `
      INSERT INTO students(name, grade, parent_name, parent_phone, purchased_hours, consumed_hours, status, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `,
    [
      data.name,
      data.grade,
      data.parent_name,
      data.parent_phone,
      data.purchased_hours,
      data.status,
      data.created_at,
    ]
  );
}

async function deleteTeacher(id) {
  await db.withTransaction(async (trx) => {
    await trx.execute("DELETE FROM accounts WHERE role = 'teacher' AND related_id = ?", [id]);
    await trx.execute("DELETE FROM teachers WHERE id = ?", [id]);
  });
}

async function deleteStudent(id) {
  await db.withTransaction(async (trx) => {
    await trx.execute("DELETE FROM accounts WHERE role = 'parent' AND related_id = ?", [id]);
    await trx.execute("DELETE FROM students WHERE id = ?", [id]);
  });
}

async function increaseConsumedHours(studentId, lessonHours, trx) {
  const executor = trx || db;
  await executor.execute("UPDATE students SET consumed_hours = consumed_hours + ? WHERE id = ?", [lessonHours, studentId]);
}

async function updateStudentGrade(studentId, grade) {
  await db.execute("UPDATE students SET grade = ? WHERE id = ?", [grade, studentId]);
}

async function findTeacherById(id) {
  return db.queryOne("SELECT id, status FROM teachers WHERE id = ?", [id]);
}

async function updateTeacherSubject(teacherId, subject) {
  const subjectNames = String(subject || "")
    .split(/[、,，/／;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  await db.withTransaction(async (trx) => {
    await trx.execute(
      `
        INSERT INTO subjects(name, status, sort_order)
        VALUES ${BASE_SUBJECTS.map(() => "(?, ?, ?)").join(", ")}
        ON DUPLICATE KEY UPDATE
          status = VALUES(status),
          sort_order = VALUES(sort_order)
      `,
      BASE_SUBJECTS.flat()
    );
    await trx.execute("DELETE FROM teacher_subjects WHERE teacher_id = ?", [teacherId]);
    if (!subjectNames.length) return;

    const placeholders = subjectNames.map(() => "?").join(", ");
    const result = await trx.execute(
      `
        INSERT IGNORE INTO teacher_subjects(teacher_id, subject_id)
        SELECT ?, id FROM subjects WHERE name IN (${placeholders})
      `,
      [teacherId, ...subjectNames]
    );

    if (Number(result.affectedRows || 0) !== subjectNames.length) {
      throw new Error("教学科目保存异常，请检查 subjects 基础科目表是否完整");
    }
  });
}

async function updateTeacherStatus(teacherId, status) {
  await db.execute("UPDATE teachers SET status = ? WHERE id = ?", [status, teacherId]);
}

module.exports = {
  createStudent,
  createTeacher,
  deleteStudent,
  deleteTeacher,
  findTeacherById,
  increaseConsumedHours,
  listStudents,
  listTeachers,
  updateStudentGrade,
  updateTeacherSubject,
  updateTeacherStatus,
};

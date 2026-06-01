const db = require("../../database/db");

function getExecutor(trx) {
  return trx || db;
}

async function listAdmins() {
  return db.query("SELECT id, username, name, status, is_super, failed_login_count, login_locked, created_at FROM admins ORDER BY id DESC");
}

async function listTeacherAccounts() {
  return db.query(`
    SELECT
      a.id,
      a.username,
      a.name,
      a.phone,
      a.related_id,
      t.status AS teacher_status,
      a.failed_login_count,
      a.login_locked,
      COALESCE((
        SELECT GROUP_CONCAT(s.name ORDER BY s.sort_order SEPARATOR '、')
        FROM teacher_subjects ts
        JOIN subjects s ON s.id = ts.subject_id
        WHERE ts.teacher_id = t.id
      ), '') AS subject,
      a.status,
      CASE WHEN ad.id IS NULL THEN 0 ELSE 1 END AS is_admin
    FROM accounts a
    LEFT JOIN teachers t ON t.id = a.related_id
    LEFT JOIN admins ad ON ad.username = a.username
    WHERE a.role = 'teacher'
    ORDER BY a.id DESC
  `);
}

async function listParentAccounts() {
  return db.query(`
    SELECT
      a.id,
      a.username,
      a.name,
      a.phone,
      a.related_id,
      a.status,
      a.failed_login_count,
      a.login_locked
    FROM accounts a
    WHERE a.role = 'parent'
    ORDER BY a.id DESC
  `);
}

async function findAdminById(id) {
  return db.queryOne("SELECT * FROM admins WHERE id = ?", [id]);
}

async function findAdminByUsername(username) {
  return db.queryOne("SELECT * FROM admins WHERE username = ?", [username]);
}

async function findAccountByRoleAndUsername(role, username) {
  return db.queryOne(`
    SELECT
      a.*,
      CASE
        WHEN a.role = 'teacher' THEN t.status
        WHEN a.role = 'parent' THEN st.status
        ELSE a.status
      END AS profile_status
    FROM accounts a
    LEFT JOIN teachers t ON t.id = a.related_id AND a.role = 'teacher'
    LEFT JOIN students st ON st.id = a.related_id AND a.role = 'parent'
    WHERE a.role = ? AND a.username = ?
  `, [role, username]);
}

async function usernameExists(username) {
  const row = await db.queryOne(
    `
      SELECT id FROM admins WHERE username = ?
      UNION
      SELECT id FROM accounts WHERE username = ?
      LIMIT 1
    `,
    [username, username]
  );
  return Boolean(row);
}

async function phoneExists(phone) {
  return Boolean(await db.queryOne("SELECT id FROM accounts WHERE phone = ? LIMIT 1", [phone]));
}

async function adminUsernameExists(username) {
  return Boolean(await db.queryOne("SELECT id FROM admins WHERE username = ?", [username]));
}

async function createAdminFromTeacher(data) {
  await db.execute(
    `
      INSERT INTO admins(username, name, password_hash, password_salt, is_super, status, created_at)
      VALUES (?, ?, ?, ?, 0, '启用', ?)
    `,
    [data.username, data.name, data.password_hash, data.password_salt, data.created_at]
  );
}

async function deleteAdmin(id) {
  await db.execute("DELETE FROM admins WHERE id = ?", [id]);
}

async function recordAdminLoginFailure(id) {
  await db.execute(
    `
      UPDATE admins
      SET
        failed_login_count = failed_login_count + 1,
        login_locked = CASE WHEN failed_login_count + 1 > 10 THEN 1 ELSE login_locked END
      WHERE id = ?
    `,
    [id]
  );
  return findAdminById(id);
}

async function resetAdminLoginFailures(id) {
  await db.execute("UPDATE admins SET failed_login_count = 0, login_locked = 0 WHERE id = ?", [id]);
}

async function recordAccountLoginFailure(id) {
  await db.execute(
    `
      UPDATE accounts
      SET
        failed_login_count = failed_login_count + 1,
        login_locked = CASE WHEN failed_login_count + 1 > 10 THEN 1 ELSE login_locked END
      WHERE id = ?
    `,
    [id]
  );
  return db.queryOne("SELECT id, failed_login_count, login_locked FROM accounts WHERE id = ?", [id]);
}

async function resetAccountLoginFailures(id) {
  await db.execute("UPDATE accounts SET failed_login_count = 0, login_locked = 0 WHERE id = ?", [id]);
}

async function unlockAccount(role, id) {
  if (role === "admin") {
    await resetAdminLoginFailures(id);
    return;
  }
  await resetAccountLoginFailures(id);
}

async function createTeacherProfile(data, trx) {
  const executor = getExecutor(trx);
  const result = await executor.execute(
    "INSERT INTO teachers(name, phone, status, created_at) VALUES (?, ?, '待审核', ?)",
    [data.name, data.phone, data.created_at]
  );
  return Number(result.insertId);
}

async function createParentStudentProfile(data, trx) {
  const executor = getExecutor(trx);
  const result = await executor.execute(
    `
      INSERT INTO students(name, grade, parent_name, parent_phone, purchased_hours, consumed_hours, status, created_at)
      VALUES (?, ?, ?, ?, 0, 0, '启用', ?)
    `,
    [data.student_name, data.student_grade, data.parent_name, data.parent_phone, data.created_at]
  );
  return Number(result.insertId);
}

async function createAccount(data, trx) {
  const executor = getExecutor(trx);
  await executor.execute(
    `
      INSERT INTO accounts(role, username, name, phone, password_hash, password_salt, related_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, '启用', ?)
    `,
    [
      data.role,
      data.username,
      data.name,
      data.phone,
      data.password_hash,
      data.password_salt,
      data.related_id,
      data.created_at,
    ]
  );
}

module.exports = {
  adminUsernameExists,
  createAccount,
  createAdminFromTeacher,
  createParentStudentProfile,
  createTeacherProfile,
  deleteAdmin,
  findAccountByRoleAndUsername,
  findAdminById,
  findAdminByUsername,
  listAdmins,
  listParentAccounts,
  listTeacherAccounts,
  phoneExists,
  recordAccountLoginFailure,
  recordAdminLoginFailure,
  resetAccountLoginFailures,
  resetAdminLoginFailures,
  unlockAccount,
  usernameExists,
};

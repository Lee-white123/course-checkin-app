const { databaseConfig } = require("../config/database");
const { execute, query, queryOne } = require("./db");

async function initDatabase() {
  await query("SELECT 1 AS ok");
  await ensureSecurityColumns();
  console.log(`MySQL 数据库已连接：${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`);
}

async function ensureColumn(tableName, columnName, definition) {
  const row = await queryOne(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );
  if (row) return;
  await execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function ensureSecurityColumns() {
  await ensureColumn("admins", "must_change_password", "TINYINT NOT NULL DEFAULT 0 AFTER login_locked");
  await ensureColumn("admins", "token_version", "INT NOT NULL DEFAULT 1 AFTER must_change_password");
  await ensureColumn("accounts", "must_change_password", "TINYINT NOT NULL DEFAULT 0 AFTER login_locked");
  await ensureColumn("accounts", "token_version", "INT NOT NULL DEFAULT 1 AFTER must_change_password");
}

module.exports = {
  initDatabase,
};

const { databaseConfig } = require("../config/database");
const { query } = require("./db");

async function initDatabase() {
  await query("SELECT 1 AS ok");
  console.log(`MySQL 数据库已连接：${databaseConfig.host}:${databaseConfig.port}/${databaseConfig.database}`);
}

module.exports = {
  initDatabase,
};

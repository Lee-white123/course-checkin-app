const mysql = require("mysql2/promise");
const { databaseConfig } = require("../config/database");

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      ...databaseConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
      dateStrings: true,
    });
  }
  return pool;
}

async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function execute(sql, params = []) {
  const [result] = await getPool().execute(sql, params);
  return result;
}

async function withTransaction(action) {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const trx = {
      query: async (sql, params = []) => {
        const [rows] = await connection.execute(sql, params);
        return rows;
      },
      queryOne: async (sql, params = []) => {
        const [rows] = await connection.execute(sql, params);
        return rows[0] || null;
      },
      execute: async (sql, params = []) => {
        const [result] = await connection.execute(sql, params);
        return result;
      },
    };
    const result = await action(trx);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  execute,
  getPool,
  query,
  queryOne,
  withTransaction,
};

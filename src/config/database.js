const { loadEnvFile } = require("./env");

loadEnvFile();

const databaseConfig = {
  host: process.env.DB_HOST || "192.168.10.24",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "course_app",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "course_checkin",
};

module.exports = {
  databaseConfig,
};

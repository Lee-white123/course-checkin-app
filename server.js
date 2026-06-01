const { createServer } = require("node:http");
const { initDatabase } = require("./src/database");
const { handleRequest } = require("./src/router");

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || "127.0.0.1";

async function main() {
  await initDatabase();

  createServer(handleRequest).listen(PORT, HOST, () => {
    console.log(`课时消除管理系统 JavaScript 后端已启动：http://${HOST}:${PORT}`);
  });
}

main().catch((error) => {
  console.error("后端启动失败：", error.message);
  process.exit(1);
});

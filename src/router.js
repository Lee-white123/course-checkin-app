const { URL } = require("node:url");
const { notFound, sendJson } = require("./utils/http");
const bootstrapService = require("./services/bootstrap.service");
const authService = require("./modules/auth/auth.service");
const { handleAuthRoutes } = require("./modules/auth/auth.routes");
const { handleUserRoutes } = require("./modules/users/user.routes");
const { handleCourseRoutes } = require("./modules/courses/course.routes");
const { handleAttendanceRoutes } = require("./modules/attendance/attendance.routes");
const { serveStatic } = require("./modules/static/static.routes");
const { verifyToken } = require("./utils/token");

const publicApiRoutes = new Set([
  "GET /api/auth/captcha",
  "POST /api/auth/login",
  "POST /api/auth/register",
]);

async function handleApi(req, res, url) {
  try {
    const requestKey = `${req.method} ${url.pathname}`;
    if (!publicApiRoutes.has(`${req.method} ${url.pathname}`)) {
      const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
      const auth = verifyToken(token);
      if (!auth) {
        return sendJson(res, { error: "登录已过期，请重新登录" }, 401);
      }
      req.auth = await authService.authorizeRequest(auth, requestKey);
    }

    if (req.method === "GET" && url.pathname === "/api/bootstrap") {
      return sendJson(res, await bootstrapService.fetchBootstrap(req.auth));
    }

    if (await handleAuthRoutes(req, res, url)) return;
    if (await handleUserRoutes(req, res, url)) return;
    if (await handleCourseRoutes(req, res, url)) return;
    if (await handleAttendanceRoutes(req, res, url)) return;

    return notFound(res);
  } catch (error) {
    const duplicateError = normalizeDuplicateError(error);
    if (duplicateError) {
      return sendJson(res, { error: duplicateError.message, field: duplicateError.field }, 409);
    }

    return sendJson(res, { error: error.message || "操作失败" }, error.statusCode || 400);
  }
}

function normalizeDuplicateError(error) {
  if (error?.code !== "ER_DUP_ENTRY") return null;

  const message = String(error.message || "");
  if (message.includes("uk_accounts_phone")) {
    return { field: "phone", message: "手机号已被注册，请换一个手机号" };
  }
  if (message.includes("uk_accounts_username") || message.includes("username")) {
    return { field: "username", message: "账号已存在，请换一个账号" };
  }
  if (message.includes("uk_admins_username")) {
    return { field: "username", message: "账号已存在，请换一个账号" };
  }

  return { field: "", message: "数据已存在，请检查后重新提交" };
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    return handleApi(req, res, url);
  }
  return serveStatic(res, url.pathname);
}

module.exports = {
  handleRequest,
};

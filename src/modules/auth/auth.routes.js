const { readJson, sendJson } = require("../../utils/http");
const authService = require("./auth.service");
const captchaService = require("./captcha.service");

// 上线前可以打开这个注册频率限制：同一 IP 每分钟最多注册 3 次。
// const registerRateLimit = new Map();
// function assertRegisterRateLimit(req) {
//   const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
//   const now = Date.now();
//   const hits = (registerRateLimit.get(ip) || []).filter((time) => now - time < 60 * 1000);
//   if (hits.length >= 3) throw new Error("注册过于频繁，请稍后再试");
//   hits.push(now);
//   registerRateLimit.set(ip, hits);
// }

async function handleAuthRoutes(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/auth/captcha") {
    return sendJson(res, captchaService.createCaptcha());
  }

  if (req.method === "POST" && url.pathname === "/api/auth/login") {
    return sendJson(res, await authService.login(await readJson(req)));
  }

  if (req.method === "POST" && url.pathname === "/api/auth/register") {
    // assertRegisterRateLimit(req);
    return sendJson(res, await authService.register(await readJson(req)), 201);
  }

  if (req.method === "POST" && url.pathname === "/api/admins") {
    const admin = await authService.appointTeacherAsAdmin(await readJson(req));
    return sendJson(res, { admin }, 201);
  }

  if (req.method === "DELETE" && url.pathname === "/api/admins") {
    const admin = await authService.revokeAdmin(url.searchParams.get("id"), await readJson(req));
    return sendJson(res, { admin });
  }

  if (req.method === "POST" && url.pathname === "/api/auth/unlock") {
    const result = await authService.unlockLogin(await readJson(req));
    return sendJson(res, { result });
  }

  return false;
}

module.exports = {
  handleAuthRoutes,
};

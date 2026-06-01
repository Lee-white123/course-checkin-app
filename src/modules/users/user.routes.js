const { readJson, sendJson } = require("../../utils/http");
const bootstrapService = require("../../services/bootstrap.service");
const userService = require("./user.service");

async function handleUserRoutes(req, res, url) {
  if (req.method === "POST" && url.pathname === "/api/teachers") {
    await userService.createTeacher({ ...(await readJson(req)), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth), 201);
  }

  if (req.method === "POST" && url.pathname === "/api/students") {
    await userService.createStudent({ ...(await readJson(req)), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth), 201);
  }

  if (req.method === "PUT" && url.pathname === "/api/teachers/subjects") {
    await userService.updateTeacherSubjects({ ...(await readJson(req)), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth));
  }

  if (req.method === "PUT" && url.pathname === "/api/teachers/status") {
    await userService.updateTeacherStatus({ ...(await readJson(req)), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth));
  }

  if (req.method === "DELETE" && url.pathname === "/api/teachers") {
    await userService.deleteTeacher({ id: url.searchParams.get("id"), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth));
  }

  if (req.method === "DELETE" && url.pathname === "/api/students") {
    await userService.deleteStudent({ id: url.searchParams.get("id"), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth));
  }

  return false;
}

module.exports = {
  handleUserRoutes,
};

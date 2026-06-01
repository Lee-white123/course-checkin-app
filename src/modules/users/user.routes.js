const { readJson, sendJson } = require("../../utils/http");
const bootstrapService = require("../../services/bootstrap.service");
const userService = require("./user.service");

async function handleUserRoutes(req, res, url) {
  if (req.method === "POST" && url.pathname === "/api/teachers") {
    await userService.createTeacher(await readJson(req));
    return sendJson(res, await bootstrapService.fetchBootstrap(), 201);
  }

  if (req.method === "POST" && url.pathname === "/api/students") {
    await userService.createStudent(await readJson(req));
    return sendJson(res, await bootstrapService.fetchBootstrap(), 201);
  }

  if (req.method === "PUT" && url.pathname === "/api/teachers/subjects") {
    await userService.updateTeacherSubjects(await readJson(req));
    return sendJson(res, await bootstrapService.fetchBootstrap());
  }

  if (req.method === "PUT" && url.pathname === "/api/teachers/status") {
    await userService.updateTeacherStatus(await readJson(req));
    return sendJson(res, await bootstrapService.fetchBootstrap());
  }

  if (req.method === "DELETE" && url.pathname === "/api/teachers") {
    await userService.deleteTeacher(url.searchParams.get("id"));
    return sendJson(res, await bootstrapService.fetchBootstrap());
  }

  if (req.method === "DELETE" && url.pathname === "/api/students") {
    await userService.deleteStudent(url.searchParams.get("id"));
    return sendJson(res, await bootstrapService.fetchBootstrap());
  }

  return false;
}

module.exports = {
  handleUserRoutes,
};

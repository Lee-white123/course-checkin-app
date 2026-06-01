const { readJson, sendJson } = require("../../utils/http");
const bootstrapService = require("../../services/bootstrap.service");
const courseService = require("./course.service");

async function handleCourseRoutes(req, res, url) {
  if (req.method === "POST" && url.pathname === "/api/courses") {
    await courseService.createCourse(await readJson(req));
    return sendJson(res, await bootstrapService.fetchBootstrap(), 201);
  }

  if (req.method === "POST" && url.pathname === "/api/schedules") {
    await courseService.createSchedule(await readJson(req));
    return sendJson(res, await bootstrapService.fetchBootstrap(), 201);
  }

  if (req.method === "DELETE" && url.pathname === "/api/courses") {
    await courseService.deleteCourse(url.searchParams.get("id"));
    return sendJson(res, await bootstrapService.fetchBootstrap());
  }

  if (req.method === "DELETE" && url.pathname === "/api/schedules") {
    await courseService.deleteSchedule(url.searchParams.get("id"));
    return sendJson(res, await bootstrapService.fetchBootstrap());
  }

  return false;
}

module.exports = {
  handleCourseRoutes,
};

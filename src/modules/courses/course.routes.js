const { readJson, sendJson } = require("../../utils/http");
const bootstrapService = require("../../services/bootstrap.service");
const courseService = require("./course.service");

async function handleCourseRoutes(req, res, url) {
  if (req.method === "POST" && url.pathname === "/api/courses") {
    await courseService.createCourse({ ...(await readJson(req)), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth), 201);
  }

  if (req.method === "POST" && url.pathname === "/api/schedules") {
    await courseService.createSchedule({ ...(await readJson(req)), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth), 201);
  }

  if (req.method === "DELETE" && url.pathname === "/api/courses") {
    await courseService.deleteCourse({ id: url.searchParams.get("id"), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth));
  }

  if (req.method === "DELETE" && url.pathname === "/api/schedules") {
    await courseService.deleteSchedule({ id: url.searchParams.get("id"), operator: req.auth });
    return sendJson(res, await bootstrapService.fetchBootstrap(req.auth));
  }

  return false;
}

module.exports = {
  handleCourseRoutes,
};

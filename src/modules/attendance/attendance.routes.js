const { readJson, sendJson } = require("../../utils/http");
const bootstrapService = require("../../services/bootstrap.service");
const attendanceService = require("./attendance.service");

async function handleAttendanceRoutes(req, res, url) {
  const checkinMatch = url.pathname.match(/^\/api\/schedules\/(\d+)\/checkin$/);
  if (req.method === "POST" && checkinMatch) {
    await attendanceService.checkin(checkinMatch[1], await readJson(req));
    return sendJson(res, await bootstrapService.fetchBootstrap(), 201);
  }

  return false;
}

module.exports = {
  handleAttendanceRoutes,
};

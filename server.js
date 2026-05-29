const { createServer } = require("node:http");
const { readFile } = require("node:fs/promises");
const { existsSync, mkdirSync } = require("node:fs");
const { extname, join, normalize } = require("node:path");
const { URL } = require("node:url");
const { DatabaseSync } = require("node:sqlite");

const BASE_DIR = __dirname;
const STATIC_DIR = join(BASE_DIR, "static");
const DATA_DIR = join(BASE_DIR, "data");
const DB_PATH = join(DATA_DIR, "attendance.db");
const PORT = Number(process.env.PORT || 8000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

let db;

function openDb() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON");
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      subject TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT '启用',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade TEXT DEFAULT '',
      parent_name TEXT DEFAULT '',
      parent_phone TEXT DEFAULT '',
      purchased_hours REAL NOT NULL DEFAULT 0,
      consumed_hours REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT '启用',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      hours_per_lesson REAL NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      weekday TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      planned_date TEXT DEFAULT '',
      lesson_hours REAL NOT NULL DEFAULT 1,
      remark TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT '待上课',
      checked_at TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lesson_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      lesson_hours REAL NOT NULL,
      feedback TEXT DEFAULT '',
      wrong_notes TEXT DEFAULT '',
      checked_at TEXT NOT NULL,
      FOREIGN KEY(schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
      FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);

  const teacherCount = db.prepare("SELECT COUNT(*) AS total FROM teachers").get().total;
  if (teacherCount > 0) return;

  const now = new Date().toISOString().slice(0, 19);
  const insertTeacher = db.prepare(
    "INSERT INTO teachers(name, phone, subject, status, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  insertTeacher.run("王老师", "13800000001", "数学", "启用", now);
  insertTeacher.run("李老师", "13800000002", "英语", "启用", now);

  const insertStudent = db.prepare(`
    INSERT INTO students(name, grade, parent_name, parent_phone, purchased_hours, consumed_hours, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertStudent.run("陈小明", "初一", "陈女士", "13900000001", 40, 0, "启用", now);
  insertStudent.run("赵一诺", "初二", "赵先生", "13900000002", 30, 0, "启用", now);

  const insertCourse = db.prepare(
    "INSERT INTO courses(name, category, hours_per_lesson, created_at) VALUES (?, ?, ?, ?)"
  );
  insertCourse.run("初一数学同步", "一对一", 2, now);
  insertCourse.run("初二英语阅读", "小班课", 1.5, now);

  const insertSchedule = db.prepare(`
    INSERT INTO schedules(student_id, teacher_id, course_id, weekday, start_time, end_time, planned_date, lesson_hours, remark, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSchedule.run(1, 1, 1, "周六", "09:00", "11:00", "", 2, "函数基础复习", "待上课", now);
  insertSchedule.run(2, 2, 2, "周日", "14:00", "15:30", "", 1.5, "阅读理解训练", "待上课", now);
}

function fetchBootstrap() {
  const teachers = db.prepare("SELECT * FROM teachers ORDER BY id DESC").all();
  const students = db.prepare("SELECT * FROM students ORDER BY id DESC").all();
  const courses = db.prepare("SELECT * FROM courses ORDER BY id DESC").all();
  const schedules = db.prepare(`
    SELECT
      s.*,
      st.name AS student_name,
      st.grade AS student_grade,
      st.parent_name,
      st.parent_phone,
      t.name AS teacher_name,
      t.subject AS teacher_subject,
      c.name AS course_name,
      c.category AS course_category
    FROM schedules s
    JOIN students st ON st.id = s.student_id
    JOIN teachers t ON t.id = s.teacher_id
    JOIN courses c ON c.id = s.course_id
    ORDER BY
      CASE s.status WHEN '待上课' THEN 0 ELSE 1 END,
      s.id DESC
  `).all();
  const records = db.prepare(`
    SELECT
      r.*,
      st.name AS student_name,
      t.name AS teacher_name,
      c.name AS course_name,
      s.weekday,
      s.start_time,
      s.end_time
    FROM lesson_records r
    JOIN students st ON st.id = r.student_id
    JOIN teachers t ON t.id = r.teacher_id
    JOIN courses c ON c.id = r.course_id
    JOIN schedules s ON s.id = r.schedule_id
    ORDER BY r.id DESC
  `).all();

  const totalPurchased = students.reduce((sum, item) => sum + Number(item.purchased_hours || 0), 0);
  const totalConsumed = students.reduce((sum, item) => sum + Number(item.consumed_hours || 0), 0);

  return {
    teachers,
    students,
    courses,
    schedules,
    records,
    summary: {
      teacher_count: teachers.length,
      student_count: students.length,
      pending_schedule_count: schedules.filter((item) => item.status === "待上课").length,
      completed_schedule_count: schedules.filter((item) => item.status === "已消课").length,
      total_purchased_hours: totalPurchased,
      total_consumed_hours: totalConsumed,
      total_remaining_hours: totalPurchased - totalConsumed,
    },
  };
}

function sendJson(res, payload, statusCode = 200) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function cleanText(value) {
  return String(value || "").trim();
}

function nowText() {
  return new Date().toISOString().slice(0, 19);
}

async function serveStatic(req, res, pathname) {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = normalize(join(STATIC_DIR, requested));
  if (!filePath.startsWith(STATIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  try {
    const content = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

function createItem(pathname, data) {
  const now = nowText();

  if (pathname === "/api/teachers") {
    db.prepare("INSERT INTO teachers(name, phone, subject, status, created_at) VALUES (?, ?, ?, ?, ?)").run(
      cleanText(data.name),
      cleanText(data.phone),
      cleanText(data.subject),
      data.status || "启用",
      now
    );
    return;
  }

  if (pathname === "/api/students") {
    db.prepare(`
      INSERT INTO students(name, grade, parent_name, parent_phone, purchased_hours, consumed_hours, status, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      cleanText(data.name),
      cleanText(data.grade),
      cleanText(data.parent_name),
      cleanText(data.parent_phone),
      Number(data.purchased_hours || 0),
      data.status || "启用",
      now
    );
    return;
  }

  if (pathname === "/api/courses") {
    db.prepare("INSERT INTO courses(name, category, hours_per_lesson, created_at) VALUES (?, ?, ?, ?)").run(
      cleanText(data.name),
      cleanText(data.category),
      Number(data.hours_per_lesson || 1),
      now
    );
    return;
  }

  if (pathname === "/api/schedules") {
    db.prepare(`
      INSERT INTO schedules(student_id, teacher_id, course_id, weekday, start_time, end_time, planned_date, lesson_hours, remark, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '待上课', ?)
    `).run(
      Number(data.student_id),
      Number(data.teacher_id),
      Number(data.course_id),
      cleanText(data.weekday),
      cleanText(data.start_time),
      cleanText(data.end_time),
      cleanText(data.planned_date),
      Number(data.lesson_hours || 1),
      cleanText(data.remark),
      now
    );
    return;
  }

  throw new Error("未找到接口");
}

function checkin(scheduleId, data) {
  const schedule = db.prepare("SELECT * FROM schedules WHERE id = ?").get(scheduleId);
  if (!schedule) {
    const error = new Error("课程安排不存在");
    error.statusCode = 404;
    throw error;
  }
  if (schedule.status === "已消课") {
    const error = new Error("该课程已经消课，不能重复打卡");
    error.statusCode = 400;
    throw error;
  }

  const now = nowText();
  const lessonHours = Number(data.lesson_hours || schedule.lesson_hours);

  db.exec("BEGIN");
  try {
    db.prepare(`
      INSERT INTO lesson_records(schedule_id, student_id, teacher_id, course_id, lesson_hours, feedback, wrong_notes, checked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      scheduleId,
      schedule.student_id,
      schedule.teacher_id,
      schedule.course_id,
      lessonHours,
      cleanText(data.feedback),
      cleanText(data.wrong_notes),
      now
    );
    db.prepare("UPDATE schedules SET status = '已消课', checked_at = ?, lesson_hours = ? WHERE id = ?").run(
      now,
      lessonHours,
      scheduleId
    );
    db.prepare("UPDATE students SET consumed_hours = consumed_hours + ? WHERE id = ?").run(
      lessonHours,
      schedule.student_id
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function deleteItem(pathname, id) {
  const tableMap = {
    "/api/teachers": "teachers",
    "/api/students": "students",
    "/api/courses": "courses",
    "/api/schedules": "schedules",
  };
  const table = tableMap[pathname];
  if (!table || !id) {
    throw new Error("缺少删除目标");
  }
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(Number(id));
}

async function handleApi(req, res, url) {
  try {
    if (req.method === "GET" && url.pathname === "/api/bootstrap") {
      return sendJson(res, fetchBootstrap());
    }

    if (req.method === "POST") {
      const data = await readJson(req);
      const checkinMatch = url.pathname.match(/^\/api\/schedules\/(\d+)\/checkin$/);
      if (checkinMatch) {
        checkin(Number(checkinMatch[1]), data);
      } else {
        createItem(url.pathname, data);
      }
      return sendJson(res, fetchBootstrap(), 201);
    }

    if (req.method === "DELETE") {
      deleteItem(url.pathname, url.searchParams.get("id"));
      return sendJson(res, fetchBootstrap());
    }

    sendJson(res, { error: "未找到接口" }, 404);
  } catch (error) {
    sendJson(res, { error: error.message || "操作失败" }, error.statusCode || 400);
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/")) {
    return handleApi(req, res, url);
  }
  return serveStatic(req, res, url.pathname);
}

openDb();
initDb();

createServer(handleRequest).listen(PORT, "127.0.0.1", () => {
  console.log(`课时消除管理系统 JavaScript 后端已启动：http://127.0.0.1:${PORT}`);
  console.log(`SQLite 数据库位置：${DB_PATH}`);
});

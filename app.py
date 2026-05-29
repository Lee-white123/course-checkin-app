from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import parse_qs, urlparse
import json
import sqlite3
from datetime import datetime


BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DB_PATH = BASE_DIR / "data" / "attendance.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect_db() as conn:
        conn.executescript(
            """
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
            """
        )

        teacher_count = conn.execute("SELECT COUNT(*) FROM teachers").fetchone()[0]
        if teacher_count == 0:
            now = datetime.now().isoformat(timespec="seconds")
            conn.executemany(
                "INSERT INTO teachers(name, phone, subject, status, created_at) VALUES (?, ?, ?, ?, ?)",
                [
                    ("王老师", "13800000001", "数学", "启用", now),
                    ("李老师", "13800000002", "英语", "启用", now),
                ],
            )
            conn.executemany(
                """
                INSERT INTO students(name, grade, parent_name, parent_phone, purchased_hours, consumed_hours, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    ("陈小明", "初一", "陈女士", "13900000001", 40, 0, "启用", now),
                    ("赵一诺", "初二", "赵先生", "13900000002", 30, 0, "启用", now),
                ],
            )
            conn.executemany(
                "INSERT INTO courses(name, category, hours_per_lesson, created_at) VALUES (?, ?, ?, ?)",
                [
                    ("初一数学同步", "一对一", 2, now),
                    ("初二英语阅读", "小班课", 1.5, now),
                ],
            )
            conn.executemany(
                """
                INSERT INTO schedules(student_id, teacher_id, course_id, weekday, start_time, end_time, planned_date, lesson_hours, remark, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    (1, 1, 1, "周六", "09:00", "11:00", "", 2, "函数基础复习", "待上课", now),
                    (2, 2, 2, "周日", "14:00", "15:30", "", 1.5, "阅读理解训练", "待上课", now),
                ],
            )


def rows_to_dicts(rows):
    return [dict(row) for row in rows]


def fetch_bootstrap():
    with connect_db() as conn:
        teachers = rows_to_dicts(conn.execute("SELECT * FROM teachers ORDER BY id DESC").fetchall())
        students = rows_to_dicts(conn.execute("SELECT * FROM students ORDER BY id DESC").fetchall())
        courses = rows_to_dicts(conn.execute("SELECT * FROM courses ORDER BY id DESC").fetchall())
        schedules = rows_to_dicts(
            conn.execute(
                """
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
                """
            ).fetchall()
        )
        records = rows_to_dicts(
            conn.execute(
                """
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
                """
            ).fetchall()
        )

    total_purchased = sum(float(s["purchased_hours"]) for s in students)
    total_consumed = sum(float(s["consumed_hours"]) for s in students)
    return {
        "teachers": teachers,
        "students": students,
        "courses": courses,
        "schedules": schedules,
        "records": records,
        "summary": {
            "teacher_count": len(teachers),
            "student_count": len(students),
            "pending_schedule_count": len([s for s in schedules if s["status"] == "待上课"]),
            "completed_schedule_count": len([s for s in schedules if s["status"] == "已消课"]),
            "total_purchased_hours": total_purchased,
            "total_consumed_hours": total_consumed,
            "total_remaining_hours": total_purchased - total_consumed,
        },
    }


class AppHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        parsed = urlparse(path)
        if parsed.path == "/":
            return str(STATIC_DIR / "index.html")
        return str(STATIC_DIR / parsed.path.lstrip("/"))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw or "{}")

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/bootstrap":
            return self.send_json(fetch_bootstrap())
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        data = self.read_json()
        now = datetime.now().isoformat(timespec="seconds")

        try:
            if parsed.path == "/api/teachers":
                with connect_db() as conn:
                    conn.execute(
                        "INSERT INTO teachers(name, phone, subject, status, created_at) VALUES (?, ?, ?, ?, ?)",
                        (
                            data.get("name", "").strip(),
                            data.get("phone", "").strip(),
                            data.get("subject", "").strip(),
                            data.get("status", "启用"),
                            now,
                        ),
                    )
                return self.send_json(fetch_bootstrap(), 201)

            if parsed.path == "/api/students":
                with connect_db() as conn:
                    conn.execute(
                        """
                        INSERT INTO students(name, grade, parent_name, parent_phone, purchased_hours, consumed_hours, status, created_at)
                        VALUES (?, ?, ?, ?, ?, 0, ?, ?)
                        """,
                        (
                            data.get("name", "").strip(),
                            data.get("grade", "").strip(),
                            data.get("parent_name", "").strip(),
                            data.get("parent_phone", "").strip(),
                            float(data.get("purchased_hours") or 0),
                            data.get("status", "启用"),
                            now,
                        ),
                    )
                return self.send_json(fetch_bootstrap(), 201)

            if parsed.path == "/api/courses":
                with connect_db() as conn:
                    conn.execute(
                        "INSERT INTO courses(name, category, hours_per_lesson, created_at) VALUES (?, ?, ?, ?)",
                        (
                            data.get("name", "").strip(),
                            data.get("category", "").strip(),
                            float(data.get("hours_per_lesson") or 1),
                            now,
                        ),
                    )
                return self.send_json(fetch_bootstrap(), 201)

            if parsed.path == "/api/schedules":
                with connect_db() as conn:
                    conn.execute(
                        """
                        INSERT INTO schedules(student_id, teacher_id, course_id, weekday, start_time, end_time, planned_date, lesson_hours, remark, status, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '待上课', ?)
                        """,
                        (
                            int(data.get("student_id")),
                            int(data.get("teacher_id")),
                            int(data.get("course_id")),
                            data.get("weekday", "").strip(),
                            data.get("start_time", "").strip(),
                            data.get("end_time", "").strip(),
                            data.get("planned_date", "").strip(),
                            float(data.get("lesson_hours") or 1),
                            data.get("remark", "").strip(),
                            now,
                        ),
                    )
                return self.send_json(fetch_bootstrap(), 201)

            if parsed.path.startswith("/api/schedules/") and parsed.path.endswith("/checkin"):
                schedule_id = int(parsed.path.split("/")[3])
                return self.checkin(schedule_id, data, now)

            self.send_json({"error": "未找到接口"}, 404)
        except Exception as exc:
            self.send_json({"error": str(exc)}, 400)

    def do_DELETE(self):
        parsed = urlparse(self.path)
        query = parse_qs(parsed.query)
        table_map = {
            "/api/teachers": "teachers",
            "/api/students": "students",
            "/api/courses": "courses",
            "/api/schedules": "schedules",
        }
        table = table_map.get(parsed.path)
        item_id = query.get("id", [None])[0]
        if not table or not item_id:
            return self.send_json({"error": "缺少删除目标"}, 400)

        with connect_db() as conn:
            conn.execute(f"DELETE FROM {table} WHERE id = ?", (int(item_id),))
        self.send_json(fetch_bootstrap())

    def checkin(self, schedule_id, data, now):
        with connect_db() as conn:
            schedule = conn.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,)).fetchone()
            if not schedule:
                return self.send_json({"error": "课程安排不存在"}, 404)
            if schedule["status"] == "已消课":
                return self.send_json({"error": "该课程已经消课，不能重复打卡"}, 400)

            lesson_hours = float(data.get("lesson_hours") or schedule["lesson_hours"])
            conn.execute(
                """
                INSERT INTO lesson_records(schedule_id, student_id, teacher_id, course_id, lesson_hours, feedback, wrong_notes, checked_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    schedule_id,
                    schedule["student_id"],
                    schedule["teacher_id"],
                    schedule["course_id"],
                    lesson_hours,
                    data.get("feedback", "").strip(),
                    data.get("wrong_notes", "").strip(),
                    now,
                ),
            )
            conn.execute(
                "UPDATE schedules SET status = '已消课', checked_at = ?, lesson_hours = ? WHERE id = ?",
                (now, lesson_hours, schedule_id),
            )
            conn.execute(
                "UPDATE students SET consumed_hours = consumed_hours + ? WHERE id = ?",
                (lesson_hours, schedule["student_id"]),
            )
        return self.send_json(fetch_bootstrap())


if __name__ == "__main__":
    init_db()
    server = ThreadingHTTPServer(("127.0.0.1", 8000), AppHandler)
    print("课时消除管理系统已启动：http://127.0.0.1:8000")
    print(f"SQLite 数据库位置：{DB_PATH}")
    server.serve_forever()

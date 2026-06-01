CREATE DATABASE IF NOT EXISTS course_checkin
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE course_checkin;

CREATE TABLE IF NOT EXISTS admins (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  is_super TINYINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT '启用',
  failed_login_count INT NOT NULL DEFAULT 0,
  login_locked TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_admins_username (username),
  KEY idx_admins_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accounts (
  id INT NOT NULL AUTO_INCREMENT,
  role VARCHAR(20) NOT NULL,
  username VARCHAR(64) NOT NULL,
  name VARCHAR(64) NOT NULL,
  phone VARCHAR(32) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(255) NOT NULL,
  related_id INT DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT '启用',
  failed_login_count INT NOT NULL DEFAULT 0,
  login_locked TINYINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_accounts_username (username),
  UNIQUE KEY uk_accounts_phone (phone),
  KEY idx_accounts_role_related_id (role, related_id),
  KEY idx_accounts_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS teachers (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  phone VARCHAR(32) DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT '待审核',
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_teachers_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subjects (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT '启用',
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_subjects_name (name),
  KEY idx_subjects_status (status),
  KEY idx_subjects_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO subjects(name, status, sort_order)
VALUES
  ('语文', '启用', 1),
  ('数学', '启用', 2),
  ('英语', '启用', 3),
  ('物理', '启用', 4),
  ('化学', '启用', 5)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  sort_order = VALUES(sort_order);

CREATE TABLE IF NOT EXISTS teacher_subjects (
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (teacher_id, subject_id),
  KEY idx_teacher_subjects_subject_id (subject_id),
  CONSTRAINT fk_teacher_subjects_teacher
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_teacher_subjects_subject
    FOREIGN KEY (subject_id) REFERENCES subjects(id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS students (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  grade VARCHAR(20) DEFAULT '',
  parent_name VARCHAR(64) DEFAULT '',
  parent_phone VARCHAR(32) DEFAULT '',
  purchased_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  consumed_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT '启用',
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_students_grade (grade),
  KEY idx_students_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(128) NOT NULL,
  category VARCHAR(32) DEFAULT '',
  hours_per_lesson DECIMAL(6,2) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_courses_name_category (name, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS schedules (
  id INT NOT NULL AUTO_INCREMENT,
  student_id INT NOT NULL,
  teacher_id INT NOT NULL,
  course_id INT NOT NULL,
  weekday VARCHAR(20) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  planned_date DATE DEFAULT NULL,
  lesson_hours DECIMAL(6,2) NOT NULL DEFAULT 1,
  remark TEXT,
  status VARCHAR(20) NOT NULL DEFAULT '待上课',
  checked_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_schedules_student_id (student_id),
  KEY idx_schedules_teacher_id (teacher_id),
  KEY idx_schedules_course_id (course_id),
  KEY idx_schedules_planned_date (planned_date),
  KEY idx_schedules_status (status),
  CONSTRAINT fk_schedules_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_schedules_teacher
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_schedules_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lesson_records (
  id INT NOT NULL AUTO_INCREMENT,
  schedule_id INT NOT NULL,
  student_id INT NOT NULL,
  teacher_id INT NOT NULL,
  course_id INT NOT NULL,
  lesson_hours DECIMAL(6,2) NOT NULL,
  feedback TEXT,
  wrong_notes TEXT,
  checked_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  KEY idx_lesson_records_schedule_id (schedule_id),
  KEY idx_lesson_records_student_id (student_id),
  KEY idx_lesson_records_teacher_id (teacher_id),
  KEY idx_lesson_records_course_id (course_id),
  KEY idx_lesson_records_checked_at (checked_at),
  CONSTRAINT fk_lesson_records_schedule
    FOREIGN KEY (schedule_id) REFERENCES schedules(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_lesson_records_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_lesson_records_teacher
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_lesson_records_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admins(
  username,
  name,
  password_hash,
  password_salt,
  is_super,
  status,
  failed_login_count,
  login_locked,
  created_at
)
VALUES (
  'admin',
  '系统管理员',
  '938784a62551f84bee920c69005b698815f6b9fd064350a77a6371f121a24bb9',
  'a736d78f16f502d75612b90ad383a4eb',
  1,
  '启用',
  0,
  0,
  NOW()
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  is_super = 1,
  status = '启用';

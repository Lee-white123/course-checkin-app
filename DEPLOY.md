# 课时消除管理系统远程部署说明

本文档记录将项目部署到 Ubuntu 22.04 + Docker 服务器的完整流程。

## 1. 服务器基础要求

服务器建议环境：

- Ubuntu 22.04
- Docker 26+
- Docker Compose
- Git

建议开放端口：

| 端口 | 用途 |
| --- | --- |
| 22 | SSH 远程连接 |
| 80 | 网页访问 |
| 443 | HTTPS，后续配置域名证书时使用 |

不建议公网开放 `3306`。MySQL 应只在 Docker 内部网络中给后端访问。

## 2. 创建项目目录

```bash
sudo mkdir -p /opt/apps
sudo chown -R ubuntu:ubuntu /opt/apps
cd /opt/apps
```

## 3. 配置 GitHub 私有仓库拉取权限

服务器只需要拉取私有仓库代码，推荐使用 GitHub Deploy Key。

生成 SSH Key：

```bash
ssh-keygen -t ed25519 -C "course-checkin-server"
cat ~/.ssh/id_ed25519.pub
```

复制输出的公钥，添加到 GitHub 仓库：

```text
GitHub 仓库 -> Settings -> Deploy keys -> Add deploy key
```

如果服务器只需要拉代码，不需要勾选 `Allow write access`。

测试连接：

```bash
ssh -T git@github.com
```

看到类似内容说明成功：

```text
You've successfully authenticated, but GitHub does not provide shell access.
```

第一次连接 GitHub 时如果提示是否信任主机，输入：

```text
yes
```

这是正常现象。

## 4. 拉取项目代码

```bash
cd /opt/apps
git clone git@github.com:Lee-white123/course-checkin-app.git
cd course-checkin-app
```

如果使用 `/opt` 目录时报权限错误，请确认当前用户拥有 `/opt/apps` 的写入权限。

## 5. 创建生产环境配置

复制环境变量模板：

```bash
cp deploy/production.env.example .env
```

编辑 `.env`：

```bash
nano .env
```

示例：

```env
MYSQL_ROOT_PASSWORD=change_this_root_password
DB_NAME=course_checkin
DB_USER=course_app
DB_PASSWORD=change_this_app_password
AUTH_TOKEN_TTL_HOURS=12
AUTH_SECRET=change_this_to_a_long_random_secret
```

生成 `AUTH_SECRET`：

```bash
openssl rand -hex 32
```

注意：

- `.env` 只保存在服务器，不要上传到 GitHub。
- `MYSQL_ROOT_PASSWORD` 是 MySQL root 用户密码。
- `DB_PASSWORD` 是项目后端连接数据库使用的应用用户密码。
- `AUTH_SECRET` 用于登录 Token 签名，应使用长随机字符串。

### 修改初始化超级管理员账号和密码

项目的默认超级管理员在 `mysql/schema.sql` 中初始化。全新环境部署前，如果需要修改默认超级管理员账号、名称或密码，请在首次启动 Docker 前修改该文件中的 `INSERT INTO admins(...) VALUES (...)` 片段。

默认片段类似：

```sql
VALUES (
  'admin',
  '系统管理员',
  'password_hash',
  'password_salt',
  1,
  '启用',
  0,
  0,
  0,
  1,
  NOW()
)
```

其中：
- 第 1 个值是登录账号，例如 `admin`。
- 第 2 个值是管理员显示名称，例如 `系统管理员`。
- 第 3 个值是 `password_hash`，不是明文密码。
- 第 4 个值是 `password_salt`，不是明文密码。
- `is_super = 1` 表示超级管理员。
- `must_change_password = 0` 表示首次登录不强制修改密码。

密码不能直接写明文，需要先生成 hash 和 salt。推荐在项目根目录执行：

```bash
cd /opt/apps/course-checkin-app
node -e "const crypto = require('crypto'); const password = '这里写你的新密码'; const salt = crypto.randomBytes(16).toString('hex'); const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex'); console.log({ hash, salt });"
```

如果服务器宿主机 Node.js 版本较新，也可以使用项目内置函数：

```bash
cd /opt/apps/course-checkin-app
node -e "const { hashPassword } = require('./src/utils/password'); const r = hashPassword('这里写你的新密码'); console.log(r);"
```

如果看到 `Cannot find module 'node:crypto'`，说明宿主机 Node.js 版本较旧，请使用上一条 `crypto` 兼容命令，或升级宿主机 Node.js 到 18+。

生成后，将输出中的：

```text
hash -> 填入 password_hash
salt -> 填入 password_salt
```

例如要改成：

```text
账号：superadmin
名称：超级管理员
密码：自行设置的新密码
```

则将 `mysql/schema.sql` 中对应值改成：

```sql
VALUES (
  'superadmin',
  '超级管理员',
  '生成出来的 hash',
  '生成出来的 salt',
  1,
  '启用',
  0,
  0,
  0,
  1,
  NOW()
)
```

注意：
- 这个初始化只会在 MySQL 数据卷第一次创建时执行。
- 如果已经执行过 `docker compose up` 并生成了 `mysql_data`，后续再改 `mysql/schema.sql` 不会自动修改现有管理员密码。
- 生产环境不要继续使用公开文档中的默认账号和默认密码。

## 6. 检查 MySQL 镜像版本

确认 `docker-compose.yml` 中 MySQL 镜像固定为 8.0：

```yaml
image: mysql:8.0
```

不要写成：

```yaml
image: mysql
```

否则 Docker 可能拉取 MySQL 9.x，导致旧的 MySQL 8.0 数据目录无法启动。

### Docker 镜像下载失败或速度很慢

如果执行 `docker compose --env-file .env up -d --build` 时，出现镜像下载超时、连接失败、`TLS handshake timeout`、`i/o timeout` 等问题，可以临时配置 Docker 国内镜像源。

先备份当前 Docker 配置：

```bash
sudo mkdir -p /etc/docker
sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.bak.$(date +%F-%H%M%S) 2>/dev/null || true
```

方式一：使用清华源：

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://docker.mirrors.tuna.tsinghua.edu.cn"
  ]
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
docker info | grep -A 5 "Registry Mirrors"
```

方式二：使用阿里云镜像加速器：

阿里云通常需要使用自己账号下的专属加速地址，格式类似：

```text
https://xxxxxxxx.mirror.aliyuncs.com
```

替换命令中的地址后执行：

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "registry-mirrors": [
    "https://你的阿里云镜像加速地址.mirror.aliyuncs.com"
  ]
}
EOF

sudo systemctl daemon-reload
sudo systemctl restart docker
docker info | grep -A 5 "Registry Mirrors"
```

配置后重新拉取或构建：

```bash
docker compose --env-file .env pull
docker compose --env-file .env up -d --build
```

如果镜像源不可用、构建仍然失败，或后续想恢复 Docker 默认配置，可以还原：

```bash
sudo rm -f /etc/docker/daemon.json
sudo systemctl daemon-reload
sudo systemctl restart docker
docker info | grep -A 5 "Registry Mirrors"
```

如果之前有备份，也可以恢复最近的备份文件：

```bash
ls -t /etc/docker/daemon.json.bak.*
sudo cp /etc/docker/daemon.json.bak.最近的备份文件 /etc/docker/daemon.json
sudo systemctl daemon-reload
sudo systemctl restart docker
```

注意：
- 修改 `/etc/docker/daemon.json` 会重启 Docker 服务，正在运行的容器可能会短暂中断。
- 不同云厂商和地区的镜像源可用性会变化，如果一个源不可用，换另一个源再试。
- 镜像源只影响 Docker 拉取镜像，不会修改项目代码和数据库数据。

## 7. 启动服务

```bash
docker compose --env-file .env up -d --build
```

该命令会启动三个服务：

- `mysql`：MySQL 数据库
- `backend`：Node.js 后端
- `frontend`：Vue 前端和 Nginx

查看容器状态：

```bash
docker compose ps
```

查看所有日志：

```bash
docker compose logs -f
```

查看 MySQL 日志：

```bash
docker compose logs mysql --tail=100
```

查看后端日志：

```bash
docker compose logs backend --tail=100
```

## 8. 访问系统

浏览器访问：

```text
http://服务器公网IP
```

例如：

```text
http://124.221.113.31
```

## 9. 进入 MySQL 命令行

进入 MySQL 时建议指定 `utf8mb4`，避免命令行中文乱码：

```bash
docker compose --env-file .env exec mysql mysql --default-character-set=utf8mb4 -u root -p course_checkin
```

输入 `.env` 中的 `MYSQL_ROOT_PASSWORD`。

检查字符集：

```sql
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';
```

检查基础科目：

```sql
SELECT * FROM subjects;
```

如果基础科目缺失，执行：

```sql
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
```

退出 MySQL：

```sql
exit;
```

## 10. 后续更新代码

本地开发完成后：

```text
本地修改代码 -> 本地测试 -> 提交 Git -> 推送 GitHub
```

服务器更新：

```bash
cd /opt/apps/course-checkin-app
git pull
docker compose --env-file .env up -d --build
```

说明：

- `git pull` 只同步 GitHub 上的新修改。
- `.env` 不会被覆盖。
- MySQL 数据不会被覆盖。
- 前端和后端容器会根据新代码重新构建并替换旧容器。
- MySQL 容器通常不会清空数据。

不要在服务器上直接手动修改业务代码。建议所有代码修改都在本地完成，再推送到 GitHub，由服务器拉取更新。

## 11. 数据库结构更新

`mysql/schema.sql` 只会在 MySQL 数据目录第一次初始化时自动执行一次。

如果后续新增表、字段或基础数据，建议新增单独的更新 SQL 文件，例如：

```text
mysql/updates/2026-06-01-add-subjects.sql
mysql/updates/2026-06-02-add-login-field.sql
```

服务器更新代码后，进入 MySQL 手动执行对应 SQL：

```bash
docker compose --env-file .env exec mysql mysql --default-character-set=utf8mb4 -u root -p course_checkin
```

## 12. 常用维护命令

查看容器：

```bash
docker compose ps
```

重启所有服务：

```bash
docker compose --env-file .env restart
```

重启后端：

```bash
docker compose --env-file .env restart backend
```

重启前端：

```bash
docker compose --env-file .env restart frontend
```

停止服务：

```bash
docker compose down
```

不要随便执行：

```bash
docker compose down -v
```

`-v` 会删除 MySQL 数据卷，可能导致数据库数据丢失。

## 13. 常见问题

### MySQL 一直 Restarting

查看日志：

```bash
docker compose logs mysql --tail=100
```

如果看到：

```text
Cannot upgrade from 80046 to 90700
```

说明 MySQL 镜像从 8.0 被升级到了 9.x。

解决方式：将 `docker-compose.yml` 中 MySQL 镜像固定为：

```yaml
image: mysql:8.0
```

然后重新启动：

```bash
docker compose --env-file .env up -d --build
```

### 页面中文乱码

进入 MySQL 时使用：

```bash
docker compose --env-file .env exec mysql mysql --default-character-set=utf8mb4 -u root -p course_checkin
```

`mysql/schema.sql` 开头应包含：

```sql
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET CHARACTER SET utf8mb4;
```

如果历史数据已经写成 `???`，需要用 `UPDATE` 手动修复。

### 老师科目保存成功但页面仍显示未任命

检查老师和科目的关联表：

```sql
SELECT * FROM teacher_subjects;
```

检查完整关联：

```sql
SELECT
  a.username,
  t.id AS teacher_id,
  t.name AS teacher_name,
  GROUP_CONCAT(s.name ORDER BY s.sort_order SEPARATOR '、') AS subjects
FROM accounts a
LEFT JOIN teachers t ON t.id = a.related_id
LEFT JOIN teacher_subjects ts ON ts.teacher_id = t.id
LEFT JOIN subjects s ON s.id = ts.subject_id
WHERE a.role = 'teacher'
GROUP BY a.username, t.id, t.name;
```

如果 `teacher_subjects` 为空，说明老师和科目没有建立关联。

### 手动给老师补充教学科目

示例：给 `lihaoran` 分配数学和英语：

```sql
INSERT IGNORE INTO teacher_subjects(teacher_id, subject_id)
SELECT t.id, s.id
FROM accounts a
JOIN teachers t ON t.id = a.related_id
JOIN subjects s ON s.id IN (2, 3)
WHERE a.role = 'teacher'
  AND a.username = 'lihaoran';
```

其中 `2` 和 `3` 需要根据 `subjects` 表中的实际 `id` 确认。

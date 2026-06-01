# 学府助学课程消课管理系统

这是一个面向课外辅导场景的课程排课与课时消课管理系统。系统支持管理员、老师、家长三类角色，覆盖账号审核、教师授课科目配置、学生与课程管理、排课管理、老师打卡消课、异常打卡处理和数据总览等流程。

## 技术栈

- 后端：Node.js 原生 HTTP 服务
- 数据库：MySQL 8.0
- 前端：Vue 3、Vue Router、Element Plus、Vant
- 部署：Docker Compose、Nginx、MySQL

## 核心功能

- 管理员端：数据总览、账号审核、教师管理、学员管理、排课管理、完整课程表、管理员授权
- 老师端：查看本周课程、打卡消课、查看完整课程表、查看历史上课记录、修改账户信息
- 家长端：查看孩子课程、查看完整课程表、查看历史上课记录、修改账户信息
- 课程状态：待上课、未打卡、已消课、异常
- 异常处理：支持识别课前打卡、课时不足、课时超出等异常打卡情况
- 数据看板：统计本周排课、消课、未打卡、异常、科目分布和教师完成情况

## 目录结构

```text
course-checkin-app/
  server.js                 后端启动入口
  src/                      后端业务代码
  mysql/schema.sql          数据库初始化脚本
  frontend/                 Vue 前端源码
  static/                   前端构建后的静态资源
  deploy/                   Nginx 与生产环境模板
  docker-compose.yml        Docker Compose 部署配置
  Dockerfile.backend        后端镜像配置
  Dockerfile.frontend       前端镜像配置
  .env.example              本地环境变量模板
```

## 上传到 GitHub 时包含什么

建议上传：

- `src/` 后端源码
- `frontend/src/` 前端源码
- `frontend/package.json` 和 `frontend/package-lock.json`
- `package.json` 和 `package-lock.json`
- `mysql/schema.sql`
- `deploy/`
- `Dockerfile.backend`
- `Dockerfile.frontend`
- `docker-compose.yml`
- `.env.example`
- `README.md`
- `PRODUCT.md`、`DEPLOY.md`
- `static/` 最新构建产物

当前项目的后端会直接读取 `static/` 目录提供前端页面，所以如果希望克隆仓库后直接运行 `node server.js` 就能打开页面，建议把最新的 `static/` 一起提交。  
如果以后改成完全由 Docker 或 CI 构建前端，也可以选择不提交 `static/`，但那时需要同步调整部署流程。

不要上传：

- `.env`
- `node_modules/`
- `frontend/node_modules/`
- `local-*.log`
- `hs_err_pid*.log`
- `replay_pid*.log`
- 临时文件、个人 IDE 配置、数据库真实密码

## 环境变量

复制环境变量模板：

```powershell
copy .env.example .env
```

示例：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=course_app
DB_PASSWORD=your_mysql_password
DB_NAME=course_checkin
PORT=8000
AUTH_TOKEN_TTL_HOURS=12
AUTH_SECRET=replace-with-a-long-random-secret
```

说明：

- `.env` 只保存在本地或服务器，不要提交到 GitHub
- `AUTH_SECRET` 用于登录 token 签名，生产环境应使用长随机字符串
- `AUTH_TOKEN_TTL_HOURS` 表示登录有效期，默认 12 小时

## 数据库初始化

首次部署时，在 MySQL 中执行：

```sql
mysql/schema.sql
```

该脚本会创建系统所需表结构、基础科目数据和默认超级管理员账号。

默认管理员：

```text
账号：admin
密码：admin123
```

首次上线后建议尽快修改默认密码。

## 本地运行

安装后端依赖：

```powershell
cd D:\project\course-checkin-app
npm install
```

启动后端：

```powershell
node server.js
```

访问：

```text
http://127.0.0.1:8000
```

## 前端开发

安装前端依赖：

```powershell
cd D:\project\course-checkin-app\frontend
npm install
```

启动前端开发服务：

```powershell
npm run dev
```

访问：

```text
http://127.0.0.1:5173
```

开发环境下，Vite 会将 `/api` 请求代理到：

```text
http://127.0.0.1:8000
```

## 前后端同步构建

前端构建会输出到后端托管的 `static/` 目录：

```powershell
cd D:\project\course-checkin-app\frontend
npm run build
```

构建完成后，重新启动后端即可访问最新页面。

## Docker 部署

复制生产环境变量模板：

```bash
cp deploy/production.env.example .env
```

编辑 `.env`，设置数据库密码和 `AUTH_SECRET`。

启动服务：

```bash
docker compose --env-file .env up -d --build
```

查看容器：

```bash
docker compose ps
```

查看日志：

```bash
docker compose logs -f
```

服务组成：

- `mysql`：MySQL 8.0 数据库
- `backend`：Node.js 后端服务
- `frontend`：Nginx 托管前端页面

## 常用命令

前端构建：

```powershell
npm --prefix frontend run build
```

后端启动：

```powershell
npm run start
```

检查数据库连接：

```powershell
npm run check:mysql
```

Docker 更新：

```bash
git pull
docker compose --env-file .env up -d --build
```

## Git 提交建议

提交前建议先查看状态：

```powershell
git status
```

推荐提交内容：

```powershell
git add README.md .gitignore package.json package-lock.json server.js src mysql frontend deploy docker-compose.yml Dockerfile.backend Dockerfile.frontend static PRODUCT.md DEPLOY.md .env.example
git commit -m "Complete course check-in management system"
git push
```

如果仓库中出现本地日志或崩溃文件，请不要提交，先确认 `.gitignore` 是否已经生效。

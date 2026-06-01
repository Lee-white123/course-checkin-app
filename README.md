# 课时消除管理系统

这是一个用于初中补习班课时管理的本地开发原型，当前采用：

- 后端：Node.js 原生 HTTP 服务 + MySQL 8.0
- 前端：Vue 3 + Vue Router + Element Plus + Vant
- 数据库：远程 MySQL，默认库名 `course_checkin`

## 数据库配置

后端会读取项目根目录下的 `.env` 文件。可以复制 `.env.example` 为 `.env`，然后填写真实密码：

```text
DB_HOST=192.168.10.24
DB_PORT=3306
DB_USER=course_app
DB_PASSWORD=你的 MySQL 密码
DB_NAME=course_checkin
PORT=8000
AUTH_TOKEN_TTL_HOURS=12
```

`AUTH_TOKEN_TTL_HOURS` 表示登录有效期，默认 12 小时。修改后需要重启后端，并重新登录一次，新有效期才会写入浏览器。

## 数据库初始化

服务器首次部署时，在 MySQL 中执行：

```sql
mysql/schema.sql
```

这个脚本会创建完整表结构、初始化 5 个固定科目，并创建默认超级管理员 `admin / admin123`。如果数据库里已经存在 `admin` 账号，脚本不会覆盖它的密码。

首次运行前需要安装后端依赖：

```powershell
cd D:\project\course-checkin-app
npm install
```

## 运行方式

后端运行：

```powershell
cd D:\project\course-checkin-app
node server.js
```

浏览器打开：

```text
http://127.0.0.1:8000
```

前端开发运行：

```powershell
cd D:\project\course-checkin-app\frontend
npm install
npm run dev
```

浏览器打开：

```text
http://127.0.0.1:5173
```

如果 PowerShell 阻止 `npm.ps1`，可以使用：

```powershell
npm.cmd run dev
```

## 默认账号

默认超级管理员：

```text
账号：admin
密码：admin123
```

`admins.is_super` 用于区分管理员类型：

- `1`：超级管理员，可以任命已注册老师账号为普通管理员。
- `0`：普通管理员，可以管理老师、家长/学生、课程和排课，但不能任命管理员。

## 当前页面

```text
/login
/register
/admin/:name
/teacher/:name
/parent/:name
/dashboard
```

## 后端模块结构

```text
server.js                 启动入口
src/router.js             总路由
src/database/             MySQL 连接池与事务封装
src/modules/auth/         登录、注册、管理员权限
src/modules/users/        老师、学生信息管理
src/modules/courses/      课程与排课管理
src/modules/attendance/   老师消课与消课记录
src/modules/static/       前端静态文件托管
src/services/             跨模块聚合服务
src/utils/                通用工具
```

## 前端构建

把 Vue 前端构建到后端托管的 `static` 目录：

```powershell
cd D:\project\course-checkin-app\frontend
npm run build
```

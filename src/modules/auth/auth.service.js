const { withTransaction } = require("../../database/db");
const { AppError } = require("../../utils/appError");
const { cleanText, nowText } = require("../../utils/format");
const { hashPassword, verifyPassword } = require("../../utils/password");
const { createToken } = require("../../utils/token");
const { getInvalidPasswordChars, isValidPassword, isValidPhone, isValidUsername } = require("../../utils/validation");
const authRepository = require("./auth.repository");
const captchaService = require("./captcha.service");

function buildLoginResult(role, user) {
  const tokenResult = createToken({ sub: user.id, role, username: user.username });
  return {
    token: tokenResult.token,
    expires_at: tokenResult.expires_at,
    role,
    user: {
      ...user,
      role,
    },
  };
}

function ensureActive(record) {
  return record && record.status !== "禁用";
}

async function listAdmins() {
  return authRepository.listAdmins();
}

async function listTeacherAccounts() {
  return authRepository.listTeacherAccounts();
}

async function listParentAccounts() {
  return authRepository.listParentAccounts();
}

function assertNotLoginLocked(record) {
  if (Number(record?.login_locked || 0) === 1) {
    throw new AppError("账号已被限制登录，请联系管理员解除限制", 403);
  }
}

function buildLoginFailureMessage(record) {
  const count = Number(record?.failed_login_count || 0);
  if (Number(record?.login_locked || 0) === 1 || count > 10) {
    return "账号已被限制登录，请联系管理员解除限制";
  }
  if (count > 5) {
    return `账号或密码错误，已连续失败 ${count} 次；超过 10 次后账号将被限制登录`;
  }
  return "账号或密码错误";
}

async function loginAdmin(input) {
  const username = cleanText(input.username);
  const password = String(input.password || "");
  if (!username || !password) {
    throw new AppError("请输入账号和密码", 400);
  }

  const admin = await authRepository.findAdminByUsername(username);
  if (!ensureActive(admin)) {
    throw new AppError("账号不存在或已禁用", 401);
  }
  assertNotLoginLocked(admin);

  if (!verifyPassword(password, admin.password_salt, admin.password_hash)) {
    const latest = await authRepository.recordAdminLoginFailure(admin.id);
    throw new AppError(buildLoginFailureMessage(latest), Number(latest.login_locked || 0) === 1 ? 403 : 401);
  }

  await authRepository.resetAdminLoginFailures(admin.id);
  return buildLoginResult("admin", {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    is_super: admin.username === "admin" ? 1 : Number(admin.is_super || 0),
  });
}

async function loginAccount(role, input) {
  const username = cleanText(input.username);
  const password = String(input.password || "");
  if (!username || !password) {
    throw new AppError("请输入账号和密码", 400);
  }

  const account = await authRepository.findAccountByRoleAndUsername(role, username);
  if (!ensureActive(account)) {
    throw new AppError("账号不存在，请先注册", 401);
  }
  assertNotLoginLocked(account);

  if (!verifyPassword(password, account.password_salt, account.password_hash)) {
    const latest = await authRepository.recordAccountLoginFailure(account.id);
    throw new AppError(buildLoginFailureMessage(latest), Number(latest.login_locked || 0) === 1 ? 403 : 401);
  }

  await authRepository.resetAccountLoginFailures(account.id);
  return buildLoginResult(role, {
    id: account.id,
    username: account.username,
    name: account.name,
    phone: account.phone,
    related_id: account.related_id,
    profile_status: account.profile_status,
  });
}

async function login(input) {
  const role = input.role || "admin";
  if (role === "admin") return loginAdmin(input);
  if (role === "teacher" || role === "parent") return loginAccount(role, input);
  throw new AppError("暂不支持该登录身份", 400);
}

function assertSuperAdmin(operator) {
  const isDefaultSuperAdmin = operator?.role === "admin" && operator?.username === "admin";
  const isMarkedSuperAdmin = operator?.role === "admin" && Number(operator?.is_super || 0) === 1;
  if (!isDefaultSuperAdmin && !isMarkedSuperAdmin) {
    throw new AppError("只有超级管理员可以操作管理员权限", 403);
  }
}

async function appointTeacherAsAdmin(input) {
  assertSuperAdmin(input.operator);

  const username = cleanText(input.username);
  if (!username) {
    throw new AppError("请选择或填写要任命的老师账号", 400);
  }

  if (await authRepository.adminUsernameExists(username)) {
    throw new AppError("该账号已经是管理员", 409);
  }

  const teacherAccount = await authRepository.findAccountByRoleAndUsername("teacher", username);
  if (!ensureActive(teacherAccount)) {
    throw new AppError("只能任命已注册且启用的老师账号", 400);
  }
  if (teacherAccount.profile_status !== "启用") {
    throw new AppError("该老师账号尚未审核通过，暂不能任命为管理员", 400);
  }

  await authRepository.createAdminFromTeacher({
    username: teacherAccount.username,
    name: cleanText(input.name) || teacherAccount.name,
    password_hash: teacherAccount.password_hash,
    password_salt: teacherAccount.password_salt,
    created_at: nowText(),
  });

  return {
    username: teacherAccount.username,
    name: cleanText(input.name) || teacherAccount.name,
    is_super: 0,
  };
}

async function revokeAdmin(id, input) {
  assertSuperAdmin(input.operator);

  const admin = await authRepository.findAdminById(Number(id));
  if (!admin) {
    throw new AppError("管理员不存在", 404);
  }
  if (admin.username === "admin" || Number(admin.is_super || 0) === 1) {
    throw new AppError("不能撤销超级管理员权限", 400);
  }

  await authRepository.deleteAdmin(admin.id);
  return {
    id: admin.id,
    username: admin.username,
  };
}

function assertAdminOperator(operator) {
  if (operator?.role !== "admin" || !operator?.username) {
    throw new AppError("只有管理员可以解除登录限制", 403);
  }
}

async function unlockLogin(input) {
  assertAdminOperator(input.operator);

  const role = cleanText(input.role);
  const id = Number(input.id || 0);
  if (!["admin", "teacher", "parent"].includes(role) || !id) {
    throw new AppError("请选择要解除限制的账号", 400);
  }

  await authRepository.unlockAccount(role, id);
  return { role, id };
}

async function register(input) {
  const role = input.role;
  if (role !== "teacher" && role !== "parent") {
    throw new AppError("管理员账号不能自助注册，请由超级管理员任命", 400);
  }

  const username = cleanText(input.username);
  const password = String(input.password || "");
  const name = cleanText(input.name);
  const phone = cleanText(input.phone);
  if (!captchaService.verifyCaptcha(input.captcha_id, input.captcha_answer)) {
    throw new AppError("验证码错误或已过期，请重新输入", 400);
  }
  if (!username || !password || !name || !phone) {
    throw new AppError("请填写账号、密码、姓名和手机号", 400);
  }
  if (!isValidUsername(username)) {
    throw new AppError("账号只能使用 4-32 位英文、数字或下划线", 400);
  }
  if (!isValidPhone(phone)) {
    throw new AppError("请输入有效的 11 位中国大陆手机号", 400);
  }
  if (!isValidPassword(password)) {
    const invalidChars = getInvalidPasswordChars(password);
    if (invalidChars.length) {
      throw new AppError(`密码不符合，不能出现 ${invalidChars.join("、")}`, 400);
    }
    throw new AppError("密码需为 8-32 位，可使用英文、数字和符号 *_@，不能全部是符号", 400);
  }
  if (role === "parent" && !cleanText(input.student_name)) {
    throw new AppError("请填写学生姓名", 400);
  }
  if (role === "parent" && !cleanText(input.student_grade)) {
    throw new AppError("请填写学生年级", 400);
  }
  if (await authRepository.usernameExists(username)) {
    throw new AppError("账号已存在，请换一个账号", 409);
  }
  if (await authRepository.phoneExists(phone)) {
    throw new AppError("手机号已被注册，请换一个手机号", 409);
  }

  const now = nowText();
  const passwordData = hashPassword(password);

  return withTransaction(async (trx) => {
    let relatedId = 0;
    if (role === "teacher") {
      relatedId = await authRepository.createTeacherProfile({
        name,
        phone,
        created_at: now,
      }, trx);
    } else {
      relatedId = await authRepository.createParentStudentProfile({
        student_name: cleanText(input.student_name) || `${name}的学生`,
        student_grade: cleanText(input.student_grade),
        parent_name: name,
        parent_phone: phone,
        created_at: now,
      }, trx);
    }

    await authRepository.createAccount({
      role,
      username,
      name,
      phone,
      password_hash: passwordData.hash,
      password_salt: passwordData.salt,
      related_id: relatedId,
      created_at: now,
    }, trx);

    return {
      role,
      username,
      name,
    };
  });
}

module.exports = {
  appointTeacherAsAdmin,
  listAdmins,
  listParentAccounts,
  listTeacherAccounts,
  login,
  register,
  revokeAdmin,
  unlockLogin,
};

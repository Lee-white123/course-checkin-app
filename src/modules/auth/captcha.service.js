const crypto = require("node:crypto");

const captchaStore = new Map();
const CAPTCHA_TTL_MS = 5 * 60 * 1000;

function randomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 4; index += 1) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
}

function cleanupExpiredCaptchas() {
  const now = Date.now();
  for (const [id, item] of captchaStore.entries()) {
    if (item.expiresAt <= now) captchaStore.delete(id);
  }
}

function buildSvg(code) {
  const lineA = crypto.randomInt(18, 46);
  const lineB = crypto.randomInt(70, 118);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="132" height="44" viewBox="0 0 132 44">
      <rect width="132" height="44" rx="6" fill="#f6f9ff"/>
      <path d="M6 ${lineA} C36 5, 70 48, 126 ${lineB % 42}" stroke="#9ec5ff" stroke-width="2" fill="none"/>
      <path d="M8 ${lineB % 38} C42 42, 82 4, 124 ${lineA}" stroke="#c7d2fe" stroke-width="2" fill="none"/>
      <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="24" font-weight="700"
        letter-spacing="5" fill="#1f4fd1">${code}</text>
      <circle cx="18" cy="12" r="2" fill="#93c5fd"/>
      <circle cx="112" cy="31" r="2" fill="#60a5fa"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function createCaptcha() {
  cleanupExpiredCaptchas();
  const id = crypto.randomUUID();
  const code = randomCode();
  captchaStore.set(id, {
    answer: code.toLowerCase(),
    expiresAt: Date.now() + CAPTCHA_TTL_MS,
  });

  return {
    captcha_id: id,
    image: buildSvg(code),
  };
}

function verifyCaptcha(id, answer) {
  cleanupExpiredCaptchas();

  const captcha = captchaStore.get(String(id || ""));
  if (!captcha) return false;

  captchaStore.delete(String(id || ""));
  return captcha.answer === String(answer || "").trim().toLowerCase();
}

module.exports = {
  createCaptcha,
  verifyCaptcha,
};

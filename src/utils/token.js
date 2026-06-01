const { createHmac } = require("node:crypto");

const SECRET = process.env.AUTH_SECRET || "course-checkin-local-dev-secret";
const DEFAULT_TOKEN_TTL_HOURS = 12;

function getTokenTtlMs() {
  const hours = Number(process.env.AUTH_TOKEN_TTL_HOURS || DEFAULT_TOKEN_TTL_HOURS);
  const normalizedHours = Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_TOKEN_TTL_HOURS;
  return normalizedHours * 60 * 60 * 1000;
}

function base64url(payload) {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function sign(value) {
  return createHmac("sha256", SECRET).update(value).digest("base64url");
}

function createToken(payload) {
  const expiresAt = new Date(Date.now() + getTokenTtlMs()).toISOString();
  const header = base64url({ alg: "HS256", typ: "LOCAL" });
  const body = base64url({ ...payload, issued_at: new Date().toISOString(), expires_at: expiresAt });
  return {
    token: `${header}.${body}.${sign(`${header}.${body}`)}`,
    expires_at: expiresAt,
  };
}

function decodeBase64Url(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function verifyToken(token) {
  try {
    const [header, body, signature] = String(token || "").split(".");
    if (!header || !body || !signature) return null;
    if (sign(`${header}.${body}`) !== signature) return null;

    const payload = decodeBase64Url(body);
    if (!payload.expires_at || Date.parse(payload.expires_at) <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

module.exports = {
  createToken,
  verifyToken,
};

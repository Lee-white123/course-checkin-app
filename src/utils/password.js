const { pbkdf2Sync, randomBytes, timingSafeEqual } = require("node:crypto");

const ITERATIONS = 120000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = pbkdf2Sync(String(password), salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return { hash, salt };
}

function verifyPassword(password, salt, expectedHash) {
  const actualHash = hashPassword(password, salt).hash;
  const actual = Buffer.from(actualHash, "hex");
  const expected = Buffer.from(expectedHash, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

module.exports = {
  hashPassword,
  verifyPassword,
};

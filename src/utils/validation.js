const USERNAME_PATTERN = /^[A-Za-z0-9_]{4,32}$/;
const PHONE_PATTERN = /^1[3-9]\d{9}$/;
const PASSWORD_PATTERN = /^[A-Za-z0-9*_@]{8,32}$/;

function isValidUsername(value) {
  return USERNAME_PATTERN.test(String(value || ""));
}

function isValidPhone(value) {
  return PHONE_PATTERN.test(String(value || ""));
}

function isValidPassword(value) {
  const password = String(value || "");
  return PASSWORD_PATTERN.test(password) && /[A-Za-z0-9]/.test(password);
}

function getInvalidPasswordChars(value) {
  const password = String(value || "");
  return [...new Set([...password].filter((char) => !/[A-Za-z0-9*_@]/.test(char)))];
}

module.exports = {
  getInvalidPasswordChars,
  isValidPassword,
  isValidPhone,
  isValidUsername,
};

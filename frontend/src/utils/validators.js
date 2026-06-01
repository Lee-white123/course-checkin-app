export const usernamePattern = /^[A-Za-z0-9_]{4,32}$/;
export const phonePattern = /^1[3-9]\d{9}$/;
export const passwordPattern = /^[A-Za-z0-9*_@]{8,32}$/;

export function isValidUsername(value) {
  return usernamePattern.test(String(value || ""));
}

export function isValidPhone(value) {
  return phonePattern.test(String(value || ""));
}

export function isValidPassword(value) {
  const password = String(value || "");
  return passwordPattern.test(password) && /[A-Za-z0-9]/.test(password);
}

export function getInvalidPasswordChars(value) {
  const password = String(value || "");
  return [...new Set([...password].filter((char) => !/[A-Za-z0-9*_@]/.test(char)))];
}

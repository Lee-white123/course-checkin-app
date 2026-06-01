function cleanText(value) {
  return String(value || "").trim();
}

function nowText() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

module.exports = {
  cleanText,
  nowText,
};

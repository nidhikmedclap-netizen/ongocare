function isHubAuthStrict() {
  const raw = String(process.env.HUB_AUTH_STRICT || "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

module.exports = {
  isHubAuthStrict,
};

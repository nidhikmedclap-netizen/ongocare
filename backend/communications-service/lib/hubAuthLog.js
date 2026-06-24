function logHubAuthShadow(event, details = {}) {
  console.warn(
    "[hub-auth:shadow]",
    JSON.stringify({
      event,
      at: new Date().toISOString(),
      ...details,
    }),
  );
}

function logHubAuthStrict(event, details = {}) {
  console.warn(
    "[hub-auth:strict]",
    JSON.stringify({
      event,
      at: new Date().toISOString(),
      ...details,
    }),
  );
}

module.exports = {
  logHubAuthShadow,
  logHubAuthStrict,
};

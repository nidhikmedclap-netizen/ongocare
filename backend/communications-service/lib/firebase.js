const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

let initialized = false;

function resolveServiceAccount() {
  const credPath = (process.env.GOOGLE_APPLICATION_CREDENTIALS || "").trim();
  if (!credPath) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");
  }

  const absolutePath = path.isAbsolute(credPath)
    ? credPath
    : path.resolve(process.cwd(), credPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(
      `Firebase service account file not found at ${absolutePath}`,
    );
  }

  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function initFirebaseAdmin() {
  if (initialized || admin.apps.length > 0) {
    initialized = true;
    return admin;
  }

  const projectId = (process.env.FIREBASE_PROJECT_ID || "").trim();
  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is not set");
  }

  const serviceAccount = resolveServiceAccount();
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
  });

  initialized = true;
  return admin;
}

function getFirestore() {
  return initFirebaseAdmin().firestore();
}

module.exports = {
  admin,
  initFirebaseAdmin,
  getFirestore,
};

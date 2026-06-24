const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const nodemailer = require("nodemailer");

if (!admin.apps.length) {
  admin.initializeApp();
}

const agoraAppId = defineString("AGORA_APP_ID");
const agoraAppCertificate = defineString("AGORA_APP_CERTIFICATE");
const smtpHost = defineString("SMTP_HOST");
const smtpPort = defineString("SMTP_PORT");
const smtpUser = defineString("SMTP_USER");
const smtpPass = defineString("SMTP_PASS");
const smtpFrom = defineString("SMTP_FROM");

function normalizeChannelName(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) {
    return "";
  }
  const cleaned = trimmed.replace(/[^A-Za-z0-9_]/g, "_");
  return cleaned.slice(0, 64);
}

function stableNumericUID(value) {
  let hash = 5381;
  const input = String(value || "");
  for (let i = 0; i < input.length; i++) {
    hash = (((hash << 5) + hash) + input.charCodeAt(i)) >>> 0;
  }
  return (hash % 2000000000) + 1;
}

async function canAccessBookedSlot(authUid, bookingDayId, bookingSlotId, bookingDoctorId) {
  const dayId = String(bookingDayId || "").trim();
  const slotId = String(bookingSlotId || "").trim();
  if (!dayId || !slotId) {
    return { allowed: false, reason: "missing-booking-link" };
  }
  const slotRef = admin
    .firestore()
    .collection("dayBookings")
    .document(dayId)
    .collection("slots")
    .document(slotId);
  const slotSnap = await slotRef.get();
  if (!slotSnap.exists) {
    return { allowed: false, reason: "slot-not-found" };
  }
  const slot = slotSnap.data() || {};
  const slotUserId = String(slot.userId || "").trim();
  const slotDoctorId = String(slot.doctorId || "").trim();
  const requestedDoctor = String(bookingDoctorId || "").trim();
  if (requestedDoctor && slotDoctorId && requestedDoctor !== slotDoctorId) {
    return { allowed: false, reason: "doctor-mismatch" };
  }
  if (authUid === slotUserId) {
    return {
      allowed: true,
      slotUserId,
      slotDoctorId,
      dayId,
      slotId,
    };
  }
  if (!slotDoctorId) {
    return { allowed: false, reason: "slot-missing-doctor" };
  }
  const dirSnap = await admin
    .firestore()
    .collection("doctorDirectory")
    .document(slotDoctorId)
    .get();
  const linkedUserId = String((dirSnap.data() || {}).linkedUserId || "").trim();
  if (linkedUserId && linkedUserId === authUid) {
    return {
      allowed: true,
      slotUserId,
      slotDoctorId,
      dayId,
      slotId,
    };
  }
  return { allowed: false, reason: "not-booking-participant" };
}

exports.agoraRtcToken = onRequest(
  {
    region: "us-central1",
    cors: true,
    invoker: "public",
    memory: "128MiB",
    timeoutSeconds: 10,
    minInstances: 0,
    maxInstances: 2,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method-not-allowed" });
      return;
    }

    let authUid = "";
    try {
      const authHeader = String(req.headers.authorization || "");
      const idToken = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : "";
      if (!idToken) {
        res.status(401).json({ error: "missing-auth-token" });
        return;
      }
      const decoded = await admin.auth().verifyIdToken(idToken);
      authUid = String(decoded.uid || "").trim();
      if (!authUid) {
        res.status(401).json({ error: "invalid-auth-token" });
        return;
      }
    } catch (_err) {
      res.status(401).json({ error: "invalid-auth-token" });
      return;
    }

    const channelName = normalizeChannelName(req.body?.channelName);
    const uidValue = Number(req.body?.uid ?? 0);
    const uid = Number.isFinite(uidValue) && uidValue >= 0 ? Math.floor(uidValue) : 0;
    const expireSecondsValue = Number(req.body?.expireSeconds ?? 3600);
    const expireSeconds =
      Number.isFinite(expireSecondsValue) && expireSecondsValue > 0
        ? Math.min(Math.floor(expireSecondsValue), 24 * 60 * 60)
        : 3600;
    const bookingDayId = String(req.body?.bookingDayId || "").trim();
    const bookingSlotId = String(req.body?.bookingSlotId || "").trim();
    const bookingDoctorId = String(req.body?.bookingDoctorId || "").trim();

    if (!channelName) {
      res.status(400).json({ error: "missing-channel-name" });
      return;
    }

    const expectedUid = stableNumericUID(authUid);
    if (uid !== expectedUid) {
      res.status(403).json({ error: "uid-not-allowed" });
      return;
    }

    if (bookingDayId && bookingSlotId) {
      try {
        const access = await canAccessBookedSlot(
          authUid,
          bookingDayId,
          bookingSlotId,
          bookingDoctorId
        );
        if (!access.allowed) {
          res.status(403).json({ error: access.reason || "booking-access-denied" });
          return;
        }
        const allowedChannels = new Set([
          normalizeChannelName(`ongocare_${access.slotDoctorId}_${access.slotUserId}`),
          normalizeChannelName(`ongocare_${access.dayId}_${access.slotId}`),
        ]);
        if (!allowedChannels.has(channelName)) {
          res.status(403).json({ error: "channel-not-allowed-for-booking" });
          return;
        }
      } catch (_error) {
        res.status(500).json({ error: "booking-validation-failed" });
        return;
      }
    }

    const appId = agoraAppId.value().trim();
    const appCertificate = agoraAppCertificate.value().trim();
    if (!appId || !appCertificate) {
      res.status(500).json({ error: "agora-secrets-not-configured" });
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = now + expireSeconds;
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    res.status(200).json({
      token,
      channelName,
      uid,
      expiresAt: privilegeExpiredTs,
    });
  }
);

function parseSmtpPort(value) {
  const raw = String(value || "").trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 587;
  return parsed > 0 ? parsed : 587;
}

function getSmtpConfig() {
  const host = smtpHost.value().trim();
  const user = smtpUser.value().trim();
  const pass = smtpPass.value().trim();
  const from = smtpFrom.value().trim() || user || "no-reply@ongocare.app";
  const port = parseSmtpPort(smtpPort.value());
  const ready = Boolean(host && user && pass && from);
  return { host, user, pass, from, port, ready };
}

async function sendTransactionalEmail({
  toEmail,
  subject,
  text,
  category,
  meta = {},
}) {
  const to = String(toEmail || "").trim().toLowerCase();
  if (!to) {
    return { ok: false, queued: false, reason: "missing-to-email" };
  }
  const cfg = getSmtpConfig();
  const logRef = admin.firestore().collection("notificationEmailLogs").doc();
  const baseLog = {
    category: String(category || "general"),
    toEmail: to,
    subject: String(subject || ""),
    meta,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (!cfg.ready) {
    await logRef.set({
      ...baseLog,
      status: "queued",
      deliveryMessage:
        "SMTP not configured. Set SMTP_* params before sending notifications.",
    });
    return { ok: false, queued: true, reason: "smtp-not-configured" };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    const info = await transporter.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
    });
    await logRef.set({
      ...baseLog,
      status: "sent",
      providerResponse: String(info?.response || info?.messageId || ""),
      deliveryMessage: "Delivered via SMTP transport.",
    });
    return { ok: true, queued: false };
  } catch (error) {
    await logRef.set({
      ...baseLog,
      status: "failed",
      deliveryMessage: String(error?.message || "unknown-send-error"),
    });
    return { ok: false, queued: false, reason: "send-failed" };
  }
}

exports.sendPrescriptionEmail = onRequest(
  {
    region: "us-central1",
    cors: true,
    invoker: "public",
    memory: "128MiB",
    timeoutSeconds: 15,
    minInstances: 0,
    maxInstances: 2,
  },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "method-not-allowed" });
      return;
    }

    let authUid = "";
    try {
      const authHeader = String(req.headers.authorization || "");
      const idToken = authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : "";
      if (!idToken) {
        res.status(401).json({ error: "missing-auth-token" });
        return;
      }
      const decoded = await admin.auth().verifyIdToken(idToken);
      authUid = String(decoded.uid || "").trim();
      if (!authUid) {
        res.status(401).json({ error: "invalid-auth-token" });
        return;
      }
    } catch (_err) {
      res.status(401).json({ error: "invalid-auth-token" });
      return;
    }

    const toEmail = String(req.body?.toEmail || "").trim().toLowerCase();
    const patientName = String(req.body?.patientName || "").trim();
    const rxNumber = String(req.body?.rxNumber || "").trim();
    const doctorName = String(req.body?.doctorName || "").trim();
    const diagnosis = String(req.body?.diagnosis || "").trim();
    const notes = String(req.body?.notes || "").trim();
    const medications = Array.isArray(req.body?.medications)
      ? req.body.medications
      : [];

    if (!toEmail || !rxNumber || !doctorName || !patientName) {
      res.status(400).json({ error: "missing-required-fields" });
      return;
    }

    const medLines = medications
      .map((m, idx) => {
        const name = String(m?.name || "").trim();
        const strength = String(m?.strength || "").trim();
        const sig = String(m?.sig || "").trim();
        const dispense = String(m?.dispense || "").trim();
        const refills = String(m?.refills || "").trim();
        return `${idx + 1}. ${name || "Medication"}\n   Strength: ${strength || "-"}\n   Sig: ${sig || "-"}\n   Dispense: ${dispense || "-"}\n   Refills: ${refills || "-"}`;
      })
      .join("\n\n");

    const subject = `Prescription ${rxNumber} for ${patientName}`;
    const text = [
      `Doctor: ${doctorName}`,
      `Patient: ${patientName}`,
      `Rx Number: ${rxNumber}`,
      diagnosis ? `Diagnosis: ${diagnosis}` : "",
      notes ? `Notes: ${notes}` : "",
      "",
      "Medications:",
      medLines || "No medications provided.",
    ]
      .filter(Boolean)
      .join("\n");

    const queueRef = admin.firestore().collection("pharmacyEmailLogs").doc();
    const baseLog = {
      doctorUid: authUid,
      toEmail,
      subject,
      rxNumber,
      patientName,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const host = smtpHost.value().trim();
    const user = smtpUser.value().trim();
    const pass = smtpPass.value().trim();
    const from = smtpFrom.value().trim() || user || "no-reply@ongocare.app";
    const port = parseSmtpPort(smtpPort.value());

    if (!host || !user || !pass) {
      await queueRef.set({
        ...baseLog,
        status: "queued",
        deliveryMessage: "SMTP not configured. Configure SMTP_* params to enable live delivery.",
      });
      res.status(202).json({
        ok: false,
        queued: true,
        message: "Email queued but SMTP is not configured on Cloud Functions.",
      });
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        text,
      });
      await queueRef.set({
        ...baseLog,
        status: "sent",
        deliveryMessage: "Delivered via SMTP transport.",
      });
      res.status(200).json({ ok: true, queued: false });
    } catch (error) {
      await queueRef.set({
        ...baseLog,
        status: "failed",
        deliveryMessage: String(error?.message || "unknown-send-error"),
      });
      res.status(500).json({
        ok: false,
        queued: false,
        error: "send-failed",
      });
    }
  }
);

exports.onUserProfileCreated = onDocumentCreated(
  {
    region: "us-central1",
    document: "users/{uid}",
    memory: "128MiB",
    timeoutSeconds: 30,
    maxInstances: 2,
  },
  async () => {
    // Welcome email is sent from the web app after email/password signup
    // (save-progress at s21 with welcomeEmailTrigger). Do not send here —
    // users/{uid} is created mid-onboarding and Google signups are excluded.
  }
);

exports.onAppointmentBooked = onDocumentCreated(
  {
    region: "us-central1",
    document: "dayBookings/{dayDoc}/slots/{slotId}",
    memory: "128MiB",
    timeoutSeconds: 30,
    maxInstances: 4,
  },
  async () => {
    // Patient appointment emails are sent from the web app
    // (POST /api/appointments/book) using dashboard-managed templates.
  }
);

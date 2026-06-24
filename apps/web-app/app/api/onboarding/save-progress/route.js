// app/api/onboarding/save-progress/route.js
//
// Called by the onboarding form after the user advances past any screen
// beyond email capture. The client passes its Firebase ID token in the
// Authorization header; we verify it, then merge the latest form snapshot
// into users/{uid}.
//
// Why a server route (vs writing directly from the client to Firestore via
// the web SDK)?
//   - Single source of truth for field whitelisting / projection
//   - Hides the Firestore schema from the client (we can change it freely)
//   - Lets us add server-side validation, logging, downstream side-effects
//     (CRM sync, analytics, etc.) without touching the client
//
// Request body:
//   { form: { ...full form state... }, currentStep: "s21", status?: "onboarded" }
//
// Response:
//   { success: true }

import {
  assertPatientOnboardingWritable,
  DEFAULT_ORG_SLUG,
  normalizeOrgSlug,
  projectFormToUserFields,
  upsertUser,
} from "@/services/firebase/users";
import { redeemCoupon } from "@/services/firebase/coupons";
import {
  stripPaymentFieldsFromForm,
  upsertPlanPayment,
} from "@/services/firebase/planPayments";
import { hasPlanCheckout } from "@/lib/billing/patientPayment";
import { verifyPaymentIntentForUser } from "@/lib/billing/verifyPlanPayment";
import { ONBOARDING_SUCCESS_STEPS } from "@/lib/onboarding/resumePath";
import { buildPatientDocumentsFromForm } from "@/lib/storage/metadata";
import { isValidStoragePath } from "@/lib/storage/paths";
import { fail, ok, withAuth } from "@/lib/api";
import { sendPatientWelcomeEmail } from "@/services/emails/sendPatientWelcomeEmail";
import { sendPatientPaymentSuccessEmail } from "@/services/emails/sendPatientPaymentSuccessEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withAuth({ rateLimitProfile: "auth" }, async (request, _ctx, { decoded }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const rawForm = body.form && typeof body.form === "object" ? body.form : {};
    const { payment: paymentFields, rest: form } =
      stripPaymentFieldsFromForm(rawForm);
    const currentStep =
      typeof body.currentStep === "string" ? body.currentStep : undefined;
    let status = body.status === "onboarded" ? "onboarded" : undefined;
    if (!status && currentStep && ONBOARDING_SUCCESS_STEPS.has(currentStep)) {
      status = "onboarded";
    }
    const stepHistory = Array.isArray(body.stepHistory)
      ? body.stepHistory
          .filter((entry) => typeof entry === "string" && entry.length > 0)
          .slice(-50)
      : undefined;
    // Portal that the user signed up under. Only honored on FIRST save
    // (i.e. doc creation) — subsequent calls can't move a user between
    // portals because upsertUser strips orgSlug from update payloads.
    const orgSlug = normalizeOrgSlug(body.orgSlug || DEFAULT_ORG_SLUG);

    const projected = projectFormToUserFields(form);
    const documents = buildPatientDocumentsFromForm(form);
    if (documents) {
      const patientPrefix = `patients/${decoded.uid}/`;
      for (const doc of Object.values(documents)) {
        if (!doc?.path?.startsWith(patientPrefix)) {
          return fail("Invalid document path.", 400);
        }
        if (!isValidStoragePath(doc.path)) {
          return fail("Invalid document path.", 400);
        }
      }
      projected.formSnapshot = {
        ...projected.formSnapshot,
        documents,
      };
    }
    const writePayload = {
      ...projected,
      // orgSlug is only honored at doc-creation by upsertUser. Including
      // it on every call is safe (updates strip it defensively) and means
      // a brand-new user gets the right tenant stamped on first write.
      orgSlug,
      ...(currentStep ? { currentStep } : {}),
      ...(stepHistory ? { onboardingStepHistory: stepHistory } : {}),
      ...(status ? { status } : {}),
      ...(form.consentH !== undefined ? { consentHIPAA: !!form.consentH } : {}),
      ...(form.consentT !== undefined ? { consentTelehealth: !!form.consentT } : {}),
      ...(form.email
        ? { email: String(form.email).trim().toLowerCase() }
        : decoded.email
          ? { email: String(decoded.email).trim().toLowerCase() }
          : {}),
      // Mirror the email_verified claim from the verified ID token so the
      // dashboard can react without a fresh Auth round-trip. The token is
      // server-verified above, so this value is trustworthy.
      emailVerified: !!decoded.email_verified,
    };

    try {
      const prior = await assertPatientOnboardingWritable(decoded.uid);
      if (!prior.exists) {
        writePayload.role = "patient";
      }
      await upsertUser(decoded.uid, writePayload);

      // Welcome email: immediately after email/password signup (client flag).
      const shouldSendWelcome =
        body.welcomeEmailTrigger === true && !prior.welcomeEmailSentAt;
      if (shouldSendWelcome) {
        try {
          await sendPatientWelcomeEmail({
            uid: decoded.uid,
            orgSlug,
            fallbackEmail: decoded.email || form.email || null,
            profileHints: {
              email: decoded.email || form.email || null,
            },
          });
        } catch (welcomeErr) {
          // eslint-disable-next-line no-console
          console.error("[save-progress] welcome email failed:", welcomeErr);
        }
      }
    } catch (err) {
      if (err?.code === "ONBOARDING_WRONG_ROLE") {
        return fail(err.message, 403);
      }
      throw err;
    }

    const checkoutForm = { ...form, ...paymentFields };
    const paymentIntentId =
      typeof checkoutForm.paymentIntentId === "string"
        ? checkoutForm.paymentIntentId.trim()
        : "";
    const clientClaimsPaid = hasPlanCheckout({
      paid: checkoutForm.paid,
      paymentStatus: checkoutForm.paymentStatus,
    });

    if (clientClaimsPaid || paymentIntentId) {
      if (!paymentIntentId) {
        return fail("Payment verification required.", 400);
      }
      let intent;
      try {
        intent = await verifyPaymentIntentForUser(paymentIntentId, {
          uid: decoded.uid,
          email: decoded.email || "",
        });
      } catch (err) {
        if (err?.code === "PAYMENT_FORBIDDEN") {
          return fail("Payment does not belong to this account.", 403);
        }
        if (err?.code === "PAYMENT_NOT_COMPLETE") {
          return fail("Payment is not complete.", 400);
        }
        return fail("Could not verify payment.", 400);
      }

      const paymentRow = await upsertPlanPayment({
        patientUid: decoded.uid,
        orgSlug,
        form: {
          ...checkoutForm,
          paymentIntentId: intent.id,
          paymentStatus: undefined,
          paid: undefined,
        },
        userData: {},
        intent,
      });

      if (paymentRow) {
        try {
          await sendPatientPaymentSuccessEmail({
            uid: decoded.uid,
            paymentRow,
          });
        } catch (paymentEmailErr) {
          // eslint-disable-next-line no-console
          console.error("[save-progress] payment success email failed:", paymentEmailErr);
        }
      }

      const couponId = checkoutForm.couponId || "";
      if (couponId) {
        try {
          await redeemCoupon({ couponId, paymentIntentId: intent.id });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error("[save-progress] coupon redemption failed:", e);
        }
      }
    }

    return ok();
  } catch (err) {
    // Don't leak the underlying error to the client — onboarding sees a
    // generic message and the actual cause is in server logs.
    // eslint-disable-next-line no-console
    console.error("[save-progress] error:", err);
    return fail("Could not save your progress.", 500);
  }
});

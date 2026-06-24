// app/api/stripe/webhook/route.js
//
// Stripe webhooks — sync capture/cancel from the Dashboard to Firestore.
// Configure in Stripe → Developers → Webhooks → payment_intent.succeeded,
// payment_intent.canceled. Set STRIPE_WEBHOOK_SECRET in env.

import Stripe from "stripe";
import { syncPatientPaymentFromIntent } from "@/services/firebase/patientPaymentSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return new Response("Stripe webhook not configured.", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature.", { status: 400 });
  }

  const stripe = new Stripe(secret);
  let event;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[stripe/webhook] signature failed:", err?.message || err);
    return new Response("Invalid signature.", { status: 400 });
  }

  try {
    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.canceled"
    ) {
      const intent = event.data.object;
      const expanded = await stripe.paymentIntents.retrieve(intent.id, {
        expand: ["payment_method"],
      });
      const result = await syncPatientPaymentFromIntent(expanded);
      if (result) {
        // eslint-disable-next-line no-console
        console.log(
          `[stripe/webhook] ${event.type} synced uid=${result.uid} status=${result.paymentStatus}`,
        );
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          `[stripe/webhook] ${event.type} no patient matched pi=${intent.id} metaUid=${intent.metadata?.firebaseUid || ""}`,
        );
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[stripe/webhook] handler error:", err);
    return new Response("Webhook handler failed.", { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

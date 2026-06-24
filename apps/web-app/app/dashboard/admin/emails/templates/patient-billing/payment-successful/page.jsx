import TransactionalEmailEditor from "@/components/admin/TransactionalEmailEditor";

export default function PaymentSuccessfulEmailPage() {
  return (
    <TransactionalEmailEditor
      category="patient-billing"
      templateId="payment-successful"
      title="Payment successful"
      description="Sent when a patient's plan payment is successfully captured."
    />
  );
}

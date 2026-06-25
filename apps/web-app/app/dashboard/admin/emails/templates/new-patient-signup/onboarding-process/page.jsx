import TransactionalEmailEditor from "@/components/admin/TransactionalEmailEditor";

export default function OnboardingProcessEmailPage() {
  return (
    <TransactionalEmailEditor
      category="new-patient-signup"
      templateId="onboarding-process"
      title="Onboarding process"
      description="Sent by cron only: email/password signup, status not onboarded, signup more than 5 minutes ago."
    />
  );
}

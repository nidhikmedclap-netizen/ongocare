import TransactionalEmailEditor from "@/components/admin/TransactionalEmailEditor";

export default function EmailTemplatePage() {
  return (
    <TransactionalEmailEditor
      category="new-patient-signup"
      templateId="welcome-email"
      title="Welcome email"
      description="Sent after email/password signup. Patient name is derived from the email address when needed."
    />
  );
}

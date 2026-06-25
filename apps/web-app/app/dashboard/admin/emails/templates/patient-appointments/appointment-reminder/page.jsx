import TransactionalEmailEditor from "@/components/admin/TransactionalEmailEditor";

export default function AppointmentReminderEmailPage() {
  return (
    <TransactionalEmailEditor
      category="patient-appointments"
      templateId="appointment-reminder"
      title="Appointment reminder"
      description="Sent by cron ~2 minutes before a scheduled appointment with the doctor."
    />
  );
}

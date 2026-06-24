import TransactionalEmailEditor from "@/components/admin/TransactionalEmailEditor";

export default function AppointmentBookedEmailPage() {
  return (
    <TransactionalEmailEditor
      category="patient-appointments"
      templateId="appointment-booked"
      title="Appointment confirmed"
      description="Sent when a patient books a doctor appointment."
    />
  );
}

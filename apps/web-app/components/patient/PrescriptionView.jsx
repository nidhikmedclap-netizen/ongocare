// components/patient/PrescriptionView.jsx
//
// Read-only prescription document shown to patients after their doctor
// issues one during a completed visit.

"use client";

import { auth } from "@/lib/firebase/auth";
import PrescriptionDocument from "@/components/prescriptions/PrescriptionDocument";
import { printTextDocument } from "@/lib/print/printTextDocument";
import { downloadTextDocumentPdf } from "@/lib/print/downloadTextDocumentPdf";
import styles from "./prescriptionView.module.css";

export default function PrescriptionView({ text, signatureUrl, onPrint }) {
  if (!text?.trim()) return null;

  const handlePrint = async () => {
    if (onPrint) {
      onPrint(text);
      return;
    }
    const authToken = await auth.currentUser?.getIdToken();
    await printTextDocument(text, {
      title: "Prescription",
      signatureUrl,
      authToken,
    });
  };

  const handleDownloadPdf = async () => {
    const authToken = await auth.currentUser?.getIdToken();
    await downloadTextDocumentPdf(text, {
      title: "Prescription",
      filename: "prescription.pdf",
      signatureUrl,
      authToken,
    });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.label}>Your prescription</span>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={handleDownloadPdf}
          >
            Download PDF
          </button>
          <button type="button" className={styles.actionBtn} onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>
      <PrescriptionDocument text={text} signatureUrl={signatureUrl} compact />
    </div>
  );
}

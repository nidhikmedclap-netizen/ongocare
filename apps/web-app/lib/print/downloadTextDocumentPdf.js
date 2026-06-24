// lib/print/downloadTextDocumentPdf.js
//
// Builds a letter-size PDF from plain text and triggers a browser download.

import { splitPrescriptionText } from "@/lib/prescriptions/splitPrescriptionText";
import { loadImageDataUrl } from "@/lib/print/loadImageDataUrl";

/**
 * @param {string} text
 * @param {{ title?: string, filename?: string, signatureUrl?: string }} [options]
 * @returns {Promise<boolean>}
 */
export async function downloadTextDocumentPdf(
  text,
  { title = "Document", filename = "document.pdf", signatureUrl = "", authToken = "" } = {},
) {
  const raw = String(text ?? "").trim();
  if (!raw || typeof document === "undefined") return false;

  const { body, footer } = splitPrescriptionText(raw);
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 54;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;
  const bodyLineHeight = 16;
  const titleLineHeight = 22;

  let y = margin;

  const addPageIfNeeded = (height) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeLines = (content) => {
    for (const rawLine of content.split("\n")) {
      const chunks = rawLine.trim()
        ? doc.splitTextToSize(rawLine, maxWidth)
        : [""];

      for (const chunk of chunks) {
        addPageIfNeeded(bodyLineHeight);
        doc.text(chunk || " ", margin, y);
        y += bodyLineHeight;
      }
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  for (const line of doc.splitTextToSize(title, maxWidth)) {
    addPageIfNeeded(titleLineHeight);
    doc.text(line, pageWidth / 2, y, { align: "center" });
    y += titleLineHeight;
  }
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  writeLines(body);

  if (footer) {
    y += 4;
    writeLines(footer);
  }

  if (signatureUrl) {
    try {
      const dataUrl = await loadImageDataUrl(signatureUrl, { authToken });
      const props = doc.getImageProperties(dataUrl);
      const maxSigWidth = 180;
      const maxSigHeight = 64;
      const scale = Math.min(
        maxSigWidth / props.width,
        maxSigHeight / props.height,
        1,
      );
      const sigWidth = props.width * scale;
      const sigHeight = props.height * scale;
      addPageIfNeeded(sigHeight + 16);
      y += 12;
      doc.addImage(
        dataUrl,
        props.fileType || "PNG",
        pageWidth - margin - sigWidth,
        y,
        sigWidth,
        sigHeight,
      );
      y += sigHeight + 12;
    } catch {
      // Signature is optional — continue without it if the image cannot load.
    }
  }

  doc.save(filename.replace(/[^\w.\-()+\s]/g, "_") || "document.pdf");
  return true;
}

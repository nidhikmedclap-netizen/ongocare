// lib/print/printTextDocument.js
//
// Opens the browser print dialog for plain text without a popup window.

import { splitPrescriptionText } from "@/lib/prescriptions/splitPrescriptionText";
import { siteFontFamily } from "@/lib/typography/site-font";
import { loadImageDataUrl } from "@/lib/print/loadImageDataUrl";

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/'/g, "&#39;");
}

function waitForImages(doc) {
  return new Promise((resolve) => {
    const imgs = doc.querySelectorAll("img");
    if (!imgs.length) {
      resolve();
      return;
    }
    let pending = imgs.length;
    const done = () => {
      pending -= 1;
      if (pending <= 0) resolve();
    };
    for (const img of imgs) {
      if (img.complete) done();
      else {
        img.onload = done;
        img.onerror = done;
      }
    }
    setTimeout(resolve, 5000);
  });
}

/**
 * @param {string} text
 * @param {{ title?: string, signatureUrl?: string, authToken?: string }} [options]
 * @returns {Promise<boolean>}
 */
export async function printTextDocument(
  text,
  { title = "Document", signatureUrl = "", authToken = "" } = {},
) {
  const raw = String(text ?? "").trim();
  if (!raw || typeof document === "undefined") return false;

  const { body, footer } = splitPrescriptionText(raw);

  let sigSrc = "";
  if (signatureUrl) {
    try {
      sigSrc = await loadImageDataUrl(signatureUrl, { authToken });
    } catch {
      // Signature is optional — print without it if the image cannot load.
    }
  }

  const signatureBlock = sigSrc
    ? `<div class="signature"><img src="${escapeAttr(sigSrc)}" alt="Doctor signature" /></div>`
    : "";
  const footerBlock = footer
    ? `<pre class="footer">${escapeHtml(footer)}</pre>`
    : "";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("title", title);
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "none",
  });

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    iframe.remove();
  };

  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    cleanup();
    return false;
  }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>
    @page { margin: 0.75in; }
    body {
      font-family: ${siteFontFamily};
      font-size: 13px;
      line-height: 1.55;
      color: #111;
      margin: 0;
      padding: 24px;
    }
    .doc-title {
      text-align: center;
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 28px;
      letter-spacing: 0.02em;
    }
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 0;
      font-family: inherit;
      font-size: inherit;
    }
    .signature {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 8px;
    }
    .signature img {
      display: block;
      max-width: 220px;
      max-height: 80px;
      object-fit: contain;
    }
    .footer {
      margin-top: 8px;
    }
    @media print {
      body { padding: 0; }
      .doc-title { margin-bottom: 24px; }
    }
  </style>
</head>
<body>
  <h1 class="doc-title">${escapeHtml(title)}</h1>
  <pre>${escapeHtml(body)}</pre>
  ${footerBlock}
  ${signatureBlock}
</body>
</html>`);
  doc.close();

  win.addEventListener("afterprint", cleanup, { once: true });
  window.addEventListener(
    "focus",
    () => {
      setTimeout(cleanup, 500);
    },
    { once: true },
  );
  setTimeout(cleanup, 120_000);

  await waitForImages(doc);
  win.focus();
  win.print();
  return true;
}

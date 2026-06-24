import puppeteer from "puppeteer";
import { fileURLToPath } from "url";
import path from "path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2] || "OngoCare-Full-Project-Workflow";
const htmlPath = path.join(dir, `${name}.html`);
const pdfPath = path.join(dir, `${name}.pdf`);

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.goto(`file://${htmlPath.replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
});
await browser.close();
console.log("PDF:", pdfPath);

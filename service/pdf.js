const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

function loadTemplate(filePath, data) {
  let template = fs.readFileSync(filePath, "utf-8");

  for (const key in data) {
    const regex = new RegExp(`\\$\\{pdfObj(?:\\?\\.)?${key}\\}`, "g");
    template = template.replace(regex, data[key] != null ? data[key] : "");
  }

  return template;
}

function getBase64Image(filePath) {
  const bitmap = fs.readFileSync(filePath);
  return `data:image/png;base64,${bitmap.toString("base64")}`;
}

async function createBookingConfirmationPdfOLD(pdfObj) {
  try {
    const outputPath = path.join(__dirname, "../uploads/pdf", pdfObj?.pdfFileName); // Final file path

    console.log(outputPath, "---------------");
    const logoPath = path.join(__dirname, "../uploads/2park_invoice_logo.png");
    pdfObj.logo = getBase64Image(logoPath);

    const templatePath = path.join(__dirname, "../views/paymentConfirmationPdf.html");
    const htmlContent = loadTemplate(templatePath, pdfObj);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    await page.pdf({ path: outputPath, format: "A4" });

    await browser.close();
    console.log("PDF generated successfully:", outputPath);
    return outputPath;
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw error;
  }
}

async function createBookingConfirmationPdf(pdfObj) {
  try {
    const logoPath = path.join(__dirname, "../uploads/2park_invoice_logo.png");
    pdfObj.logo = getBase64Image(logoPath);

    const templatePath = path.join(__dirname, "../views/paymentConfirmationPdf.html");
    const htmlContent = loadTemplate(templatePath, pdfObj);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" }); // No `path` => returns a buffer

    await browser.close();
    console.log("PDF buffer generated successfully ==> ", pdfBuffer);

    return pdfBuffer;
  } catch (error) {
    console.error("PDF generation failed:", error);
    throw error;
  }
}

module.exports = { createBookingConfirmationPdf };

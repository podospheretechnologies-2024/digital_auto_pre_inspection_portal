import type { Browser } from "puppeteer";

import type { PdfRenderOptions } from "./types";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    const puppeteer = await import("puppeteer");
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return browserPromise;
}

/** Convert HTML string to PDF buffer via headless Chromium (Puppeteer). */
export async function htmlToPdf(
  html: string,
  options: PdfRenderOptions = {},
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: options.format ?? "A4",
      landscape: options.landscape ?? false,
      printBackground: options.printBackground ?? true,
      margin: options.margin ?? {
        top: "10mm",
        right: "8mm",
        bottom: "12mm",
        left: "8mm",
      },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

/** Close shared browser (call from worker shutdown if needed). */
export async function closePdfBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}

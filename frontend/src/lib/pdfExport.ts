import { fetchQuoteDetails, getClientInfo, QuoteData } from "@/lib/quoteUtils";
import ReactDOMServer from "react-dom/server";
import React from "react";
import { QuoteHeader } from "@/components/QuoteHeader";
import { AnnuityDisplay } from "@/components/quote-displays/AnnuityDisplay";
import { FuneralDisplay } from "@/components/quote-displays/FuneralDisplay";
import { LifeDisplay } from "@/components/quote-displays/LifeDisplay";
import { IndividualLifeDisplay } from "@/components/quote-displays/IndividualLifeDisplay";
import { GenericDisplay } from "@/components/quote-displays/GenericDisplay";

const sanitizeFilename = (value: string) =>
  value
    .replace(/\//g, "-")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildPdfFilename = (quoteId: string, clientName: string) => {
  const safeQuoteId = sanitizeFilename(quoteId);
  const safeClientName = sanitizeFilename(clientName);
  return `Quote_${safeQuoteId}_${safeClientName}.pdf`;
};

const PDF_EXTRA_STYLES = `
  /* A4 with tight margins */
  @page { size: A4; margin: 12mm 12mm; }
  /* Force light-mode rendering for PDF and match on-screen paper look */
  html, body {
    background: #ffffff !important;
    color: #0f172a;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'Urbanist', 'Open Sans', system-ui, -apple-system, Arial, sans-serif;
    font-weight: 300;
    font-size: 11.5px;
    line-height: 1.32;
  }
  /* Compact the rendered quote: shrink every text utility a notch */
  .text-xs { font-size: 10px !important; }
  .text-sm { font-size: 11px !important; }
  .text-base { font-size: 12.5px !important; }
  .text-lg { font-size: 14px !important; }
  .text-xl { font-size: 15.5px !important; }
  .text-2xl { font-size: 17.5px !important; }
  /* Tighten vertical rhythm */
  .space-y-8 > * + * { margin-top: 0.8rem !important; }
  .space-y-6 > * + * { margin-top: 0.6rem !important; }
  .space-y-4 > * + * { margin-top: 0.45rem !important; }
  .p-8 { padding: 0.85rem !important; }
  .p-6 { padding: 0.65rem !important; }
  .p-5 { padding: 0.6rem !important; }
  .py-2 { padding-top: 0.18rem !important; padding-bottom: 0.18rem !important; }
  .py-3 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
  .mt-12 { margin-top: 0.85rem !important; }
  .mt-8 { margin-top: 0.65rem !important; }
  .mb-12 { margin-bottom: 0.65rem !important; }
  .mb-8 { margin-bottom: 0.5rem !important; }
  .pt-8 { padding-top: 0.55rem !important; }
  .pb-3 { padding-bottom: 0.22rem !important; }
  .gap-y-4 { row-gap: 0.2rem !important; }
  .gap-x-12 { column-gap: 1.25rem !important; }
  /* Darker, print-safe borders so the print-out never renders faint hairlines */
  .border, .border-t, .border-b, .border-l, .border-r,
  [class*="border-gray-100"], [class*="border-gray-200"],
  [class*="border-gray-300"], [class*="border-gray-400"],
  [class*="border-slate-"] {
    border-color: #4b5563 !important;
  }
  table, th, td { border-color: #4b5563 !important; }
  hr { border-color: #4b5563 !important; }
  /* Header logo shouldn't dominate a compact layout */
  header img, .h-20 { height: 3rem !important; }
  /* Neutralize dark-mode variants that ship in the rendered markup */
  .dark\\:bg-slate-900, .dark\\:bg-slate-800, .dark\\:bg-slate-800\\/40,
  .dark\\:bg-gray-900, .dark\\:bg-gray-800 { background-color: transparent !important; }
  .dark\\:text-gray-100, .dark\\:text-gray-200, .dark\\:text-gray-300,
  .dark\\:text-white { color: inherit !important; }
  .dark\\:border-gray-700, .dark\\:border-gray-800, .dark\\:border-gray-600,
  .dark\\:ring-slate-800 { border-color: inherit !important; }
  thead { display: table-header-group; }
  /* Prevent horizontal clipping */
  .overflow-x-auto, .overflow-auto, .overflow-hidden { overflow: visible !important; }
  table { width: 100% !important; table-layout: fixed; border-collapse: collapse; }
  th, td { word-break: break-word; overflow-wrap: anywhere; white-space: normal !important; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  /* Keep tables intact — never split a table across pages */
  table { break-inside: avoid !important; page-break-inside: avoid !important; }

  /* ---- Unbreakable units ----
     Chromium ignores break-inside on flex containers, so force block display
     on every wrapper we need to keep whole. */
  .scenario-block,
  .pdf-fees-signature {
    display: block !important;
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  .scenario-block > *,
  .pdf-fees-signature > * {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  /* Inner rows may still use flex/grid — that's fine, they're small. */

  /* Terms & Conditions: lowest priority, flows wherever there is room */
  .pdf-terms {
    break-before: auto; page-break-before: auto;
    break-inside: auto; page-break-inside: auto;
  }
  img { max-width: 100%; height: auto; }
  .pdf-terms p { text-align: justify; text-justify: inter-word; }

  /* ---- Compact mode (4+ annuity options) ---- */
  .pdf-compact { font-size: 10.8px; line-height: 1.25; }
  .pdf-compact .text-xs { font-size: 9.5px !important; }
  .pdf-compact .text-sm { font-size: 10.5px !important; }
  .pdf-compact .text-base { font-size: 11.5px !important; }
  .pdf-compact .text-lg { font-size: 12.5px !important; }
  .pdf-compact .p-8 { padding: 0.55rem !important; }
  .pdf-compact .p-5 { padding: 0.4rem !important; }
  .pdf-compact .space-y-8 > * + * { margin-top: 0.45rem !important; }
  .pdf-compact .space-y-6 > * + * { margin-top: 0.35rem !important; }
  .pdf-compact .space-y-4 > * + * { margin-top: 0.25rem !important; }
  .pdf-compact .py-2 { padding-top: 0.08rem !important; padding-bottom: 0.08rem !important; }
  .pdf-compact .mb-5 { margin-bottom: 0.3rem !important; }
  .pdf-compact .mb-4 { margin-bottom: 0.22rem !important; }
  .pdf-compact .mt-12 { margin-top: 0.5rem !important; }
  .pdf-compact .pt-8 { padding-top: 0.35rem !important; }
  .pdf-compact th, .pdf-compact td { padding-top: 0.12rem !important; padding-bottom: 0.12rem !important; }

  /* ---- Compact two-page mode (1-3 annuity options) ---- */
  .compact-two-page { font-size: 10.8px; line-height: 1.25; }
  .compact-two-page .text-xs { font-size: 9.5px !important; }
  .compact-two-page .text-sm { font-size: 10.5px !important; }
  .compact-two-page .text-base { font-size: 11.5px !important; }
  .compact-two-page .text-lg { font-size: 12.5px !important; }
  .compact-two-page .p-8 { padding: 0.5rem !important; }
  .compact-two-page .p-5 { padding: 0.35rem !important; }
  .compact-two-page .space-y-8 > * + * { margin-top: 0.4rem !important; }
  .compact-two-page .space-y-6 > * + * { margin-top: 0.3rem !important; }
  .compact-two-page .space-y-4 > * + * { margin-top: 0.2rem !important; }
  .compact-two-page .py-2 { padding-top: 0.06rem !important; padding-bottom: 0.06rem !important; }
  .compact-two-page .py-3 { padding-top: 0.1rem !important; padding-bottom: 0.1rem !important; }
  .compact-two-page .mb-5 { margin-bottom: 0.22rem !important; }
  .compact-two-page .mb-4 { margin-bottom: 0.18rem !important; }
  .compact-two-page .mb-8 { margin-bottom: 0.35rem !important; }
  .compact-two-page .mb-12 { margin-bottom: 0.4rem !important; }
  .compact-two-page .mt-8 { margin-top: 0.5rem !important; }
  .compact-two-page .mt-12 { margin-top: 0.55rem !important; }
  .compact-two-page .pt-8 { padding-top: 0.3rem !important; }
  .compact-two-page .pb-3 { padding-bottom: 0.15rem !important; }
  .compact-two-page .gap-y-4 { row-gap: 0.15rem !important; }
  .compact-two-page .gap-x-12 { column-gap: 0.9rem !important; }
  .compact-two-page header img, .compact-two-page .h-20 { height: 2.6rem !important; }
  .compact-two-page table { border-collapse: collapse; }
  .compact-two-page th, .compact-two-page td { padding-top: 0.1rem !important; padding-bottom: 0.1rem !important; }
  .compact-two-page .scenario-block,
  .compact-two-page .pdf-fees-signature {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }

  /* Editorial quotation system — shared with the on-screen document */
  .quote-document { font-size: 11px !important; line-height: 1.42 !important; }
  .quote-masthead { padding: 0 0 8mm !important; }
  .quote-masthead__top { padding-bottom: 5mm !important; }
  .quote-logo { height: 15mm !important; width: auto !important; }
  .quote-brand-kicker, .quote-eyebrow, .quote-section-heading > span,
  .quote-option-heading > span, .quote-detail-label, .quote-metadata dt {
    font-size: 8px !important;
    letter-spacing: 0.08em !important;
  }
  .quote-company-details { font-size: 8.5px !important; line-height: 1.45 !important; }
  .quote-title-row { padding-top: 6mm !important; }
  .quote-document-title { font-size: 22px !important; line-height: 1.12 !important; }
  .quote-metadata { min-width: 38mm !important; gap: 2mm !important; }
  .quote-section { padding: 6mm 0 !important; }
  .quote-section-heading { margin-bottom: 4mm !important; }
  .quote-section-heading h2, .quote-section-heading h3 { font-size: 14px !important; }
  .quote-details-grid { column-gap: 10mm !important; }
  .quote-detail-item { padding: 2mm 0 !important; grid-template-columns: minmax(29mm, .9fr) minmax(0, 1.1fr) !important; }
  .quote-scenarios-intro { padding-bottom: 3mm !important; }
  .quote-scenario-wrap { padding: 0 0 4mm !important; }
  .quote-scenario { padding: 5mm !important; border-radius: 1.5mm !important; }
  .quote-option-heading { padding-bottom: 3mm !important; }
  .quote-option-section { margin-top: 3mm !important; }
  .quote-option-section h5, .quote-option-subheading { margin-bottom: 2mm !important; font-size: 10px !important; }
  .quote-table-wrap { border-radius: 1.5mm !important; }
  .quote-table { font-size: 9px !important; }
  .quote-table th, .quote-table td { padding: 2mm 3mm !important; }
  .quote-table-note { margin-top: 1.5mm !important; font-size: 8px !important; }
  .quote-acceptance { margin-top: 6mm !important; padding-top: 5mm !important; }
  .quote-acceptance h3 { margin-bottom: 4mm !important; font-size: 11px !important; }
  .quote-signature-grid { gap: 12mm !important; }
  .quote-signature-line { height: 10mm !important; }
  .quote-terms { padding: 6mm 0 0 !important; margin-top: 0 !important; }
  .quote-terms-copy { font-size: 8.5px !important; line-height: 1.5 !important; }

  .compact-two-page .quote-masthead { padding-bottom: 5mm !important; }
  .compact-two-page .quote-masthead__top { padding-bottom: 3mm !important; }
  .compact-two-page .quote-title-row { padding-top: 4mm !important; }
  .compact-two-page .quote-logo { height: 12mm !important; }
  .compact-two-page .quote-section { padding-top: 3.5mm !important; padding-bottom: 3.5mm !important; }
  .compact-two-page .quote-section-heading { margin-bottom: 2.5mm !important; }
  .compact-two-page .quote-detail-item { padding-top: 1.2mm !important; padding-bottom: 1.2mm !important; }
  .compact-two-page .quote-scenario { padding: 3.5mm !important; }
  .compact-two-page .quote-scenario-wrap { padding-bottom: 2.5mm !important; }
  .compact-two-page .quote-acceptance { margin-top: 3mm !important; padding-top: 3mm !important; }

`;


/**
 * Collect every stylesheet the running app currently has loaded so the PDF
 * inherits the same Tailwind utilities, design tokens, and component styles
 * as what the user sees on screen.
 */
async function collectAppStyles(): Promise<string> {
  const parts: string[] = [];
  const sheets = Array.from(document.styleSheets);
  for (const sheet of sheets) {
    try {
      const rules = (sheet as CSSStyleSheet).cssRules;
      if (rules) {
        let css = "";
        for (let i = 0; i < rules.length; i++) css += rules[i].cssText + "\n";
        if (css) parts.push(css);
        continue;
      }
    } catch {
      // cross-origin — fall back to fetching the href
    }
    const href = (sheet as CSSStyleSheet).href;
    if (href) {
      try {
        const res = await fetch(href);
        if (res.ok) parts.push(await res.text());
      } catch {
        /* ignore */
      }
    }
  }
  return parts.join("\n");
}

async function assetToDataUrl(path: string): Promise<string | null> {
  try {
    const response = await fetch(path);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function getDisplayComponent(productType: string, quote: QuoteData) {
  switch (productType) {
    case "Exclusive Annuity":
    case "annuity":
      return React.createElement(AnnuityDisplay, { quote });
    case "Exclusive Funeral":
    case "funeral":
      return React.createElement(FuneralDisplay, { quote });
    case "Exclusive Life Assurance":
      return React.createElement(LifeDisplay, { quote });
    case "Individual Life Cover":
      return React.createElement(IndividualLifeDisplay, { quote });
    default:
      return React.createElement(GenericDisplay, { quote });
  }
}

/**
 * Export a styled PDF for a quote — works without the quote being rendered on screen.
 * Fetches quote data, renders components to HTML string, sends to html-to-pdf endpoint.
 */
export async function exportQuotePdf(
  quoteMongoId: string,
  quoteId: string,
  isLegacy: boolean,
  quoteOverride?: QuoteData
): Promise<void> {
  const baseUrl = window.location.origin;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw";

  // 1. Use the quote already loaded on the page when available, otherwise fetch it.
  const quote = quoteOverride ?? (await fetchQuoteDetails(quoteMongoId, isLegacy));

  // 2. Determine product type
  const isLegacyAnnuity = !quote.productType && !!quote.guaranteedAnnuity;
  const productType = quote.productType || quote.type || (isLegacyAnnuity ? "annuity" : "Insurance Quote");

  // 3. Get client info for header
  const clientInfo = getClientInfo(quote);

  // 4. Render header + display component to static HTML
  const headerHtml = ReactDOMServer.renderToStaticMarkup(
    React.createElement(QuoteHeader, {
      quoteId: quote.quoteId,
      clientName: clientInfo.fullName,
      productType,
      date: quote.createdAt,
      clientEmail: clientInfo.email,
      clientContact: clientInfo.contactNumber,
      clientId: clientInfo.idNumber,
    })
  );

  const displayHtml = ReactDOMServer.renderToStaticMarkup(
    getDisplayComponent(productType, quote)
  );

  // 4b. Replace the on-screen Medical Underwriting <textarea> with plain styled
  // text matching Important Disclosures. If empty, remove the whole section so
  // it doesn't appear in the PDF at all.
  const medNotes = (quote as any).medicalUnderwritingNotes;
  const medNotesText = medNotes && String(medNotes).trim() ? String(medNotes).trim() : "";
  let processedDisplayHtml = displayHtml;
  // Strip the textarea (with or without value attribute)
  processedDisplayHtml = processedDisplayHtml.replace(/<textarea\b[^>]*>[\s\S]*?<\/textarea>/gi, "");
  // Strip the "Save Notes" button area (only present when onSaveNotes is provided)
  processedDisplayHtml = processedDisplayHtml.replace(/<button\b[^>]*>[\s\S]*?Save Notes[\s\S]*?<\/button>/gi, "");
  if (medNotesText) {
    // Replace the entire flex header (heading + status span) with a plain heading,
    // then append the notes paragraph BELOW it so it doesn't sit opposite the title.
    const escaped = medNotesText.replace(/</g, "&lt;");
    processedDisplayHtml = processedDisplayHtml.replace(
      /<div[^>]*class="[^"]*flex[^"]*items-center[^"]*justify-between[^"]*"[^>]*>\s*(<h3[^>]*>\s*Medical Underwriting\s*<\/h3>)[\s\S]*?<\/div>/i,
      `$1<p style="font-size: 0.875rem; color: #4b5563; line-height: 1.625; margin: 0.75rem 0 0 0; white-space: pre-wrap;">${escaped}</p>`
    );
  } else {
    // No notes — remove the entire Medical Underwriting section wrapper
    processedDisplayHtml = processedDisplayHtml.replace(
      /<div[^>]*data-section="medical-underwriting"[^>]*>[\s\S]*?<\/div>\s*<\/div>/i,
      ""
    );
  }

  // 4c. Render terms & conditions if present
  const termsText = quote.termsAndConditions || quote.disclaimerText;
  const termsHtml = termsText
    ? `<section class="quote-section quote-terms pdf-terms">
        <div class="quote-section-heading"><span>Legal</span><h3>Terms &amp; Conditions</h3></div>
        <p class="quote-terms-copy">${termsText}</p>
      </section>`
    : "";

  // 5. Fix relative image URLs. Embed the logo so the PDF server never waits on localhost/preview assets.
  const logoDataUrl = await assetToDataUrl("/exclusive.png");
  let contentHtml = (headerHtml + processedDisplayHtml + termsHtml).replace(
    /src="\/([^"]+)"/g,
    `src="${baseUrl}/$1"`
  );
  if (logoDataUrl) {
    contentHtml = contentHtml.replace(/src="[^"]*\/exclusive\.png"/g, `src="${logoDataUrl}"`);
  }

  const appStyles = await collectAppStyles();

  const appStylesTag = `<style>${appStyles}</style>`;

  // 5b. 4+ annuity option cards → compact typography/spacing.
  const optionCount = (contentHtml.match(/class="[^"]*scenario-block/g) || []).length;
  const printMode = optionCount <= 3 ? "compact-two-page" : optionCount <= 5 ? "pdf-compact" : "";
  const compactClass = printMode ? ` ${printMode}` : "";

  const buildHtml = (bodyInner: string) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Quote PDF</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&family=Wix+Madefor+Display:wght@400..800&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet" />
    ${appStylesTag}
    <style>${PDF_EXTRA_STYLES}</style>
  </head>
  <body style="position: relative;">${bodyInner}</body>
</html>`;

  const rootHtml = `<div class="pdf-root quote-document${compactClass} max-w-5xl mx-auto bg-white">${contentHtml}</div>`;

  const requestPdf = async (docHtml: string): Promise<Blob> => {
    const res = await fetch(`${apiBase}/api/quotes/html-to-pdf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html: docHtml }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PDF generation failed: ${res.status} ${text}`);
    }
    return res.blob();
  };

  // 6. Generate PDF without running header or page numbers.
  const blob = await requestPdf(buildHtml(rootHtml));

  // 7. Download the blob
  const url = URL.createObjectURL(blob);

  const pdfFilename = buildPdfFilename(quote.quoteId, clientInfo.fullName);

  const a = document.createElement("a");
  a.href = url;
  a.download = pdfFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


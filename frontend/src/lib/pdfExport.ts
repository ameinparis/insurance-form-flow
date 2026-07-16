import { fetchQuoteDetails, getClientInfo, QuoteData } from "@/lib/quoteUtils";
import ReactDOMServer from "react-dom/server";
import React from "react";
import { QuoteHeader } from "@/components/QuoteHeader";
import { AnnuityDisplay } from "@/components/quote-displays/AnnuityDisplay";
import { FuneralDisplay } from "@/components/quote-displays/FuneralDisplay";
import { LifeDisplay } from "@/components/quote-displays/LifeDisplay";
import { IndividualLifeDisplay } from "@/components/quote-displays/IndividualLifeDisplay";
import { GenericDisplay } from "@/components/quote-displays/GenericDisplay";

const PDF_STYLES = `
  body {
    font-family: Avenir, Arial, sans-serif;
    background: white;
    color: #0f172a;
    margin: 0;
    padding: 20px;
  }
  h2, h3 { font-weight: 700; margin-bottom: 8px; }
  p { margin: 2px 0; line-height: 1.2; }
  .text-right p { margin: 1px 0; line-height: 1.2; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 13px; vertical-align: top; }
  th { background: #f1f5f9; text-align: left; }
  img { max-width: 100%; height: auto; }
  .h-20 { height: 5rem; }
  .object-contain { object-fit: contain; }
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .items-start { align-items: flex-start; }
  .items-baseline { align-items: baseline; }
  .gap-2 { gap: 0.5rem; }
  .mb-8 { margin-bottom: 2rem; }
  .text-right { text-align: right; }
  .text-sm { font-size: 0.875rem; }
  .text-lg { font-size: 1.125rem; }
  .text-gray-600 { color: #4b5563; }
  .text-gray-400 { color: #9ca3af; }
  .font-semibold { font-weight: 600; }
  .leading-relaxed { line-height: 1.625; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .max-w-7xl { max-width: 80rem; }
  .grid { display: grid; }
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gap-x-12 { column-gap: 3rem; }
  .gap-y-4 { row-gap: 1rem; }
  .gap-y-6 { row-gap: 1.5rem; }
  .mt-1 { margin-top: 0.25rem; }
  .mt-6 { margin-top: 1.5rem; }
  .font-medium { font-weight: 500; }
  .text-muted-foreground { color: #6b7280; }
  .text-foreground { color: #0f172a; }
  .border-border { border-color: #e5e7eb; }
  .border-b { border-bottom: 1px solid #e5e7eb; }
  .border-gray-300 { border-color: #d1d5db; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .mt-8 { margin-top: 2rem; }
  .space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 2rem; }
  .border-b-2 { border-bottom: 2px solid #d1d5db; }
  .pb-2 { padding-bottom: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .pt-8 { padding-top: 2rem; }
  .mt-12 { margin-top: 3rem; }
  .border-t-2 { border-top: 2px solid #d1d5db; }
  .acceptance-section { margin-top: 3rem; padding-top: 2rem; border-top: 2px solid #d1d5db; }
  .acceptance-section h3 { font-weight: 600; margin-bottom: 1rem; }
  .signature-label { font-size: 0.9rem; font-weight: 500; margin-bottom: 4px; }
  .signature-line { border-bottom: 1px solid #c4c7cc; height: 1.8rem; margin-bottom: 1rem; }
  .signature-line.long { height: 3rem; }
  section.space-y-4 > div + p { margin-top: 1.5rem; }
  .scenario-block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 1.25rem; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1rem; }
  .scenario-block table { break-inside: auto; page-break-inside: auto; }
  .scenario-block thead { display: table-header-group; }
  .scenario-block tr { break-inside: avoid; page-break-inside: avoid; }
  .space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 2rem; }
  .space-y-4 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .p-5 { padding: 1.25rem; }
  .mb-2 { margin-bottom: 0.5rem; }
  .mb-5 { margin-bottom: 1.25rem; }
  .gap-y-1 { row-gap: 0.25rem; }

`;

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
    ? `<div style="border-top: 2px solid #d1d5db; padding: 2rem; margin-top: 2rem;">
        <h3 style="font-size: 1.25rem; font-weight: 600; text-align: center; margin-bottom: 1rem;">Terms &amp; Conditions</h3>
        <p style="font-size: 0.875rem; color: #4b5563; line-height: 1.625;">${termsText}</p>
      </div>`
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

  const styles = PDF_STYLES;

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Quote PDF</title>
    <style>${styles}</style>
  </head>
  <body>${contentHtml}</body>
</html>`;

  // 6. Send to html-to-pdf endpoint
  const response = await fetch(`${apiBase}/api/quotes/html-to-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`PDF generation failed: ${response.status} ${text}`);
  }

  // 7. Download the blob
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `quote-${quoteId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}


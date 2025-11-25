import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { QuoteHeader } from "@/components/QuoteHeader";
import { AnnuityDisplay } from "@/components/quote-displays/AnnuityDisplay";
import { FuneralDisplay } from "@/components/quote-displays/FuneralDisplay";
import { LifeDisplay } from "@/components/quote-displays/LifeDisplay";
import { GenericDisplay } from "@/components/quote-displays/GenericDisplay";
import { fetchQuoteDetails, getClientInfo, formatDate, QuoteData } from "@/lib/quoteUtils";
import { useToast } from "@/hooks/use-toast";

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      if (!id) {
        setError("No quote ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const isLegacy = searchParams.get("legacy") === "true";
        const data = await fetchQuoteDetails(id, isLegacy);
        setQuote(data);
      } catch (err) {
        console.error("Error fetching quote:", err);
        setError("Failed to load quote details");
        toast({
          title: "Error",
          description: "Failed to load quote details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
  }, [id, searchParams, toast]);


  async function downloadPdfFromUrl(url: string, filename: string) {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`);

    const blob = await res.blob();

    // sanity: should start with %PDF-
    const head = await blob.slice(0, 5).text();
    if (head !== "%PDF-") {
      const text = await blob.text();
      throw new Error(`Server did not return a PDF:\n${text.slice(0, 300)}`);
    }

    // cross-browser safe download
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = filename;     // avoid slashes in filename!
    a.target = "_blank";       // helps Safari
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    // Safari needs a delay before revoke
    setTimeout(() => {
      URL.revokeObjectURL(objUrl);
      a.remove();
    }, 3000);
  }

  const downloadPDF = async (quoteId: string) => {
    const isLegacy = searchParams.get("legacy") === "true";
    const url = `https://njs.exclusivelife.co.bw/api/quotes/${quoteId}/generate-pdf?legacy=${isLegacy}`;
    await downloadPdfFromUrl(url, `quote-${String(quoteId)}.pdf`);
  };

const exportStyledQuotePDF = async () => {
  try {
    const wrapper = document.getElementById("quote-pdf");
    if (!wrapper) {
      toast({ title: "Error", description: "Quote content not found." });
      return;
    }

    // Convert relative image URLs to absolute
    const baseUrl = window.location.origin;
    const htmlContent = wrapper.outerHTML.replace(/src="\/([^"]+)"/g, `src="${baseUrl}/$1"`);

    // Full HTML wrapper for Puppeteer
  const html = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Quote PDF</title>

    <style>
  /* === Avenir Font Embeds === */
  @font-face {
    font-family: 'Avenir';
    src: url('${window.location.origin}/Assets/Fonts/Avenir Regular.ttf') format('truetype');
    font-weight: 400;
    font-style: normal;
  }

  @font-face {
    font-family: 'Avenir';
    src: url('${window.location.origin}/Assets/Fonts/Avenir Heavy.ttf') format('truetype');
    font-weight: 700;
    font-style: normal;
  }

  @font-face {
    font-family: 'Avenir';
    src: url('${window.location.origin}/Assets/Fonts/Avenir Light.ttf') format('truetype');
    font-weight: 300;
    font-style: normal;
  }

  body {
    font-family: 'Avenir', sans-serif;
    background: white;
    color: #0f172a;
    margin: 0;
    padding: 20px;
  }

  /* Header + Typography */
  h2, h3 { font-weight: 700; margin-bottom: 8px; }
  p { margin: 2px 0; line-height: 1.2; }
  .text-right p { margin: 1px 0; line-height: 1.2; }

  /* Table defaults */
  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 10px; font-size: 13px; vertical-align: top; }
  th { background: #f1f5f9; text-align: left; }

  /* Logo + Basic utilities */
  img { max-width: 100%; height: auto; }
  .h-20 { height: 5rem; }
  .object-contain { object-fit: contain; }

  /* Tailwind equivalents for layout + spacing */
  .flex { display: flex; }
  .justify-between { justify-content: space-between; }
  .items-start { align-items: flex-start; }
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

  /* Grid + Annuity layout */
  .grid { display: grid; }
  .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gap-x-12 { column-gap: 3rem; }
  .gap-y-4 { row-gap: 1rem; }
  .border-b { border-bottom: 1px solid #e5e7eb; }
  .border-gray-300 { border-color: #d1d5db; }
  .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
  .mt-8 { margin-top: 2rem; }
  .space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 2rem; }

  /* Card look */
  .border-b-2 { border-bottom: 2px solid #d1d5db; }
  .pb-2 { padding-bottom: 0.5rem; }
  .mb-4 { margin-bottom: 1rem; }
  .pt-8 { padding-top: 2rem; }
  .mt-12 { margin-top: 3rem; }
  .border-t-2 { border-top: 2px solid #d1d5db; }

  /* === Customer Acceptance Lines === */
  .acceptance-section {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 2px solid #d1d5db;
  }
  .acceptance-section h3 {
    font-weight: 600;
    margin-bottom: 1rem;
  }
  .signature-label {
    font-size: 0.9rem;
    font-weight: 500;
    margin-bottom: 4px;
  }
  .signature-line {
    border-bottom: 1px solid #c4c7cc;
    height: 1.8rem;
    margin-bottom: 1rem;
  }
  .signature-line.long {
    height: 3rem;
  }

  /* === Funeral Display Spacing Fix === */
section.space-y-4 > div + p {
  margin-top: 1.5rem; /* adds nice breathing room after the header section */
}

</style>

    </head>
    <body>
      ${htmlContent}
    </body>
  </html>`;


    // Send to your backend PDF generator
    const res = await fetch("https://njs.exclusivelife.co.bw/api/quotes/html-to-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });

    if (!res.ok) throw new Error("PDF generation failed.");

    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = `quote-${String(quote?._id)}.pdf`;
    a.target = "_blank";
    a.click();
    setTimeout(() => URL.revokeObjectURL(objUrl), 3000);
  } catch (err) {
    console.error("Export PDF failed:", err);
    toast({ title: "Error", description: "Failed to export styled PDF." });
  }
};



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg text-muted-foreground mb-4">{error || "Quote not found"}</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientInfo = getClientInfo(quote);
  const isLegacyAnnuity = !quote.productType && !!quote.guaranteedAnnuity;
  const productType = quote.productType || quote.type || (isLegacyAnnuity ? "annuity" : "Insurance Quote");


  const renderProductDisplay = () => {
    if (!quote) return null;

    switch (productType) {
      case "Exclusive Annuity":
      case "annuity":
        return <AnnuityDisplay quote={quote} />;
      case "Exclusive Funeral":
      case "funeral":
        return <FuneralDisplay quote={quote} />;
      case "life":
        return <LifeDisplay quote={quote} />;
      default:
        return <GenericDisplay quote={quote} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Main Content */}
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} className="dark:border-gray-700 dark:text-gray-300">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={exportStyledQuotePDF} className="dark:border-gray-700 dark:text-gray-300">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>

        </div>

        {/* Quote Document Card */}
        <Card className="border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900">
          <CardContent className="p-0" id="quote-pdf">
            {/* Quote Header */}
            <QuoteHeader
              quoteId={quote.quoteId}
              clientName={clientInfo.fullName}
              productType={productType}
              date={quote.createdAt}
              clientEmail={clientInfo.email}
              clientContact={clientInfo.contactNumber}
              clientId={clientInfo.idNumber}
            />

            {/* Product Details - Dynamic based on product type */}
            {renderProductDisplay()}

            {/* Terms and Conditions / Disclaimer */}
            {(quote.termsAndConditions || quote.disclaimerText) && (
              <div className="border-t-2 border-gray-300 dark:border-gray-700 p-8 bg-gray-50 dark:bg-slate-800">
                <h3 className="text-xl font-semibold text-center mb-4 text-gray-800 dark:text-gray-100">Terms & Conditions</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {quote.termsAndConditions || quote.disclaimerText}
                </p>
              </div>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  );
};

export default QuoteDetail;

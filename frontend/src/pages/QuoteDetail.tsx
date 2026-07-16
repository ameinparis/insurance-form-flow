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
import { IndividualLifeDisplay } from "@/components/quote-displays/IndividualLifeDisplay";
import { GenericDisplay } from "@/components/quote-displays/GenericDisplay";
import { fetchQuoteDetails, getClientInfo, formatDate, QuoteData } from "@/lib/quoteUtils";
import { exportQuotePdf } from "@/lib/pdfExport";
import { useToast } from "@/hooks/use-toast";

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadStarted, setDownloadStarted] = useState(false);
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


  const handleSaveNotes = async (medicalUnderwritingNotes: string) => {
    if (!id) return;
    const apiBase = import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw";
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${apiBase}/api/new-quotes/${id}/notes`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ medicalUnderwritingNotes }),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      setQuote((prev) => (prev ? { ...prev, medicalUnderwritingNotes } : prev));
      toast({ title: "Saved", description: "Medical underwriting notes updated." });
    } catch (err) {
      console.error("Save notes failed:", err);
      toast({ title: "Error", description: "Failed to save notes.", variant: "destructive" });
      throw err;
    }
  };

  const handleDownloadPdf = async () => {
    if (!quote || downloadStarted) return;
    setDownloadStarted(true);
    try {
      const isLegacy = searchParams.get("legacy") === "true";
      await exportQuotePdf(id!, quote.quoteId, isLegacy, quote);
      toast({ title: "Downloaded", description: "Your PDF has been downloaded." });

    } catch (err: any) {
      console.error("Export PDF failed:", err);
      const msg = err?.message || "Failed to export PDF. Please try again.";
      toast({ title: "Download failed", description: msg, variant: "destructive" });
    } finally {
      window.setTimeout(() => setDownloadStarted(false), 1200);
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
      case "Exclusive Life Assurance":
        return <LifeDisplay quote={quote} />;
      case "Individual Life Cover":
        return <IndividualLifeDisplay quote={quote} onSaveNotes={isLegacyAnnuity ? undefined : handleSaveNotes} />;
      default:
        return <GenericDisplay quote={quote} />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Sticky Action Bar */}
      <div className="sticky -top-6 z-30 -mx-6 -mt-6 bg-card px-6 pt-6">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-6 py-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="rounded-full border-2 border-[#009fe3] text-[#009fe3] hover:bg-[#009fe3]/10 px-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={downloadStarted}
            className="rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-900 disabled:opacity-100 text-white px-6 min-w-[148px] focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadStarted ? "Downloading" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* Paper Document */}
      <div className="max-w-5xl mx-auto px-6 pb-12">
        <div
          className="bg-white dark:bg-slate-900 shadow-lg rounded-2xl overflow-hidden ring-1 ring-gray-200/80 dark:ring-slate-800"
          id="quote-pdf"
        >
          <QuoteHeader
            quoteId={quote.quoteId}
            clientName={clientInfo.fullName}
            productType={productType}
            date={quote.createdAt}
            clientEmail={clientInfo.email}
            clientContact={clientInfo.contactNumber}
            clientId={clientInfo.idNumber}
          />

          {renderProductDisplay()}

          {(quote.termsAndConditions || quote.disclaimerText) && (
            <div className="border-t border-border p-8 bg-card">
              <h3 className="text-xl font-semibold text-center mb-4 text-foreground">Terms & Conditions</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {quote.termsAndConditions || quote.disclaimerText}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

};

export default QuoteDetail;

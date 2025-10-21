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

  const handleDownloadPDF = () => {
    toast({
      title: "Coming Soon",
      description: "PDF download functionality will be available soon.",
    });
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
  const productType = quote.productType || quote.type || "Insurance Quote";

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
          <Button onClick={handleDownloadPDF} className="bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Quote Document Card */}
        <Card className="border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900">
          <CardContent className="p-0">
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

        {/* Quote Meta Information */}
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center space-y-1">
          <p>Created by: {quote.createdBy?.name || quote.createdBy?.email || "Unknown"}</p>
          <p>Date: {formatDate(quote.createdAt)}</p>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;

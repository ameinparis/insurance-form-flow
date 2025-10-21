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
    switch (productType) {
      case "Exclusive Annuity":
      case "annuity":
        return <AnnuityDisplay inputs={quote.inputs} outputs={quote.outputs} />;
      case "Exclusive Funeral":
      case "funeral":
        return <FuneralDisplay inputs={quote.inputs} outputs={quote.outputs} />;
      case "life":
        return <LifeDisplay inputs={quote.inputs} outputs={quote.outputs} />;
      default:
        return <GenericDisplay inputs={quote.inputs} outputs={quote.outputs} />;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <QuoteHeader
        quoteId={quote.quoteId}
        clientName={clientInfo.fullName}
        productType={productType}
        date={quote.createdAt}
      />

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Download as PDF
          </Button>
        </div>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium">{clientInfo.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-blue-500">{clientInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact Number</p>
                <p className="font-medium">{clientInfo.contactNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(clientInfo.dateOfBirth)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ID Number</p>
                <p className="font-medium">{clientInfo.idNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quote Created</p>
                <p className="font-medium">{formatDate(quote.createdAt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Product-Specific Display */}
        {renderProductDisplay()}

        {/* Terms and Conditions */}
        {quote.termsAndConditions && (
          <Card>
            <CardHeader>
              <CardTitle>Terms and Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {quote.termsAndConditions}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Created By */}
        {quote.createdBy && (
          <Card>
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground">
                Created by: <span className="font-medium text-foreground">{quote.createdBy.name || quote.createdBy.email}</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuoteDetail;

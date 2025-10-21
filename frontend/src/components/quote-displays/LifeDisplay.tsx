import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/quoteUtils";

interface LifeDisplayProps {
  quote: any;
}

export const LifeDisplay = ({ quote }: LifeDisplayProps) => {
  const { client, inputs, outputs } = quote;
  return (
    <div className="bg-white p-8 space-y-8">
      {/* Product Header */}
      <div className="border-b-2 border-gray-800 pb-2">
        <h2 className="text-2xl font-semibold">Product: Life Insurance</h2>
      </div>

      

      {/* Outputs Section */}
      {outputs && (
        <Card>
          <CardHeader>
            <CardTitle>Premium Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {outputs.monthlyPremium && (
                <div className="bg-primary/5 p-6 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Premium</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(outputs.monthlyPremium)}
                  </p>
                </div>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outputs.annualPremium && (
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Premium</p>
                    <p className="text-lg font-semibold">{formatCurrency(outputs.annualPremium)}</p>
                  </div>
                )}
                {outputs.totalPremiumPayable && (
                  <div>
                    <p className="text-sm text-muted-foreground">Total Premium Payable</p>
                    <p className="text-lg font-semibold">{formatCurrency(outputs.totalPremiumPayable)}</p>
                  </div>
                )}
                {outputs.benefitDetails && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Benefit Details</p>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{outputs.benefitDetails}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

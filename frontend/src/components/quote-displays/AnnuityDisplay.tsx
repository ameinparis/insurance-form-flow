import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/quoteUtils";

interface AnnuityDisplayProps {
  inputs?: any;
  outputs?: any;
}

export const AnnuityDisplay = ({ inputs, outputs }: AnnuityDisplayProps) => {
  return (
    <div className="space-y-6">
      {/* Inputs Section */}
      {inputs && (
        <Card>
          <CardHeader>
            <CardTitle>Annuity Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inputs.initialInvestment && (
                <div>
                  <p className="text-sm text-muted-foreground">Initial Investment</p>
                  <p className="text-lg font-semibold">{formatCurrency(inputs.initialInvestment)}</p>
                </div>
              )}
              {inputs.age && (
                <div>
                  <p className="text-sm text-muted-foreground">Age</p>
                  <p className="text-lg font-semibold">{inputs.age} years</p>
                </div>
              )}
              {inputs.term && (
                <div>
                  <p className="text-sm text-muted-foreground">Term</p>
                  <p className="text-lg font-semibold">{inputs.term} years</p>
                </div>
              )}
              {inputs.withdrawalRate && (
                <div>
                  <p className="text-sm text-muted-foreground">Withdrawal Rate</p>
                  <p className="text-lg font-semibold">{inputs.withdrawalRate}%</p>
                </div>
              )}
              {inputs.growthRate && (
                <div>
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                  <p className="text-lg font-semibold">{inputs.growthRate}%</p>
                </div>
              )}
              {inputs.inflationRate && (
                <div>
                  <p className="text-sm text-muted-foreground">Inflation Rate</p>
                  <p className="text-lg font-semibold">{inputs.inflationRate}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outputs Section */}
      {outputs && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {outputs.monthlyIncome && (
                <div className="bg-primary/5 p-6 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Monthly Income</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(outputs.monthlyIncome)}
                  </p>
                </div>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outputs.annualIncome && (
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Income</p>
                    <p className="text-lg font-semibold">{formatCurrency(outputs.annualIncome)}</p>
                  </div>
                )}
                {outputs.totalValue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                    <p className="text-lg font-semibold">{formatCurrency(outputs.totalValue)}</p>
                  </div>
                )}
                {outputs.projectedValue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Projected Value</p>
                    <p className="text-lg font-semibold">{formatCurrency(outputs.projectedValue)}</p>
                  </div>
                )}
                {outputs.yearsToDepletion && (
                  <div>
                    <p className="text-sm text-muted-foreground">Years to Depletion</p>
                    <p className="text-lg font-semibold">{outputs.yearsToDepletion} years</p>
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

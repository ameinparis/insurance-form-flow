import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/quoteUtils";

interface LifeDisplayProps {
  inputs?: any;
  outputs?: any;
}

export const LifeDisplay = ({ inputs, outputs }: LifeDisplayProps) => {
  return (
    <div className="space-y-6">
      {/* Inputs Section */}
      {inputs && (
        <Card>
          <CardHeader>
            <CardTitle>Life Insurance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inputs.sumAssured && (
                <div>
                  <p className="text-sm text-muted-foreground">Sum Assured</p>
                  <p className="text-lg font-semibold">{formatCurrency(inputs.sumAssured)}</p>
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
                  <p className="text-sm text-muted-foreground">Policy Term</p>
                  <p className="text-lg font-semibold">{inputs.term} years</p>
                </div>
              )}
              {inputs.occupation && (
                <div>
                  <p className="text-sm text-muted-foreground">Occupation</p>
                  <p className="text-lg font-semibold">{inputs.occupation}</p>
                </div>
              )}
              {inputs.smoker !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">Smoker Status</p>
                  <p className="text-lg font-semibold">{inputs.smoker ? "Yes" : "No"}</p>
                </div>
              )}
              {inputs.healthConditions && (
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Health Conditions</p>
                  <p className="text-lg font-semibold">{inputs.healthConditions}</p>
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

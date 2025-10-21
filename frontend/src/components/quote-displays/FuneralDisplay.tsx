import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/quoteUtils";

interface FuneralDisplayProps {
  inputs?: any;
  outputs?: any;
}

export const FuneralDisplay = ({ inputs, outputs }: FuneralDisplayProps) => {
  return (
    <div className="space-y-6">
      {/* Inputs Section */}
      {inputs && (
        <Card>
          <CardHeader>
            <CardTitle>Funeral Plan Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Main Member */}
              {inputs.mainMember && (
                <div>
                  <h3 className="font-semibold mb-3">Main Member</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                    {inputs.mainMember.age && (
                      <div>
                        <p className="text-sm text-muted-foreground">Age</p>
                        <p className="font-medium">{inputs.mainMember.age} years</p>
                      </div>
                    )}
                    {inputs.mainMember.cover && (
                      <div>
                        <p className="text-sm text-muted-foreground">Cover Amount</p>
                        <p className="font-medium">{formatCurrency(inputs.mainMember.cover)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dependents */}
              {inputs.dependents && inputs.dependents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Dependents ({inputs.dependents.length})</h3>
                    <div className="space-y-3">
                      {inputs.dependents.map((dependent: any, idx: number) => (
                        <div key={idx} className="bg-muted/30 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-muted-foreground">Relationship</p>
                              <p className="font-medium">{dependent.relationship || "—"}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Age</p>
                              <p className="font-medium">{dependent.age || "—"} years</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Cover Amount</p>
                              <p className="font-medium">{formatCurrency(dependent.cover)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Additional Options */}
              {inputs.additionalOptions && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Additional Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(inputs.additionalOptions).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-sm text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="font-medium">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
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
                {outputs.totalCover && (
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cover Amount</p>
                    <p className="text-lg font-semibold">{formatCurrency(outputs.totalCover)}</p>
                  </div>
                )}
                {outputs.annualPremium && (
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Premium</p>
                    <p className="text-lg font-semibold">{formatCurrency(outputs.annualPremium)}</p>
                  </div>
                )}
                {outputs.coverBreakdown && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Cover Breakdown</p>
                    <div className="bg-muted/30 p-4 rounded-lg space-y-2">
                      {Object.entries(outputs.coverBreakdown).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                          <span className="font-medium">{formatCurrency(value as number)}</span>
                        </div>
                      ))}
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

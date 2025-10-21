import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/quoteUtils";

interface LifeDisplayProps {
  quote: any;
}

export const LifeDisplay = ({ quote }: LifeDisplayProps) => {
  const { client, inputs, outputs } = quote;
  return (
    <div className="bg-white dark:bg-slate-900 p-8 space-y-8">
      {/* Outputs Section */}
      {outputs && (
        <Card className="border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-gray-100">Premium Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {outputs.monthlyPremium && (
                <div className="bg-gray-100 dark:bg-slate-800 p-6 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Premium</p>
                  <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">
                    {formatCurrency(outputs.monthlyPremium)}
                  </p>
                </div>
              )}
              
              <Separator className="bg-gray-300 dark:bg-gray-700" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {outputs.annualPremium && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Annual Premium</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(outputs.annualPremium)}</p>
                  </div>
                )}
                {outputs.totalPremiumPayable && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Premium Payable</p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(outputs.totalPremiumPayable)}</p>
                  </div>
                )}
                {outputs.benefitDetails && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Benefit Details</p>
                    <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{outputs.benefitDetails}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Acceptance Signature Section */}
      <div className="mt-12 pt-8 border-t-2 border-gray-300 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
          Customer Acceptance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Name:
            </label>
            <div className="border-b-2 border-gray-400 dark:border-gray-600 h-10" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Date:
            </label>
            <div className="border-b-2 border-gray-400 dark:border-gray-600 h-10" />
          </div>
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Signature:
          </label>
          <div className="border-b-2 border-gray-400 dark:border-gray-600 h-16" />
        </div>
      </div>
    </div>
  );
};

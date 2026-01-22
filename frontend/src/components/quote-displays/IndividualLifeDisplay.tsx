import { formatCurrency } from "@/lib/quoteUtils";

interface IndividualLifeDisplayProps {
  quote: any;
}

export const IndividualLifeDisplay = ({ quote }: IndividualLifeDisplayProps) => {
  const { client, inputs, outputs } = quote || {};
  const clientData = client || {};
  const i = inputs || {};
  const o = outputs?.raw || outputs || {};

  const formatPercent = (v: number | null | undefined) =>
    v == null ? "-" : `${Math.round(v)}%`;

  return (
    <div className="bg-white dark:bg-slate-900 p-8 space-y-8 text-sm text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 inline-block">
          Quotation for {clientData?.fullName || "Client Name"}
        </h2>
      </div>

 
  

      {/* Premium Section */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-4 mt-8">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Premium</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">Base premium</td>
                <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                  {formatCurrency(o.basePremium)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">Cashback premium</td>
                <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                  {formatCurrency(o.cashbackPremium)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">Death cover premium</td>
                <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                  {formatCurrency(o.deathCoverPremium)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">Disability cover premium</td>
                <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                  {formatCurrency(o.disabilityCoverPremium)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">Critical illness cover premium</td>
                <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                  {formatCurrency(o.ciCoverPremium)}
                </td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">Cover adjustment factor</td>
                <td className="py-2 text-right font-medium text-gray-800 dark:text-gray-100">
                  {formatPercent(o.coverAdjustmentFactorPercent)}
                </td>
              </tr>
              <tr className="border-t-2 border-gray-200 dark:border-gray-700">
                <td className="py-3 pr-4 font-bold text-gray-800 dark:text-gray-100">Total premium</td>
                <td className="py-3 text-right font-bold text-gray-800 dark:text-gray-100">
                  {formatCurrency(o.totalPremium)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Acceptance Signature Section */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-gray-100">
          Customer Acceptance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Signature:
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
      </div>
    </div>
  );
};

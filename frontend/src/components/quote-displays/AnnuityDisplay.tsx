import { formatCurrency } from "@/lib/quoteUtils";

interface AnnuityDisplayProps {
  quote: any;
}

export const AnnuityDisplay = ({ quote }: AnnuityDisplayProps) => {
  // Support both new and legacy schema
  const clientData = quote.client || {
    fullName: quote.fullName,
    dateOfBirth: quote.dateOfBirth,
    idNumber: quote.idNumber,
    contactNumber: quote.contactNumber,
    email: quote.email
  };

  const inputData = quote.inputs || {
    purchaseAmount: quote.singlePurchasePremium,
    drawdown: quote.drawdown,
    frequency: quote.frequency,
    guaranteedStartAge: quote.guaranteedStartAge,
    age: null
  };

  const outputData = quote.outputs || {
    living: {
      retirement_annuity: quote.guaranteedAnnuity,
      funds_remaining: quote.fundsRemaining,
      guarantee_period: null
    },
    life: {
      monthly_annuity: quote.monthlyLifeAnnuity
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-8 space-y-8">
      {/* Personal & Annuity Details */}
           <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 inline-block">
            Quotation for {clientData?.fullName || "Client Name"}
          </h2>
        </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Date of Birth:</span>
          <span className="text-gray-800 dark:text-gray-100">{clientData?.dateOfBirth || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">ID/Passport Number:</span>
          <span className="text-gray-800 dark:text-gray-100">{clientData?.idNumber || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span>
          <span className="text-gray-800 dark:text-gray-100">{clientData?.contactNumber || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
          <span className="text-gray-800 dark:text-gray-100">{clientData?.email || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Purchase Premium:</span>
          <span className="text-gray-800 dark:text-gray-100">{formatCurrency(inputData?.purchaseAmount)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Drawdown %:</span>
          <span className="text-gray-800 dark:text-gray-100">{inputData?.drawdown || "N/A"}%</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Living Annuity per Month{inputData?.age && inputData?.guaranteedStartAge ? ` (Age ${inputData.age} to ${inputData.guaranteedStartAge})` : ''}:
          </span>
          <span className="font-semibold text-gray-800 dark:text-gray-100">
            {formatCurrency(outputData?.living?.guaranteed_annuity)}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Funds Remaining:</span>
          <span className="text-gray-800 dark:text-gray-100">{formatCurrency(outputData?.living?.funds_remaining)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Frequency:</span>
          <span className="text-gray-800 dark:text-gray-100">{inputData?.frequency || "N/A"}</span>
        </div>
      </div>

      {/* Life Annuity Section */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-4 mt-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Life Annuity</h3>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-3">
          <span className="font-medium text-lg text-gray-700 dark:text-gray-300">Monthly Life Annuity:</span>
          <span className="font-bold text-lg text-gray-800 dark:text-gray-100">{formatCurrency(outputData?.life?.monthly_annuity)}</span>
        </div>
        {outputData?.living?.guarantee_period && (
          <p className="text-sm italic text-gray-600 dark:text-gray-400 mt-4">
            * Life annuity is calculated based on guaranteed period of {outputData.living.guarantee_period} years
          </p>
        )}
      </div>

      {/* Fees Section */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-4 mt-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Living Annuity Fees</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <th colSpan={2} className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800">Upfront Fees</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2">Purchase Premium</td>
                <td className="px-4 py-2">2%</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2">Upfront Commission</td>
                <td className="px-4 py-2">1%</td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th colSpan={2} className="px-4 py-2 pt-4 font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800">Ongoing Fees</th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-300">
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2">Ongoing Commission</td>
                <td className="px-4 py-2">1% p.a</td>
              </tr>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2">Administration Fee</td>
                <td className="px-4 py-2">1% p.a</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Assets Management Fee</td>
                <td className="px-4 py-2">0.75% p.a</td>
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
        {/* <div className="mt-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          
          </label>
          <div className="border-b-2 border-gray-400 dark:border-gray-600 h-16" />
        </div> */}
      </div>
    </div>
  );
};

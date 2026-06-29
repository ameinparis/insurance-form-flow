import { formatCurrency, toTitleCase } from "@/lib/quoteUtils";

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
    age: null,
    upfrontCommission: quote.upfrontCommission,
    ongoingCommission: quote.ongoingCommission,
    guaranteePeriod: quote.guaranteePeriod
  };

  const outputData = quote.outputs || {
    living: {
      retirement_annuity: quote.guaranteedAnnuity,
      funds_remaining: quote.fundsRemaining,
      guarantee_period: null
    },
    life: {
      monthly_annuity: quote.monthlyLifeAnnuity,
      guarantee_period: quote.guaranteePeriod ?? null,
    }
  };

  const scenarios: Array<any> = Array.isArray(quote?.outputs?.scenarios) ? quote.outputs.scenarios : [];
  const hasScenarios = scenarios.length > 1;

  return (
    <div className="bg-white dark:bg-slate-900 p-8 space-y-8">
      {/* Personal & Annuity Details */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-12">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 inline-block">
          Quotation for {toTitleCase(clientData?.fullName) !== "—" ? toTitleCase(clientData?.fullName) : "Client Name"}
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Date of Birth:</span>
          <span className="text-sm text-gray-800 dark:text-gray-100">{clientData?.dateOfBirth || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">ID/Passport Number:</span>
          <span className="text-sm text-gray-800 dark:text-gray-100">{clientData?.idNumber || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Contact:</span>
          <span className="text-sm text-gray-800 dark:text-gray-100">{clientData?.contactNumber || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Email:</span>
          <span className="text-sm text-gray-800 dark:text-gray-100">{clientData?.email || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Purchase Premium:</span>
          <span className="text-sm text-gray-800 dark:text-gray-100">{formatCurrency(inputData?.purchaseAmount)}</span>
        </div>
        {!hasScenarios && (
          <>
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Drawdown %:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{inputData?.drawdown || "N/A"}%</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                Living Annuity per Month{inputData?.age && inputData?.guaranteedStartAge ? ` (Age ${inputData.age} to ${inputData.guaranteedStartAge})` : ''}:
              </span>
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                {formatCurrency(outputData?.living?.guaranteed_annuity)}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Funds Remaining:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{formatCurrency(outputData?.living?.funds_remaining)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Frequency:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{inputData?.frequency || "N/A"}</span>
            </div>
          </>
        )}
      </div>

      {/* Additional Scenarios */}
      {hasScenarios && (
        <div>
          <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-4 mt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Annuity Income Options ({scenarios.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((sc, idx) => {
              const sIn = sc?.inputs || {};
              const sLiving = sc?.outputs?.living || {};
              const sLife = sc?.outputs?.life || null;
              return (
                <div
                  key={sc.id || idx}
                  className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50 dark:bg-slate-800/40"
                >
                  <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-100 mb-3">
                    {sc.label || `Scenario ${idx + 1}`}
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Drawdown:</span>
                      <span className="text-gray-800 dark:text-gray-100">{sIn.drawdown ?? "—"}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
                      <span className="text-gray-800 dark:text-gray-100">{sIn.frequency ?? "—"}</span>
                    </div>
                    {sLiving.guarantee_period != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Guarantee Period:</span>
                        <span className="text-gray-800 dark:text-gray-100">{sLiving.guarantee_period} years</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Living Annuity / {String(sIn.frequency || "period").toLowerCase()}:
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100">
                        {formatCurrency(sLiving.guaranteed_annuity)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Funds Remaining:</span>
                      <span className="text-gray-800 dark:text-gray-100">{formatCurrency(sLiving.funds_remaining)}</span>
                    </div>
                    {sLife?.monthly_annuity != null && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Monthly Life Annuity:</span>
                        <span className="text-gray-800 dark:text-gray-100">{formatCurrency(sLife.monthly_annuity)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Life Annuity Section */}
      {!hasScenarios && (
        <div>
          <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-4 mt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Life Annuity</h3>
          </div>
          <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 py-3">
            <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Monthly Life Annuity:</span>
            <span className="font-bold text-sm text-gray-800 dark:text-gray-100">{formatCurrency(outputData?.life?.monthly_annuity)}</span>
          </div>
          {outputData?.life?.guarantee_period != null && (
            <p className="text-sm italic text-gray-600 dark:text-gray-400 mt-4">
              * Life annuity is calculated based on guaranteed period of {outputData.life.guarantee_period} years
            </p>
          )}
        </div>
      )}

      {/* Fees Section */}
      <div>
        <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-4 mt-8">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Living Annuity Fees</h3>
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
                <td className="px-4 py-2">
                  {/* Display dynamic value or default */}
                  {inputData?.upfrontCommission !== undefined && inputData?.upfrontCommission !== null
                    ? `${inputData.upfrontCommission}%`
                    : "0%"}
                </td>
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
                <td className="px-4 py-2">
                  {/* Display dynamic value or default */}
                  {inputData?.ongoingCommission !== undefined && inputData?.ongoingCommission !== null
                    ? `${inputData.ongoingCommission}% p.a`
                    : "0% p.a"}
                </td>
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
        <h3 className="text-base font-semibold mb-6 text-gray-800 dark:text-gray-100">
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


import { formatCurrency } from "@/lib/quoteUtils";

interface AnnuityDisplayProps {
  quote: any;
}

export const AnnuityDisplay = ({ quote }: AnnuityDisplayProps) => {
  const { client, inputs, outputs } = quote;

  return (
    <div className="bg-white p-8 space-y-8">
      {/* Product Header */}
      <div className="border-b-2 border-gray-800 pb-2">
        <h2 className="text-2xl font-semibold">Product: Exclusive Annuity</h2>
      </div>

      {/* Personal & Annuity Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="font-medium">Date of Birth:</span>
          <span>{client?.dateOfBirth || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="font-medium">ID/Passport Number:</span>
          <span>{client?.idNumber || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="font-medium">Contact:</span>
          <span>{client?.contactNumber || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="font-medium">Email:</span>
          <span>{client?.email || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="font-medium">Purchase Premium:</span>
          <span>{formatCurrency(inputs?.purchaseAmount)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="font-medium">Drawdown %:</span>
          <span>{inputs?.drawdown || "N/A"}%</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="font-medium">
            Living Annuity per Month (Age {inputs?.age || "N/A"} to {inputs?.guaranteedStartAge || "N/A"}):
          </span>
          <span className="font-semibold">
            {formatCurrency(outputs?.living?.retirement_annuity)}
          </span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="font-medium">Funds Remaining:</span>
          <span>{formatCurrency(outputs?.living?.funds_remaining)}</span>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-2">
          <span className="font-medium">Frequency:</span>
          <span>{inputs?.frequency || "N/A"}</span>
        </div>
      </div>

      {/* Life Annuity Section */}
      <div>
        <div className="border-b-2 border-gray-800 pb-2 mb-4 mt-8">
          <h3 className="text-xl font-semibold">Life Annuity</h3>
        </div>
        <div className="flex justify-between border-b border-gray-200 py-3">
          <span className="font-medium text-lg">Monthly Life Annuity:</span>
          <span className="font-bold text-lg">{formatCurrency(outputs?.life?.monthly_annuity)}</span>
        </div>
        <p className="text-sm italic text-gray-600 mt-4">
          * Life annuity is calculated based on guaranteed period of{" "}
          {outputs?.living?.guarantee_period || "N/A"} years
        </p>
      </div>

      {/* Fees Section */}
      <div>
        <div className="border-b-2 border-gray-800 pb-2 mb-4 mt-8">
          <h3 className="text-xl font-semibold">Living Annuity Fees</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm text-left text-gray-700">
            <thead className="bg-gray-100">
              <tr>
                <th colSpan={2} className="px-4 py-2 font-semibold">Upfront Fees</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2">Purchase Premium</td>
                <td className="px-4 py-2">2%</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Upfront Commission</td>
                <td className="px-4 py-2">1%</td>
              </tr>
            </tbody>
            <thead className="bg-gray-100">
              <tr>
                <th colSpan={2} className="px-4 py-2 pt-4 font-semibold">Ongoing Fees</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="px-4 py-2">Ongoing Commission</td>
                <td className="px-4 py-2">1% p.a</td>
              </tr>
              <tr>
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

      {/* Signature Section */}
      <div className="mt-8 flex flex-col sm:flex-row gap-12">
        <div className="flex-1">
          <label className="block font-medium mb-1">Signature:</label>
          <div className="border-b border-black h-8" />
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1">Date:</label>
          <div className="border-b border-black h-8" />
        </div>
      </div>
    </div>
  );
};

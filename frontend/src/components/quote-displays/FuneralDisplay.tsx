import { formatCurrency } from "@/lib/quoteUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface FuneralDisplayProps {
  quote: any;
}

export const FuneralDisplay = ({ quote }: FuneralDisplayProps) => {
  const { client, inputs, outputs } = quote;
  
  // Calculate total monthly premium
  const totalPremium = outputs?.rows?.reduce((sum: number, row: any) => sum + (row.total || 0), 0) || 0;

  return (
    <div className="bg-white dark:bg-slate-900 p-8 space-y-8">
      {/* Personal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
        <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Date of Birth:</span>
          <span className="text-gray-800 dark:text-gray-100">{client?.dateOfBirth || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">ID/Passport Number:</span>
          <span className="text-gray-800 dark:text-gray-100">{client?.idNumber || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Contact:</span>
          <span className="text-gray-800 dark:text-gray-100">{client?.contactNumber || "N/A"}</span>
        </div>
        <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
          <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
          <span className="text-gray-800 dark:text-gray-100">{client?.email || "N/A"}</span>
        </div>
      </div>

      {/* Scheme Details */}
      <div className="mt-8">
        <div className="border-b-2 border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Scheme Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Society Name:</span>
            <span className="text-gray-800 dark:text-gray-100">{inputs?.societyName || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Scheme Type:</span>
            <span className="capitalize text-gray-800 dark:text-gray-100">{inputs?.schemeType || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Number of Lives:</span>
            <span className="text-gray-800 dark:text-gray-100">{inputs?.numberOfLives || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Max Extended Family:</span>
            <span className="text-gray-800 dark:text-gray-100">{inputs?.maxExtendedFamilyMembers || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Profit Target:</span>
            <span className="text-gray-800 dark:text-gray-100">{inputs?.profitTarget || "N/A"}%</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Commission:</span>
            <span className="text-gray-800 dark:text-gray-100">{inputs?.asAndWhenCommission || "N/A"}%</span>
          </div>
        </div>
      </div>

      {/* Cover Levels */}
      <div className="mt-8">
        <div className="border-b-2 border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Cover Levels</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Principal Member:</span>
            <span className="text-gray-800 dark:text-gray-100">{formatCurrency(inputs?.principalMemberCover)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Spouse:</span>
            <span className="text-gray-800 dark:text-gray-100">{formatCurrency(inputs?.spouseCover) || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Children (16 to max):</span>
            <span className="text-gray-800 dark:text-gray-100">{formatCurrency(inputs?.children16toMax)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Children (6 to 15):</span>
            <span className="text-gray-800 dark:text-gray-100">{formatCurrency(inputs?.children6to15)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Children (1 to 5):</span>
            <span className="text-gray-800 dark:text-gray-100">{formatCurrency(inputs?.children1to5)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Children (0 to 1):</span>
            <span className="text-gray-800 dark:text-gray-100">{formatCurrency(inputs?.children0to1)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 py-2">
            <span className="font-medium text-gray-700 dark:text-gray-300">Parents:</span>
            <span className="text-gray-800 dark:text-gray-100">{formatCurrency(inputs?.parentsCover)}</span>
          </div>
        </div>
      </div>

      {/* Premium Breakdown */}
      <div className="mt-8">
        <div className="border-b-2 border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Premium Breakdown</h3>
        </div>
        <Table className="border border-gray-300 dark:border-gray-700">
          <TableHeader>
            <TableRow className="bg-gray-100 dark:bg-slate-800">
              <TableHead className="text-gray-800 dark:text-gray-100">Status</TableHead>
              <TableHead className="text-right text-gray-800 dark:text-gray-100">Count</TableHead>
              <TableHead className="text-right text-gray-800 dark:text-gray-100">Per Member</TableHead>
              <TableHead className="text-right text-gray-800 dark:text-gray-100">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outputs?.rows?.map((row: any, index: number) => (
              <TableRow key={index} className="bg-white dark:bg-slate-900">
                <TableCell className="font-medium text-gray-800 dark:text-gray-100">{row.status}</TableCell>
                <TableCell className="text-right text-gray-800 dark:text-gray-100">{row.count}</TableCell>
                <TableCell className="text-right text-gray-800 dark:text-gray-100">{formatCurrency(row.perMember)}</TableCell>
                <TableCell className="text-right font-semibold text-gray-800 dark:text-gray-100">{formatCurrency(row.total)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-100 dark:bg-slate-800 font-bold">
              <TableCell colSpan={3} className="text-right text-gray-800 dark:text-gray-100">Total Monthly Premium:</TableCell>
              <TableCell className="text-right text-gray-800 dark:text-gray-100">{formatCurrency(totalPremium)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

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

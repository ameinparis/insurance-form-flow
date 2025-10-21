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
    <div className="bg-white p-8 space-y-8">
      {/* Product Header */}
      <div className="border-b-2 border-gray-800 pb-2">
        <h2 className="text-2xl font-semibold">Product: Exclusive Funeral</h2>
      </div>

      {/* Personal Details */}
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
      </div>

      {/* Scheme Details */}
      <div className="mt-8">
        <div className="border-b-2 border-gray-800 pb-2 mb-4">
          <h3 className="text-xl font-semibold">Scheme Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Society Name:</span>
            <span>{inputs?.societyName || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Scheme Type:</span>
            <span className="capitalize">{inputs?.schemeType || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Number of Lives:</span>
            <span>{inputs?.numberOfLives || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Max Extended Family:</span>
            <span>{inputs?.maxExtendedFamilyMembers || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Profit Target:</span>
            <span>{inputs?.profitTarget || "N/A"}%</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Commission:</span>
            <span>{inputs?.asAndWhenCommission || "N/A"}%</span>
          </div>
        </div>
      </div>

      {/* Cover Levels */}
      <div className="mt-8">
        <div className="border-b-2 border-gray-800 pb-2 mb-4">
          <h3 className="text-xl font-semibold">Cover Levels</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Principal Member:</span>
            <span>{formatCurrency(inputs?.principalMemberCover)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Spouse:</span>
            <span>{formatCurrency(inputs?.spouseCover) || "N/A"}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Children (16 to max):</span>
            <span>{formatCurrency(inputs?.children16toMax)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Children (6 to 15):</span>
            <span>{formatCurrency(inputs?.children6to15)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Children (1 to 5):</span>
            <span>{formatCurrency(inputs?.children1to5)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Children (0 to 1):</span>
            <span>{formatCurrency(inputs?.children0to1)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 py-2">
            <span className="font-medium">Parents:</span>
            <span>{formatCurrency(inputs?.parentsCover)}</span>
          </div>
        </div>
      </div>

      {/* Premium Breakdown */}
      <div className="mt-8">
        <div className="border-b-2 border-gray-800 pb-2 mb-4">
          <h3 className="text-xl font-semibold">Premium Breakdown</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Per Member</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {outputs?.rows?.map((row: any, index: number) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{row.status}</TableCell>
                <TableCell className="text-right">{row.count}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.perMember)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(row.total)}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-gray-100 font-bold">
              <TableCell colSpan={3} className="text-right">Total Monthly Premium:</TableCell>
              <TableCell className="text-right">{formatCurrency(totalPremium)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

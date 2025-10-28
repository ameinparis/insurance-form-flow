import { formatCurrency } from "@/lib/quoteUtils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FuneralDisplayProps {
  quote: any;
}

export const FuneralDisplay = ({ quote }: FuneralDisplayProps) => {
  const { client, inputs, outputs } = quote;

  const getRow = (status: string) => outputs?.rows?.find((row: any) => row.memberStatus === status);

const premiumPerFamily = getRow("Premium Per Family")?.totalPremium;
const premiumPerMember = getRow("Premium Per Member")?.totalPremium; // (optional)
const premiumPerParent = getRow("Parents")?.totalPremium;
const premiumPerExtended = getRow("Extended Family")?.totalPremium;


  return (
    <div className="bg-white dark:bg-slate-900 p-8 space-y-10">
      {/* Quotation Notice */}
      <section className="space-y-4">
        <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 inline-block">
            Quotation for {client?.companyName || "Client Name"}
          </h2>
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          This is a quotation only, and it is not the intention to “HOLD COVERED” unless specifically endorsed in writing.
        </p>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          This quotation is based on the information supplied at the time of quoting. Any misrepresentation, material mis-description or non-disclosure shall render any item, section or entire policy avoidable.
        </p>
      </section>

      {/* General Conditions */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">GENERAL CONDITIONS</h3>
        <ul className="list-disc ml-6 text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li>The standard group funeral insurance wording terms and conditions will apply unless otherwise agreed.</li>
          <li>Any additional covers or extensions will be subject to additional premium.</li>
          <li>All values quoted are inclusive of VAT unless otherwise stated.</li>
          <li>This quote is valid for 30 days.</li>
          <li>The quoted premium is inclusive of commission at 10% +VAT</li>
        </ul>
      </section>

      {/* Pricing Summary */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">PRICING SUMMARY</h3>

        {/* Member and Family */}
        <div className="space-y-1">
          <h4 className="font-medium text-gray-700 dark:text-gray-300">1. Member and Family</h4>
          <Table className="border border-gray-300 dark:border-gray-700">
            <TableHeader>
              <TableRow className="bg-gray-100 dark:bg-slate-800">
                <TableHead>Relationship</TableHead>
                <TableHead>Benefit Level</TableHead>
                <TableHead className="text-right">% Cover</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow><TableCell>Main member</TableCell><TableCell>{formatCurrency(inputs?.principalMemberCover)}</TableCell><TableCell className="text-right">100%</TableCell></TableRow>
              <TableRow><TableCell>Spouse</TableCell><TableCell>{formatCurrency(inputs?.spouseCover)}</TableCell><TableCell className="text-right">100%</TableCell></TableRow>
              <TableRow><TableCell>Child 16-21</TableCell><TableCell>{formatCurrency(inputs?.children16toMax)}</TableCell><TableCell className="text-right">100%</TableCell></TableRow>
              <TableRow><TableCell>Child 6-15</TableCell><TableCell>{formatCurrency(inputs?.children6to15)}</TableCell><TableCell className="text-right">75%</TableCell></TableRow>
              <TableRow><TableCell>Child 1-5</TableCell><TableCell>{formatCurrency(inputs?.children1to5)}</TableCell><TableCell className="text-right">50%</TableCell></TableRow>
              <TableRow><TableCell>Child &lt;1</TableCell><TableCell>{formatCurrency(inputs?.children0to1)}</TableCell><TableCell className="text-right">25%</TableCell></TableRow>
              <TableRow className="font-bold bg-gray-100 dark:bg-slate-800">
                <TableCell>Monthly Premium Per Family</TableCell>
                <TableCell>{formatCurrency(premiumPerFamily)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
              <TableRow className="font-bold bg-gray-100 dark:bg-slate-800">
                <TableCell>Monthly Premium Per Member</TableCell>
                <TableCell>{formatCurrency(premiumPerMember)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Parents */}
        <div className="space-y-1">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mt-6">2. Parents and Parents-in-Law</h4>
          <Table className="border border-gray-300 dark:border-gray-700">
            <TableBody>
              <TableRow><TableCell>Parents</TableCell><TableCell>{formatCurrency(inputs?.parentsCover)}</TableCell></TableRow>
              <TableRow className="font-bold bg-gray-100 dark:bg-slate-800">
                <TableCell>Monthly Premium Per Parent</TableCell>
                <TableCell>{formatCurrency(premiumPerParent)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Extended Family */}
        <div className="space-y-1">
          <h4 className="font-medium text-gray-700 dark:text-gray-300 mt-6">3. Extended Family Members</h4>
          <Table className="border border-gray-300 dark:border-gray-700">
            <TableBody>
              <TableRow><TableCell>Extended Family</TableCell><TableCell>{formatCurrency(inputs?.extendedFamilyCover)}</TableCell></TableRow>
              <TableRow className="font-bold bg-gray-100 dark:bg-slate-800">
                <TableCell>Monthly Premium Per Member</TableCell>
                <TableCell>{formatCurrency(premiumPerExtended)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Policy Specifications */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-6">C: Broad Policy Specifications</h3>
        <Table className="border border-gray-300 dark:border-gray-700">
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Eligibility</TableCell>
              <TableCell>All members who are eligible to join the scheme.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Minimum age entry (main member)</TableCell>
              <TableCell>18 years</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Maximum age entry</TableCell>
              <TableCell>
                <ul className="list-disc ml-4">
                  <li>Principal Member 64 years.</li>
                  <li>Spouse 65 years.</li>
                  <li>Children 18 years</li>
                  <li>Parent 80 years</li>
                  <li>Extended Family 65 years</li>
                </ul>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Cover termination</TableCell>
              <TableCell>
                Cover will terminate upon:
                <ul className="list-disc ml-4">
                  <li>the death of the member.</li>
                </ul>
              </TableCell>
            </TableRow>
            {/* <TableRow>
              <TableCell className="font-medium">Waiting Period</TableCell>
              <TableCell></TableCell>
            </TableRow> */}
          </TableBody>
        </Table>
      </section>
            {/* Customer Acceptance Signature Section */}
      <div className="mt-12 pt-8 border-t-2 border-gray-300 dark:border-gray-700">
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

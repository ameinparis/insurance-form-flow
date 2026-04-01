import { formatCurrency, toTitleCase } from "@/lib/quoteUtils";
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
  const { client, inputs, outputs } = quote || {};

  // Fuzzy matching helper — case-insensitive, partial match
  const getRow = (keyword: string) =>
    outputs?.rows?.find(
      (row: any) =>
        row?.memberStatus &&
        row.memberStatus.toLowerCase().includes(keyword.toLowerCase())
    );

  // Extract the relevant premiums safely
  const premiumPerFamilyTotal = getRow("family")?.totalPremium;
  const premiumPerMemberTotal = getRow("member")?.totalPremium;
  const premiumPerFamilyPerBeneficiary = getRow("family")?.premiumPerBeneficiary;
  const premiumPerMemberPerBeneficiary = getRow("member")?.premiumPerBeneficiary;
  const premiumPerParent = getRow("parent")?.totalPremium;
  const premiumPerExtended = getRow("extended")?.totalPremium;

  const hasMoney = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
  };

  const getPremiumLabel = (status: string) => {
    const s = status.toLowerCase();

    if (s.includes("principal")) return "Monthly Premium Per Member";
    if (s.includes("family")) return "Monthly Premium Per Family (includes spouse & children)";
    if (s.includes("adult dependent")) return "Monthly Premium Per Adult Dependent";
    if (s.includes("extended")) return "Monthly Premium Per Extended Member";

    return `Monthly Premium Per ${status}`;
  };

  const monthlyPremiumRows = (outputs?.rows || [])
    .filter((row: any) => hasMoney(row?.premiumPerBeneficiary) && Number(row?.numberOfBeneficiaries) > 0)
    .map((row: any) => ({
      memberStatus: row.memberStatus,
      label: getPremiumLabel(row.memberStatus || ""),
      value: row.premiumPerBeneficiary,
    }));

  // Group cover rows by premium category
  const memberCoverRows = [
    { label: "Principal Member", cover: inputs?.principalMemberCover },
  ].filter((row) => hasMoney(row.cover));

  const familyCoverRows = [
    { label: "Spouse", cover: inputs?.spouseCover },
    { label: "Children age 16 to 19", cover: inputs?.children16toMax },
    { label: "Children age 6 to 15", cover: inputs?.children6to15 },
    { label: "Children age 1 to 5", cover: inputs?.children1to5 },
    { label: "Children age 0 to 1", cover: inputs?.children0to1 },
  ].filter((row) => hasMoney(row.cover));

  const parentCoverRows = [
    { label: "Parents", cover: inputs?.parentsCover },
  ].filter((row) => hasMoney(row.cover));

  const extendedCoverRows = [
    { label: "Extended Family", cover: inputs?.extendedFamilyCover },
  ].filter((row) => hasMoney(row.cover));

  const allCoverRows = [...memberCoverRows, ...familyCoverRows, ...parentCoverRows, ...extendedCoverRows];

  return (
    <div className="bg-card p-8 space-y-10">
      {/* Quotation Notice */}
      <section className="space-y-4">
        <div className="text-center border-b border-border pb-3 mb-12">
          <h2 className="text-xl font-semibold text-foreground inline-block">
            Group Funeral Scheme Quotation for {toTitleCase(client?.companyName) !== "—" ? toTitleCase(client?.companyName) : "Client Name"}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          This is a quotation only, and it is not the intention to "HOLD COVERED" unless specifically endorsed in writing.
        </p>
        <p className="text-sm text-muted-foreground">
          This quotation is based on the information supplied at the time of quoting. Any misrepresentation, material mis-description or non-disclosure shall render any item, section or entire policy avoidable.
        </p>
      </section>

      {/* General Conditions */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          GENERAL CONDITIONS
        </h3>
        <ul className="list-disc ml-6 text-sm text-muted-foreground space-y-1">
          <li>The standard group funeral insurance wording terms and conditions will apply unless otherwise agreed.</li>
          <li>Any additional covers or extensions will be subject to additional premium.</li>
          <li>All values quoted are inclusive of VAT unless otherwise stated.</li>
          <li>This quote is valid for 30 days.</li>
          <li>The quoted premium is inclusive of commission at 10% + VAT.</li>
        </ul>
      </section>

      {/* Cover Amounts */}
      {allCoverRows.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">
            COVER AMOUNTS
          </h3>
          <div className="rounded-xl overflow-hidden border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="font-semibold">Beneficiary</TableHead>
                  <TableHead className="font-semibold">Cover Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allCoverRows.map((row) => (
                  <TableRow key={row.label} className="border-b border-border last:border-b-0">
                    <TableCell className="text-foreground">{row.label}</TableCell>
                    <TableCell className="text-foreground">{formatCurrency(row.cover)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {/* Monthly Premium */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          MONTHLY PREMIUM
        </h3>

        {monthlyPremiumRows.map((row: any, index: number) => (
          <div key={`${row.memberStatus}-${index}`} className="space-y-2">
            <h4 className="font-medium text-foreground">
              {index + 1}. {row.memberStatus}
            </h4>
            <div className="rounded-xl overflow-hidden border border-border">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-semibold text-foreground">{row.label}</TableCell>
                    <TableCell className="font-semibold text-foreground">{formatCurrency(row.value)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        ))}
      </section>

      {/* Policy Specs */}
      <section className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground mt-6">
          C: Broad Policy Specifications
        </h3>
        <div className="rounded-xl overflow-hidden border border-border">
          <Table>
            <TableBody>
              <TableRow className="border-b border-border">
                <TableCell className="font-medium text-foreground">Eligibility</TableCell>
                <TableCell className="text-foreground">All members who are eligible to join the scheme.</TableCell>
              </TableRow>
              <TableRow className="border-b border-border">
                <TableCell className="font-medium text-foreground">Minimum age entry (main member)</TableCell>
                <TableCell className="text-foreground">18 years</TableCell>
              </TableRow>
              <TableRow className="border-b border-border">
                <TableCell className="font-medium text-foreground">Maximum age entry</TableCell>
                <TableCell className="text-foreground">
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
                <TableCell className="font-medium text-foreground">Cover termination</TableCell>
                <TableCell className="text-foreground">
                  Cover will terminate upon:
                  <ul className="list-disc ml-4">
                    <li>the death of the member.</li>
                  </ul>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Customer Acceptance */}
      <div className="mt-12 pt-8 border-t border-border">
        <h3 className="text-lg font-semibold mb-6 text-foreground">
          Customer Acceptance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Signature:
            </label>
            <div className="border-b-2 border-muted-foreground/40 h-10" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Date:
            </label>
            <div className="border-b-2 border-muted-foreground/40 h-10" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-muted-foreground">
              Commencement Date:
            </label>
            <div className="border-b-2 border-muted-foreground/40 h-10" />
          </div>
        </div>
      </div>
    </div>
  );
};

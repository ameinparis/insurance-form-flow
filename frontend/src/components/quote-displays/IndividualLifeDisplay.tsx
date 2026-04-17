import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { formatCurrency, toTitleCase } from "@/lib/quoteUtils";

interface IndividualLifeDisplayProps {
  quote: any;
  onSaveNotes?: (notes: string) => Promise<void>;
}

export const IndividualLifeDisplay = ({ quote, onSaveNotes }: IndividualLifeDisplayProps) => {
  const initialNotes = quote?.medicalUnderwritingNotes || "";
  const [notes, setNotes] = useState<string>(initialNotes);
  const [savedNotes, setSavedNotes] = useState<string>(initialNotes);
  const [saving, setSaving] = useState(false);
  const isDirty = notes !== savedNotes;

  const handleSave = async () => {
    if (!onSaveNotes) return;
    try {
      setSaving(true);
      await onSaveNotes(notes);
      setSavedNotes(notes);
    } finally {
      setSaving(false);
    }
  };

  const { client, inputs, outputs } = quote || {};
  const clientData = client || {};
  const i = inputs || {};
  const o = outputs?.raw || outputs || {};

  const clientName = toTitleCase(clientData?.fullName) !== "—" ? toTitleCase(clientData?.fullName) : "";

  const formatPercent = (v: number | null | undefined) =>
    v == null ? "-" : `${Math.round(v)}%`;

  const formatCashbackOption = (val: any): string => {
    if (val == null || val === "") return "";
    const s = String(val).trim();
    if (/^(none|no[-_ ]?cashback)$/i.test(s)) return "No Cashback";
    // Match patterns like "10-after-5", "10-After5", "10after5", "10_after_5"
    const m = s.match(/(\d+)\s*[-_ ]?\s*after\s*[-_ ]?\s*(\d+)/i);
    if (m) return `${m[1]}% after ${m[2]} years`;
    return prettifyText(s);
  };

  // Convert raw values like "non-smoker", "single_parent" → "Non Smoker", "Single Parent"
  const prettifyText = (val: any): string => {
    if (val == null || val === "") return "";
    const cleaned = String(val).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    return toTitleCase(cleaned);
  };

  return (
    <div className="bg-card p-8 space-y-8 text-sm text-foreground">
      {/* Title Section */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Quotation: Exclusive Life Cover</h2>
        <div className="border-b border-border mt-1" />
      </div>

      {/* Client Details - 2 column grid with underlines */}
      <div className="space-y-5 mt-6">
        <div className="grid grid-cols-2 gap-x-12">
          <div>
            <span className="text-muted-foreground">Name:</span>
            <span className="ml-2 text-foreground font-medium">{clientName}</span>
            <div className="border-b border-border mt-1" />
          </div>
          <div>
            <span className="text-muted-foreground">Date of Birth:</span>
            <span className="ml-2 text-foreground font-medium">{clientData?.dateOfBirth || i?.dateOfBirth || ""}</span>
            <div className="border-b border-border mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-12">
          <div>
            <span className="text-muted-foreground">Gender:</span>
            <span className="ml-2 text-foreground font-medium">{prettifyText(i?.gender || clientData?.gender)}</span>
            <div className="border-b border-border mt-1" />
          </div>
          <div>
            <span className="text-muted-foreground">Age:</span>
            <span className="ml-2 text-foreground font-medium">{i?.age || clientData?.age || ""}</span>
            <div className="border-b border-border mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-12">
          <div>
            <span className="text-muted-foreground">Education:</span>
            <span className="ml-2 text-foreground font-medium">{prettifyText(i?.education)}</span>
            <div className="border-b border-border mt-1" />
          </div>
          <div>
            <span className="text-muted-foreground">Smoker Status:</span>
            <span className="ml-2 text-foreground font-medium">{prettifyText(i?.smokerStatus)}</span>
            <div className="border-b border-border mt-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-12">
          <div>
            <span className="text-muted-foreground">Marriage Status:</span>
            <span className="ml-2 text-foreground font-medium">{prettifyText(i?.marriageStatus)}</span>
            <div className="border-b border-border mt-1" />
          </div>
          <div>
            <span className="text-muted-foreground">Income:</span>
            <span className="ml-2 text-foreground font-medium">{i?.income || ""}</span>
            <div className="border-b border-border mt-1" />
          </div>
        </div>
      </div>

      {/* Product Information */}
      <div>
        <h3 className="text-base font-bold text-foreground">Product Information</h3>
        <div className="border-b border-border mt-1 mb-3" />
        <div className="space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Product Type:</span><span className="text-foreground font-medium">{toTitleCase(i?.product)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Term:</span><span className="text-foreground font-medium">{i?.term ? `${i.term} years` : ""}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Cashback Option:</span><span className="text-foreground font-medium">{formatCashbackOption(i?.cashbackOption)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Death Benefit:</span><span className="text-foreground font-medium">{i?.deathCover ? formatCurrency(i.deathCover) : ""}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Disability Benefit:</span><span className="text-foreground font-medium">{i?.disabilityCover ? formatCurrency(i.disabilityCover) : ""}</span></div>
          {Number(o.ciCoverPremium) > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">Critical Illness Benefit:</span><span className="text-foreground font-medium">{i?.ciCover ? formatCurrency(i.ciCover) : ""}</span></div>
          )}
        </div>
        <div className="border-b border-border mt-3" />
      </div>

      {/* Premium Details */}
      <div>
        <h3 className="text-base font-bold text-foreground">Premium Details</h3>
        <div className="border-b border-border mt-1 mb-4" />

        <div className="rounded-xl overflow-hidden border border-border">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-2.5 px-4 text-left font-semibold text-foreground">Benefit Type</th>
                <th className="py-2.5 px-4 text-left font-semibold text-foreground">Benefit Amount</th>
                <th className="py-2.5 px-4 text-left font-semibold text-foreground">Term</th>
                <th className="py-2.5 px-4 text-right font-semibold text-foreground">Premium</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2.5 px-4 text-muted-foreground">Life Cover</td>
                <td className="py-2.5 px-4 text-foreground">{i?.deathCover ? formatCurrency(i.deathCover) : "—"}</td>
                <td className="py-2.5 px-4 text-foreground">{i?.term ? `${i.term} years` : "—"}</td>
                <td className="py-2.5 px-4 text-right text-foreground">{formatCurrency(o.deathCoverPremium)}</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2.5 px-4 text-muted-foreground">Disability Benefit</td>
                <td className="py-2.5 px-4 text-foreground">{i?.disabilityCover ? formatCurrency(i.disabilityCover) : "—"}</td>
                <td className="py-2.5 px-4 text-foreground">{i?.term ? `${i.term} years` : "—"}</td>
                <td className="py-2.5 px-4 text-right text-foreground">{formatCurrency(o.disabilityCoverPremium)}</td>
              </tr>
              {Number(o.ciCoverPremium) > 0 && (
                <tr className="border-b border-border">
                  <td className="py-2.5 px-4 text-muted-foreground">Critical Illness</td>
                  <td className="py-2.5 px-4 text-foreground">{i?.ciCover ? formatCurrency(i.ciCover) : "—"}</td>
                  <td className="py-2.5 px-4 text-foreground">{i?.term ? `${i.term} years` : "—"}</td>
                  <td className="py-2.5 px-4 text-right text-foreground">{formatCurrency(o.ciCoverPremium)}</td>
                </tr>
              )}
              <tr className="border-b border-border">
                <td className="py-2.5 px-4 text-muted-foreground">Policy Fees</td>
                <td className="py-2.5 px-4 text-foreground">—</td>
                <td className="py-2.5 px-4 text-foreground">—</td>
                <td className="py-2.5 px-4 text-right text-foreground">{formatCurrency((Number(o.basePremium) || 0) + (Number(o.cashbackPremium) || 0))}</td>
              </tr>
              <tr>
                <td colSpan={3} className="py-3 px-4 font-bold text-foreground">Total Monthly Premium</td>
                <td className="py-3 px-4 text-right font-bold text-foreground">{formatCurrency(o.totalPremium)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Medical Underwriting */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Medical Underwriting</h3>
          {onSaveNotes && (
            <span className="text-xs text-muted-foreground">
              {saving ? "Saving..." : isDirty ? "Unsaved changes" : savedNotes ? "Saved" : ""}
            </span>
          )}
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-border rounded-lg p-4 mt-2 min-h-[80px] bg-card text-foreground text-sm placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Enter medical underwriting notes..."
        />
        {onSaveNotes && (
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={handleSave} disabled={!isDirty || saving}>
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Save Notes
            </Button>
          </div>
        )}
      </div>

      {/* Important Disclosures */}
      <div>
        <h3 className="text-base font-bold text-foreground">Important Disclosures</h3>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mt-3">
          <li>This is a quotation only and does not constitute a policy contract. Cover will commence after acceptance and payment of first premium.</li>
          <li>This quotation is based on the information provided at the time of quoting. Non-disclosure or misrepresentation may make the policy voidable.</li>
          <li>The quotation is subject to the Exclusive Life Cover policy wording terms and conditions.</li>
        </ul>
      </div>

      {/* Customer Acceptance */}
      <div className="pt-6">
        <h3 className="text-base font-bold text-foreground mb-6">Customer Acceptance</h3>
        <div className="border-b-2 border-border mb-4" />
        <div className="grid grid-cols-2 gap-x-12">
          <div>
            <span className="text-sm text-muted-foreground">Signature:</span>
            <div className="border-b-2 border-border h-10 mt-1" />
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Date:</span>
            <div className="border-b-2 border-border h-10 mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
};

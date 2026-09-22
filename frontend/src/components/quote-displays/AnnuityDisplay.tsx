import { ReactNode, useEffect, useMemo, useState } from "react";
import { formatCurrency, toTitleCase } from "@/lib/quoteUtils";
import {
  fetchLifeAnnuityPeriods,
  LIFE_ANNUITY_PERIODS,
  LifePeriodResult,
} from "@/lib/lifeAnnuityPeriods";
import { Input } from "@/components/ui/input";
import { A4PaginatedDocument, A4DocumentBlock } from "@/components/document-viewer/A4PaginatedDocument";

// -------------------- Editorial document primitives --------------------

const DocSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
      {title}
    </h3>
    {children}
  </section>
);

const Field = ({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) => (
  <div className="flex items-baseline justify-between gap-6 border-b border-slate-100 py-2 dark:border-slate-800">
    <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    <span
      className={
        "text-right text-sm " +
        (strong ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200")
      }
    >
      {value}
    </span>
  </div>
);

interface AnnuityDisplayProps {
  quote: any;
  isEditing?: boolean;
  editForm?: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    idNumber: string;
    contactNumber: string;
    email: string;
  };
  onFieldChange?: (field: string, value: string) => void;
  pagination?: {
    header: ReactNode;
    termsText?: string;
    termsEditor?: ReactNode;
    onPageCountChange: (count: number) => void;
  };
}

export const AnnuityDisplay = ({ quote, isEditing, editForm, onFieldChange, pagination }: AnnuityDisplayProps) => {
  // Support both new and legacy schema
  const clientData = quote.client || {
    fullName: quote.fullName,
    dateOfBirth: quote.dateOfBirth,
    gender: quote.gender,
    idNumber: quote.idNumber,
    contactNumber: quote.contactNumber,
    email: quote.email
  };

  const inputData = quote.inputs || {
    purchaseAmount: quote.singlePurchasePremium,
    lifePurchaseAmount: quote.lifePurchaseAmount,
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

  // Life annuity guarantee-period table (5/10/15/20 years).
  // If the pdf/export layer already pre-fetched them and attached to the quote,
  // use those directly (avoids an async fetch inside renderToStaticMarkup).
  const preInjected: LifePeriodResult[] | undefined = quote?.outputs?.life?.periods;
  const knownPeriod = outputData?.life?.guarantee_period;
  const knownAnnuity = outputData?.life?.monthly_annuity;

  const initialPeriods: LifePeriodResult[] =
    preInjected && Array.isArray(preInjected) && preInjected.length > 0
      ? preInjected
      : LIFE_ANNUITY_PERIODS.map((p) => ({
          guarantee_period: p,
          monthly_annuity:
            knownPeriod === p && typeof knownAnnuity === "number" ? knownAnnuity : null,
        }));

  const [lifePeriods, setLifePeriods] = useState<LifePeriodResult[]>(initialPeriods);
  const [loadingPeriods, setLoadingPeriods] = useState<boolean>(
    !preInjected && !hasScenarios
  );

  const lifeAge = Number(inputData?.guaranteedStartAge);
  const lifeAmount = Number(inputData?.lifePurchaseAmount ?? inputData?.purchaseAmount);

  useEffect(() => {
    if (hasScenarios || preInjected) return;
    let cancelled = false;
    const needsFetch = initialPeriods.some((p) => p.monthly_annuity == null);
    if (!needsFetch) {
      setLoadingPeriods(false);
      return;
    }
    (async () => {
      const results = await fetchLifeAnnuityPeriods(lifeAge, lifeAmount, {
        guarantee_period: knownPeriod,
        monthly_annuity: knownAnnuity,
      });
      if (!cancelled) {
        setLifePeriods(results);
        setLoadingPeriods(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lifeAge, lifeAmount, knownPeriod, knownAnnuity, hasScenarios]);


  const editing = Boolean(isEditing && editForm && onFieldChange);
  const scenarioGroups = hasScenarios ? groupScenariosByLiving(scenarios) : [];

  const renderClientField = (label: string, field: keyof typeof editForm, type: string = "text") => {
    const value = editForm?.[field] || "";
    if (editing) {
      return (
        <div className="flex items-baseline justify-between gap-4 border-b border-blue-100 py-2 dark:border-blue-900/40">
          <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
          <Input
            type={type}
            value={value}
            onChange={(e) => onFieldChange(field, e.target.value)}
            className="h-7 w-1/2 border-blue-200 bg-blue-50/50 text-sm dark:border-blue-800 dark:bg-blue-950/20"
          />
        </div>
      );
    }
    return <Field label={label} value={clientData?.[field] || "N/A"} />;
  };

  const quotationTitle =
    toTitleCase(clientData?.fullName) !== "—" ? toTitleCase(clientData?.fullName) : "Client Name";

  const summaryFields = (
    <>
      <Field label="Funeral Cover" value={formatCurrency(15000)} />
      <Field label="Purchase Premium" value={formatCurrency(inputData?.purchaseAmount)} strong />
      {!hasScenarios && (
        <>
          <Field label="Drawdown %" value={`${inputData?.drawdown ?? "N/A"}%`} />
          <Field
            label={`Living Annuity per Month${inputData?.age && inputData?.guaranteedStartAge ? ` (Age ${inputData.age} to ${inputData.guaranteedStartAge})` : ""}`}
            value={formatCurrency(outputData?.living?.guaranteed_annuity)}
            strong
          />
          <Field label="Estimated Funds Remaining" value={formatCurrency(outputData?.living?.funds_remaining)} />
          <Field label="Frequency" value={inputData?.frequency || "N/A"} />
          {knownPeriod != null && (
            <Field label="Selected Guarantee Period" value={`${knownPeriod} years`} strong />
          )}
          {knownAnnuity != null && (
            <Field label="Monthly Life Annuity" value={formatCurrency(knownAnnuity)} strong />
          )}
        </>
      )}
    </>
  );

  const documentTitle = (
    <div className="mb-12 pb-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
        Quotation for
      </p>
      {editing ? (
        <Input
          value={editForm?.fullName || ""}
          onChange={(e) => onFieldChange("fullName", e.target.value)}
          className="mt-2 border-blue-200 bg-blue-50/50 text-xl font-semibold dark:border-blue-800 dark:bg-blue-950/20"
        />
      ) : (
        <h2 className="font-heading mt-2 text-[26px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
          {quotationTitle}
        </h2>
      )}
    </div>
  );

  const personalDetails = (
    <div className="bg-white p-8 dark:bg-slate-900">
      {documentTitle}
      <div className="space-y-8">
        <DocSection title="Client Details">
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">
            {editing ? (
              <>
                {renderClientField("Date of Birth", "dateOfBirth")}
                {renderClientField("Gender", "gender")}
                {renderClientField("ID/Passport Number", "idNumber")}
                {renderClientField("Contact", "contactNumber")}
                {renderClientField("Email", "email", "email")}
              </>
            ) : (
              <>
                <Field label="Date of Birth" value={clientData?.dateOfBirth || "N/A"} />
                <Field label="Gender" value={clientData?.gender || "N/A"} />
                <Field label="ID/Passport Number" value={clientData?.idNumber || "N/A"} />
                <Field label="Contact" value={clientData?.contactNumber || "N/A"} />
                <Field label="Email" value={clientData?.email || "N/A"} />
              </>
            )}
          </div>
        </DocSection>

        <DocSection title="Quotation Summary">
          <div className="grid grid-cols-2 gap-x-12 gap-y-4">{summaryFields}</div>
        </DocSection>
      </div>
    </div>
  );

  const scenariosSection = hasScenarios ? (
    <>
      <div className="bg-white px-8 pt-8 dark:bg-slate-900">
        <h3 className="mb-4 mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {scenarioGroups.length > 1 ? `Annuity Income Options (${scenarioGroups.length})` : "Annuity Income Option"}
        </h3>
      </div>
      {scenarioGroups.map((group, idx) => (
        <div key={group.signature} className="bg-white px-8 pb-8 dark:bg-slate-900">
          <ScenarioGroupBlock group={group} index={idx} showOptionLabel={scenarioGroups.length > 1} />
        </div>
      ))}
    </>
  ) : null;

  const lifeSection = !hasScenarios && typeof knownPeriod === "number" ? (
    <div className="bg-white p-8 dark:bg-slate-900">
      <div className="mt-8">
        <DocSection title="Life Annuity — Guarantee Period Options">
          <LifePeriodsTable
            periods={lifePeriods.filter((p) => p.guarantee_period === knownPeriod)}
            selectedPeriods={[knownPeriod]}
            loading={loadingPeriods}
          />
        </DocSection>
      </div>
    </div>
  ) : null;

  const feesAndSignature = (
    <div className="bg-white p-8 dark:bg-slate-900">
      <div className="pdf-fees-signature space-y-8">
        <div className="mt-8">
          <DocSection title="Living Annuity Fees">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Upfront Fees</p>
                <Field label="Purchase Premium" value="2%" />
                <Field
                  label="Upfront Commission"
                  value={
                    inputData?.upfrontCommission !== undefined && inputData?.upfrontCommission !== null
                      ? `${inputData.upfrontCommission}%`
                      : "0%"
                  }
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">Ongoing Fees</p>
                <Field
                  label="Ongoing Commission"
                  value={
                    inputData?.ongoingCommission !== undefined && inputData?.ongoingCommission !== null
                      ? `${inputData.ongoingCommission}% p.a`
                      : "0% p.a"
                  }
                />
                <Field label="Administration Fee" value="1% p.a" />
                <Field label="Assets Management Fee" value="0.75% p.a" />
                <Field label="Funeral Cover Fee" value={`${formatCurrency(20)} p.m`} />
              </div>
            </div>
          </DocSection>
        </div>

        {/* Customer Acceptance */}
        <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-800">
          <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Customer Acceptance
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="h-10 border-b border-slate-400 dark:border-slate-600" />
              <label className="mt-2 block text-xs text-slate-500 dark:text-slate-400">Signature</label>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400 dark:border-slate-600" />
              <label className="mt-2 block text-xs text-slate-500 dark:text-slate-400">Date</label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (pagination) {
    const personalDetailsMeasure = (
      <div className="bg-white p-8 dark:bg-slate-900">
        <div className="mb-12 pb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            Quotation for
          </p>
          <h2 className="font-heading mt-2 text-[26px] font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
            {quotationTitle}
          </h2>
        </div>
        <div className="space-y-8">
          <DocSection title="Client Details">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <Field label="Date of Birth" value={clientData?.dateOfBirth || "N/A"} />
              <Field label="Gender" value={clientData?.gender || "N/A"} />
              <Field label="ID/Passport Number" value={clientData?.idNumber || "N/A"} />
              <Field label="Contact" value={clientData?.contactNumber || "N/A"} />
              <Field label="Email" value={clientData?.email || "N/A"} />
            </div>
          </DocSection>
          <DocSection title="Quotation Summary">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">{summaryFields}</div>
          </DocSection>
        </div>
      </div>
    );

    const renderTerms = (text: string, continued: boolean) => (
      <div className="pdf-terms border-t border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
          {continued ? "Terms & Conditions (continued)" : "Terms & Conditions"}
        </h3>
        <p
          data-splittable-text
          className="text-justify text-sm leading-relaxed text-slate-600 dark:text-slate-300"
        >
          {text}
        </p>
      </div>
    );

    const blocks = useMemo((): A4DocumentBlock[] => {
      const b: A4DocumentBlock[] = [
        { id: "quote-header", content: pagination.header, keepTogether: true },
        { id: "annuity-personal-details", content: personalDetails, measureContent: personalDetailsMeasure, keepTogether: true },
      ];
      if (hasScenarios) {
        b.push({
          id: "annuity-scenarios-heading",
          content: (
            <div className="bg-white px-8 pt-8 dark:bg-slate-900">
              <div className="border-b border-gray-200 pb-2 mb-4 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {scenarioGroups.length > 1 ? `Annuity Income Options (${scenarioGroups.length})` : "Annuity Income Option"}
                </h3>
              </div>
            </div>
          ),
          keepTogether: true,
        });
        scenarioGroups.forEach((group, idx) => {
          b.push({
            id: `annuity-scenario-${idx}`,
            content: (
              <div className="bg-white px-8 pb-8 dark:bg-slate-900">
                <ScenarioGroupBlock group={group} index={idx} showOptionLabel={scenarioGroups.length > 1} />
              </div>
            ),
            keepTogether: true,
          });
        });
      }
      if (lifeSection) b.push({ id: "annuity-life-period", content: lifeSection, keepTogether: true });
      b.push({ id: "annuity-fees-signature", content: feesAndSignature, keepTogether: true });

      if (pagination.termsEditor) {
        const termsEditorMeasure = pagination.termsText ? renderTerms(pagination.termsText, false) : null;
        b.push({ id: "quote-terms-editor", content: pagination.termsEditor, measureContent: termsEditorMeasure, keepTogether: true });
      } else if (pagination.termsText) {
        b.push({
          id: "quote-terms",
          content: renderTerms(pagination.termsText, false),
          splitText: pagination.termsText,
          renderTextChunk: renderTerms,
        });
      }
      return b;
    }, [
      pagination.header,
      personalDetails,
      personalDetailsMeasure,
      hasScenarios,
      scenarioGroups,
      lifeSection,
      feesAndSignature,
      pagination.termsEditor,
      pagination.termsText,
    ]);

    return <A4PaginatedDocument blocks={blocks} onPageCountChange={pagination.onPageCountChange} />;
  }

  return (
    <div className="bg-white dark:bg-slate-900 space-y-8">
      {personalDetails}
      {scenariosSection}
      {lifeSection}
      {feesAndSignature}
    </div>
  );
};

// -------------------- Sub-components --------------------

interface LifePeriodsTableProps {
  periods: LifePeriodResult[];
  selectedPeriods?: number[];
  loading?: boolean;
}

const LifePeriodsTable = ({ periods, selectedPeriods = [], loading }: LifePeriodsTableProps) => (
  <>
  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-slate-50/80 dark:bg-slate-800/40">
          <th className="border-b border-slate-200 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800 dark:text-slate-500" />
          {periods.map((row) => (
            <th
              key={row.guarantee_period}
              className="border-b border-slate-200 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800 dark:text-slate-400"
            >
              {row.guarantee_period}-Year Guarantee
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-slate-700 dark:text-slate-300">
        <tr>
          <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
            Monthly Life Annuity
          </td>
          {periods.map((row) => {
            const isSelected = selectedPeriods.includes(row.guarantee_period);
            return (
              <td
                key={row.guarantee_period}
                className={
                  "px-4 py-3 " +
                  (isSelected
                    ? "font-semibold text-slate-900 dark:text-white"
                    : "text-slate-700 dark:text-slate-200")
                }
              >
                {row.monthly_annuity != null
                  ? formatCurrency(row.monthly_annuity)
                  : loading
                  ? "Calculating…"
                  : "—"}
              </td>
            );
          })}
        </tr>
      </tbody>
    </table>
  </div>
  <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">
    Life Annuity Guaranteed Period Options are based on zero escalation.
  </p>
  </>
);

// -------------------- Grouping helpers --------------------

const roundish = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : v ?? null;
};

const livingSignature = (sc: any) => {
  const i = sc?.inputs || {};
  const l = sc?.outputs?.living || {};
  return JSON.stringify({
    drawdown: roundish(i.drawdown),
    frequency: (i.frequency ?? "").toString().toLowerCase(),
    age: roundish(i.guaranteedStartAge),
    purchase: roundish(i.purchaseAmount),
    lifePurchase: roundish(i.lifePurchaseAmount ?? i.purchaseAmount),
    livGuarantee: roundish(l.guarantee_period),
    livAnnuity: roundish(l.guaranteed_annuity),
    livFunds: roundish(l.funds_remaining),
  });
};

interface ScenarioGroup {
  signature: string;
  scenarios: any[];
}

const groupScenariosByLiving = (scenarios: any[]): ScenarioGroup[] => {
  const map = new Map<string, ScenarioGroup>();
  for (const sc of scenarios) {
    const sig = livingSignature(sc);
    const existing = map.get(sig);
    if (existing) existing.scenarios.push(sc);
    else map.set(sig, { signature: sig, scenarios: [sc] });
  }
  return Array.from(map.values());
};

// -------------------- Group block --------------------

interface ScenarioGroupBlockProps {
  group: ScenarioGroup;
  index: number;
  showOptionLabel?: boolean;
}

const ScenarioGroupBlock = ({ group, index, showOptionLabel = true }: ScenarioGroupBlockProps) => {
  // Representative scenario for shared living details
  const rep = group.scenarios[0];
  const inputs = rep?.inputs || {};
  const living = rep?.outputs?.living || {};

  // Collect selected life guarantee periods across all scenarios in the group
  const selectedPeriods = Array.from(
    new Set(
      group.scenarios
        .map((s) => s?.outputs?.life?.guarantee_period)
        .filter((p): p is number => typeof p === "number")
    )
  ).sort((a, b) => a - b);

  // Merge pre-injected periods from any scenario that has them
  const preInjectedRaw: LifePeriodResult[] | undefined = group.scenarios
    .map((s) => s?.outputs?.life?.periods)
    .find((p) => Array.isArray(p) && p.length > 0);

  // Seed known (period, monthly_annuity) pairs from group members
  const knownByPeriod = new Map<number, number>();
  for (const s of group.scenarios) {
    const gp = s?.outputs?.life?.guarantee_period;
    const ma = s?.outputs?.life?.monthly_annuity;
    if (typeof gp === "number" && typeof ma === "number") knownByPeriod.set(gp, ma);
  }

  // Only show columns for periods actually selected within this group
  const hasLife = selectedPeriods.length > 0;

  const preInjected = preInjectedRaw
    ? preInjectedRaw.filter((p) => selectedPeriods.includes(p.guarantee_period))
    : undefined;

  const initial: LifePeriodResult[] =
    preInjected && preInjected.length > 0
      ? preInjected
      : selectedPeriods.map((p) => ({
          guarantee_period: p,
          monthly_annuity: knownByPeriod.has(p) ? knownByPeriod.get(p)! : null,
        }));

  const [periods, setPeriods] = useState<LifePeriodResult[]>(initial);
  const [loading, setLoading] = useState<boolean>(
    hasLife && !preInjected && initial.some((p) => p.monthly_annuity == null)
  );

  const age = Number(inputs.guaranteedStartAge);
  const amount = Number(inputs.lifePurchaseAmount ?? inputs.purchaseAmount);

  useEffect(() => {
    if (!hasLife || preInjected) return;
    if (!initial.some((p) => p.monthly_annuity == null)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const firstKnownPeriod = selectedPeriods[0];
      const firstKnownAnnuity = firstKnownPeriod != null ? knownByPeriod.get(firstKnownPeriod) : undefined;
      const results = await fetchLifeAnnuityPeriods(age, amount, {
        guarantee_period: firstKnownPeriod ?? null,
        monthly_annuity: firstKnownAnnuity ?? null,
      });
      const filtered = results
        .filter((r) => selectedPeriods.includes(r.guarantee_period))
        .map((r) =>
          knownByPeriod.has(r.guarantee_period)
            ? { ...r, monthly_annuity: knownByPeriod.get(r.guarantee_period)! }
            : r
        );
      if (!cancelled) {
        setPeriods(filtered);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [age, amount]);

  const frequency = inputs.frequency || "period";
  const livingLabel = `Living Annuity / ${String(frequency).toLowerCase()}`;

  return (
    <div className="scenario-block border border-gray-200 dark:border-gray-800 rounded-lg p-5">
      {showOptionLabel && (
        <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Option {index + 1}
          {inputs.drawdown != null ? ` — ${inputs.drawdown}% Drawdown` : ""}
        </h4>
      )}


      {/* Living Annuity summary — shared across grouped scenarios */}
      <div className="mb-5">
        <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Living Annuity
        </h5>
        <div className="grid grid-cols-2 gap-x-12 gap-y-0">
          <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
            <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Drawdown:</span>
            <span className="text-sm text-gray-800 dark:text-gray-100">{inputs.drawdown ?? "—"}%</span>
          </div>
          <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
            <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Frequency:</span>
            <span className="text-sm text-gray-800 dark:text-gray-100">{inputs.frequency ?? "—"}</span>
          </div>
          {living?.guarantee_period != null && (
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Living Guarantee Period:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{living.guarantee_period} years</span>
            </div>
          )}
          <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
            <span className="font-medium text-sm text-gray-500 dark:text-gray-400">{livingLabel}:</span>
            <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{formatCurrency(living?.guaranteed_annuity)}</span>
          </div>
          <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
            <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Estimated Funds Remaining:</span>
            <span className="text-sm text-gray-800 dark:text-gray-100">{formatCurrency(living?.funds_remaining)}</span>
          </div>
        </div>
      </div>

      {/* Life annuity guarantee period comparison — only if any life option was selected */}
      {hasLife && (
        <div>
          <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Life Annuity — Guarantee Period Options
          </h5>
          <LifePeriodsTable periods={periods} selectedPeriods={selectedPeriods} loading={loading} />
        </div>
      )}
    </div>
  );
};



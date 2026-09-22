import { useEffect, useState } from "react";
import { formatCurrency, toTitleCase } from "@/lib/quoteUtils";
import {
  fetchLifeAnnuityPeriods,
  LIFE_ANNUITY_PERIODS,
  LifePeriodResult,
} from "@/lib/lifeAnnuityPeriods";
import { Input } from "@/components/ui/input";

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
}

export const AnnuityDisplay = ({ quote, isEditing, editForm, onFieldChange }: AnnuityDisplayProps) => {
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
        <div className="flex items-baseline gap-2 border-b border-blue-100 dark:border-blue-900/40 py-2">
          <span className="font-medium text-sm text-gray-500 dark:text-gray-400">{label}:</span>
          <Input
            type={type}
            value={value}
            onChange={(e) => onFieldChange(field, e.target.value)}
            className="h-7 text-sm bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
          />
        </div>
      );
    }
    const displayValue = clientData?.[field] || "N/A";
    return (
      <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
        <span className="font-medium text-sm text-gray-500 dark:text-gray-400">{label}:</span>
        <span className="text-sm text-gray-800 dark:text-gray-100">{displayValue}</span>
      </div>
    );
  };

  const personalDetails = (
    <div className="bg-white p-8 dark:bg-slate-900">
      {/* Personal & Annuity Details */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-12">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 inline-block">
          {editing ? (
            <Input
              value={editForm?.fullName || ""}
              onChange={(e) => onFieldChange("fullName", e.target.value)}
              className="text-center font-semibold bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
            />
          ) : (
            `Quotation for ${toTitleCase(clientData?.fullName) !== "—" ? toTitleCase(clientData?.fullName) : "Client Name"}`
          )}
        </h2>
      </div>
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
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Date of Birth:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{clientData?.dateOfBirth || "N/A"}</span>
            </div>
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Gender:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{clientData?.gender || "N/A"}</span>
            </div>
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">ID/Passport Number:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{clientData?.idNumber || "N/A"}</span>
            </div>
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Contact:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{clientData?.contactNumber || "N/A"}</span>
            </div>
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Email:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{clientData?.email || "N/A"}</span>
            </div>
          </>
        )}
        <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Funeral Cover:</span>
          <span className="text-sm text-gray-800 dark:text-gray-100">{formatCurrency(15000)}</span>
        </div>
        <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
          <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Purchase Premium:</span>
          <span className="text-sm text-gray-800 dark:text-gray-100">{formatCurrency(inputData?.purchaseAmount)}</span>
        </div>
        {!hasScenarios && (
          <>
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Drawdown %:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{inputData?.drawdown || "N/A"}%</span>
            </div>
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">
                Living Annuity per Month{inputData?.age && inputData?.guaranteedStartAge ? ` (Age ${inputData.age} to ${inputData.guaranteedStartAge})` : ''}:
              </span>
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                {formatCurrency(outputData?.living?.guaranteed_annuity)}
              </span>
            </div>
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Estimated Funds Remaining:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{formatCurrency(outputData?.living?.funds_remaining)}</span>
            </div>
            <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
              <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Frequency:</span>
              <span className="text-sm text-gray-800 dark:text-gray-100">{inputData?.frequency || "N/A"}</span>
            </div>
            {knownPeriod != null && (
              <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
                <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Selected Guarantee Period:</span>
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{knownPeriod} years</span>
              </div>
            )}
            {knownAnnuity != null && (
              <div className="flex items-baseline gap-2 border-b border-gray-100 dark:border-gray-800 py-2">
                <span className="font-medium text-sm text-gray-500 dark:text-gray-400">Monthly Life Annuity:</span>
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">{formatCurrency(knownAnnuity)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const scenariosSection = hasScenarios ? (
    <>
      <div className="bg-white px-8 pt-8 dark:bg-slate-900">
        <div>
            <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-4 mt-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {scenarioGroups.length > 1 ? `Annuity Income Options (${scenarioGroups.length})` : "Annuity Income Option"}
              </h3>
            </div>
          </div>
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
      <div>
          <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-4 mt-8">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Life Annuity — Guarantee Period Options
            </h3>
          </div>
          <LifePeriodsTable
            periods={lifePeriods.filter((p) => p.guarantee_period === knownPeriod)}
            selectedPeriods={[knownPeriod]}
            loading={loadingPeriods}
          />
      </div>
    </div>
  ) : null;

  const feesAndSignature = (
    <div className="bg-white p-8 dark:bg-slate-900">
      <div className="pdf-fees-signature space-y-8">
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
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2">Assets Management Fee</td>
                <td className="px-4 py-2">0.75% p.a</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Funeral Cover Fee</td>
                <td className="px-4 py-2">{formatCurrency(20)} p.m</td>
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
        <div className="grid grid-cols-2 gap-8">
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
    </div>
  );


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
  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="bg-gray-50 dark:bg-slate-800/40">
          <th className="px-4 py-3 text-left font-semibold text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800" />
          {periods.map((row) => (
            <th
              key={row.guarantee_period}
              className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-800"
            >
              {row.guarantee_period}-Year Guarantee
              {selectedPeriods.includes(row.guarantee_period) && (
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-gray-700 dark:text-gray-300">
        <tr>
          <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">
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
                    ? "font-semibold text-gray-900 dark:text-white"
                    : "text-gray-800 dark:text-gray-100")
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
  <p className="mt-2 text-xs italic text-gray-500 dark:text-gray-400">
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



import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/quoteUtils";
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
        <div className="quote-detail-item quote-detail-item--editing">
          <span className="quote-detail-label">{label}</span>
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
      <div className="quote-detail-item">
        <span className="quote-detail-label">{label}</span>
        <span className="quote-detail-value">{displayValue}</span>
      </div>
    );
  };

  const personalDetails = (
    <section className="quote-section quote-client-section">
      {/* Personal & Annuity Details */}
      <div className="quote-section-heading">
        <span>01</span>
        <h2>
          {editing ? (
            <Input
              value={editForm?.fullName || ""}
              onChange={(e) => onFieldChange("fullName", e.target.value)}
              className="text-center font-semibold bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800"
            />
          ) : (
            "Client details"
          )}
        </h2>
      </div>
      <div className="quote-details-grid">
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
            <div className="quote-detail-item">
              <span className="quote-detail-label">Date of Birth</span>
              <span className="quote-detail-value">{clientData?.dateOfBirth || "N/A"}</span>
            </div>
            <div className="quote-detail-item">
              <span className="quote-detail-label">Gender</span>
              <span className="quote-detail-value">{clientData?.gender || "N/A"}</span>
            </div>
            <div className="quote-detail-item">
              <span className="quote-detail-label">ID / Passport Number</span>
              <span className="quote-detail-value">{clientData?.idNumber || "N/A"}</span>
            </div>
            <div className="quote-detail-item">
              <span className="quote-detail-label">Contact</span>
              <span className="quote-detail-value">{clientData?.contactNumber || "N/A"}</span>
            </div>
            <div className="quote-detail-item">
              <span className="quote-detail-label">Email</span>
              <span className="quote-detail-value">{clientData?.email || "N/A"}</span>
            </div>
          </>
        )}
        <div className="quote-detail-item">
          <span className="quote-detail-label">Funeral Cover</span>
          <span className="quote-detail-value">{formatCurrency(15000)}</span>
        </div>
        <div className="quote-detail-item">
          <span className="quote-detail-label">Purchase Premium</span>
          <span className="quote-detail-value quote-detail-value--strong">{formatCurrency(inputData?.purchaseAmount)}</span>
        </div>
        {!hasScenarios && (
          <>
            <div className="quote-detail-item">
              <span className="quote-detail-label">Drawdown</span>
              <span className="quote-detail-value">{inputData?.drawdown || "N/A"}%</span>
            </div>
            <div className="quote-detail-item">
              <span className="quote-detail-label">
                Living Annuity per Month{inputData?.age && inputData?.guaranteedStartAge ? ` · Age ${inputData.age} to ${inputData.guaranteedStartAge}` : ''}
              </span>
              <span className="quote-detail-value quote-detail-value--strong">
                {formatCurrency(outputData?.living?.guaranteed_annuity)}
              </span>
            </div>
            <div className="quote-detail-item">
              <span className="quote-detail-label">Estimated Funds Remaining</span>
              <span className="quote-detail-value">{formatCurrency(outputData?.living?.funds_remaining)}</span>
            </div>
            <div className="quote-detail-item">
              <span className="quote-detail-label">Frequency</span>
              <span className="quote-detail-value">{inputData?.frequency || "N/A"}</span>
            </div>
            {knownPeriod != null && (
              <div className="quote-detail-item">
                <span className="quote-detail-label">Selected Guarantee Period</span>
                <span className="quote-detail-value quote-detail-value--strong">{knownPeriod} years</span>
              </div>
            )}
            {knownAnnuity != null && (
              <div className="quote-detail-item">
                <span className="quote-detail-label">Monthly Life Annuity</span>
                <span className="quote-detail-value quote-detail-value--strong">{formatCurrency(knownAnnuity)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );

  const scenariosSection = hasScenarios ? (
    <>
      <div className="quote-section quote-scenarios-intro">
        <div className="quote-section-heading">
              <span>02</span>
              <h3>
              {scenarioGroups.length > 1 ? `Annuity Income Options (${scenarioGroups.length})` : "Annuity Income Option"}
              </h3>
        </div>
      </div>
      {scenarioGroups.map((group, idx) => (
        <div key={group.signature} className="quote-scenario-wrap">
          <ScenarioGroupBlock group={group} index={idx} showOptionLabel={scenarioGroups.length > 1} />
        </div>
      ))}
    </>
  ) : null;

  const lifeSection = !hasScenarios && typeof knownPeriod === "number" ? (
    <section className="quote-section">
          <div className="quote-section-heading">
            <span>02</span>
            <h3>
              Life Annuity — Guarantee Period Options
            </h3>
          </div>
          <LifePeriodsTable
            periods={lifePeriods.filter((p) => p.guarantee_period === knownPeriod)}
            selectedPeriods={[knownPeriod]}
            loading={loadingPeriods}
          />
    </section>
  ) : null;

  const feesAndSignature = (
    <section className="quote-section quote-fees-section">
      <div className="pdf-fees-signature">
      {/* Fees Section */}
      <div>
        <div className="quote-section-heading">
          <span>03</span>
          <h3>Living Annuity Fees</h3>
        </div>
        <div className="quote-table-wrap">
          <table className="quote-table">
            <thead>
              <tr>
                <th colSpan={2}>Upfront Fees</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Purchase Premium</td>
                <td>2%</td>
              </tr>
              <tr>
                <td>Upfront Commission</td>
                <td>
                  {/* Display dynamic value or default */}
                  {inputData?.upfrontCommission !== undefined && inputData?.upfrontCommission !== null
                    ? `${inputData.upfrontCommission}%`
                    : "0%"}
                </td>
              </tr>
            </tbody>
            <thead>
              <tr>
                <th colSpan={2}>Ongoing Fees</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ongoing Commission</td>
                <td>
                  {/* Display dynamic value or default */}
                  {inputData?.ongoingCommission !== undefined && inputData?.ongoingCommission !== null
                    ? `${inputData.ongoingCommission}% p.a`
                    : "0% p.a"}
                </td>
              </tr>
              <tr>
                <td>Administration Fee</td>
                <td>1% p.a</td>
              </tr>
              <tr>
                <td>Assets Management Fee</td>
                <td>0.75% p.a</td>
              </tr>
              <tr>
                <td>Funeral Cover Fee</td>
                <td>{formatCurrency(20)} p.m</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Acceptance Signature Section */}
      <div className="quote-acceptance">
        <h3>
          Customer Acceptance
        </h3>
        <div className="quote-signature-grid">
          <div>
            <label>
              Signature
            </label>
            <div className="quote-signature-line" />
          </div>
          <div>
            <label>
              Date
            </label>
            <div className="quote-signature-line" />
          </div>
        </div>
        {/* <div className="mt-6">
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          
          </label>
          <div className="border-b-2 border-gray-400 dark:border-gray-600 h-16" />
        </div> */}
      </div>
      </div>
    </section>
  );


  return (
    <div className="quote-document-body">
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
  <div className="quote-table-wrap">
    <table className="quote-table quote-life-table">
      <thead>
        <tr>
          <th />
          {periods.map((row) => (
            <th
              key={row.guarantee_period}
              className="quote-period-heading"
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
          <td className="quote-row-heading">
            Monthly Life Annuity
          </td>
          {periods.map((row) => {
            const isSelected = selectedPeriods.includes(row.guarantee_period);
            return (
              <td
                key={row.guarantee_period}
                className={
                  "quote-table-value " +
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
  <p className="quote-table-note">
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
    <article className="scenario-block quote-scenario">
      {showOptionLabel && (
        <div className="quote-option-heading">
          <span>Option {String(index + 1).padStart(2, "0")}</span>
          <h4>{inputs.drawdown != null ? `${inputs.drawdown}% Drawdown` : "Annuity option"}</h4>
        </div>
      )}


      {/* Living Annuity summary — shared across grouped scenarios */}
      <div className="quote-option-section">
        <h5>
          Living Annuity
        </h5>
        <div className="quote-details-grid quote-details-grid--compact">
          <div className="quote-detail-item">
            <span className="quote-detail-label">Drawdown</span>
            <span className="quote-detail-value">{inputs.drawdown ?? "—"}%</span>
          </div>
          <div className="quote-detail-item">
            <span className="quote-detail-label">Frequency</span>
            <span className="quote-detail-value">{inputs.frequency ?? "—"}</span>
          </div>
          {living?.guarantee_period != null && (
            <div className="quote-detail-item">
              <span className="quote-detail-label">Living Guarantee Period</span>
              <span className="quote-detail-value">{living.guarantee_period} years</span>
            </div>
          )}
          <div className="quote-detail-item">
            <span className="quote-detail-label">{livingLabel}</span>
            <span className="quote-detail-value quote-detail-value--strong">{formatCurrency(living?.guaranteed_annuity)}</span>
          </div>
          <div className="quote-detail-item">
            <span className="quote-detail-label">Estimated Funds Remaining</span>
            <span className="quote-detail-value">{formatCurrency(living?.funds_remaining)}</span>
          </div>
        </div>
      </div>

      {/* Life annuity guarantee period comparison — only if any life option was selected */}
      {hasLife && (
        <div>
          <h5 className="quote-option-subheading">
            Life Annuity — Guarantee Period Options
          </h5>
          <LifePeriodsTable periods={periods} selectedPeriods={selectedPeriods} loading={loading} />
        </div>
      )}
    </article>
  );
};



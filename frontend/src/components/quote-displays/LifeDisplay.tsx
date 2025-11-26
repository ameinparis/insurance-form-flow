import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/quoteUtils";

interface LifeDisplayProps {
  quote: any;
}

export const LifeDisplay = ({ quote }: LifeDisplayProps) => {
  const { client, outputs } = quote || {};
  const o = outputs || {};

  const formatPercentFromFraction = (v: number | null | undefined) =>
    v == null ? "-" : `${(v * 100).toFixed(3)}%`;

  return (
    <div className="bg-white dark:bg-slate-900 p-8 space-y-8 text-sm text-gray-800 dark:text-gray-100">
      {/* HEADER */}
      <section>
        <div className="font-semibold"><span>{client?.schemeName || client?.companyName || "-"}</span></div>
        <div className="font-semibold">QUOTATION FOR GROUP LIFE ASSURANCE</div>
        <div className="flex justify-between mt-2">
          <span>PERIOD</span>
          <span className="font-semibold">2025/2026</span>
        </div>
  
      </section>

      <Card className="border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900">
        <CardContent className="space-y-8 pt-6">
          {/* A. POLICY PARAMETERS */}
          <section className="space-y-3">
            <div className="font-semibold">A&nbsp;&nbsp;Policy Parameters</div>

            <div className="border border-gray-300 dark:border-gray-700 rounded-md p-4 space-y-4">
              <div className="font-semibold text-xs uppercase tracking-wide mb-1">
                Covers (2025–2026)
              </div>
              {/* simple 2-column version of the “yellow highlighted” table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    <tr>
                      <td className="py-1 pr-4 align-top">Death Benefit</td>
                      <td className="py-1 font-semibold text-right">
                        4 × Annual Salary
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 align-top">ODB</td>
                      <td className="py-1 font-semibold text-right">
                        4 × Annual Salary
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 align-top">Top Up benefit</td>
                      <td className="py-1 font-semibold text-right">
                        {formatCurrency(20000)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 align-top">
                        Total annual earnings – 2025/26
                      </td>
                      <td className="py-1 text-right">
                        {formatCurrency(o.totalAnnualSalary)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4 align-top">
                        Number of employees to be covered
                      </td>
                      <td className="py-1 text-right">
                        {o.membership ?? "-"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* B. RENEWAL RATE & PREMIUM WORKINGS */}
          <section className="space-y-3">
            <div className="font-semibold">
              B&nbsp;&nbsp;Renewal Rate – 2025/2026
            </div>

            {/* Renewal rate table */}
            <div className="border border-gray-300 dark:border-gray-700 rounded-md p-4 space-y-2">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700">
                      <th className="text-left py-1 pr-4">Benefit</th>
                      <th className="text-right py-1">% Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 pr-4">Death</td>
                      <td className="py-1 text-right">
                        {formatPercentFromFraction(o.grossRateGLA)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4">ODB</td>
                      <td className="py-1 text-right">
                        {formatPercentFromFraction(o.grossRatePHI)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-3 font-semibold text-xs">
                Premium workings:
              </div>

              {/* Gross Premium table – like the middle of your screenshot */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-700">
                      <th className="text-left py-1 pr-4">Gross Premium</th>
                      <th className="text-left py-1 pr-2">BWP</th>
                      <th className="text-right py-1"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1 pr-4">Death</td>
                      <td className="py-1 pr-2">BWP</td>
                      <td className="py-1 text-right">
                        {formatCurrency(o.deathPremium)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pr-4">ODB</td>
                      <td className="py-1 pr-2">BWP</td>
                      <td className="py-1 text-right">
                        {formatCurrency(o.ODB)}
                      </td>
                    </tr>
                    <tr className="font-semibold border-t border-gray-300 dark:border-gray-700">
                      <td className="py-1 pr-4">Total</td>
                      <td className="py-1 pr-2">BWP</td>
                      <td className="py-1 text-right">
                        {formatCurrency(o.totalPremiums)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* C. BROAD POLICY SPECIFICATIONS (static text like your Excel) */}
          <section className="space-y-3">
            <div className="font-semibold">
              C&nbsp;&nbsp;Broad Policy Specifications – Renewal
            </div>

            <div className="border border-gray-300 dark:border-gray-700 rounded-md overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <tbody>
                  <tr>
                    <td className="py-1 px-3 w-1/2">Free Cover Limit – Death</td>
                    <td className="py-1 px-3 text-right">
                      {formatCurrency(o.fcl)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">Free Cover Limit – ODB</td>
                    <td className="py-1 px-3 text-right">
                      {formatCurrency(o.fcl)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">Maximum death benefit</td>
                    <td className="py-1 px-3 text-right">
                      {formatCurrency(13000000)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">Maximum ODB</td>
                    <td className="py-1 px-3 text-right">
                      {formatCurrency(13000000)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">
                      Disability benefit Waiting Period
                    </td>
                    <td className="py-1 px-3 text-right">6 months</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">Maximum Entry Age</td>
                    <td className="py-1 px-3 text-right">64</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">Cover Termination Age</td>
                    <td className="py-1 px-3 text-right">65</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">Territorial Limits</td>
                    <td className="py-1 px-3 text-right">SADC</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">Notice for policy alteration</td>
                    <td className="py-1 px-3 text-right">1 month</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">
                      Notice of premature termination
                    </td>
                    <td className="py-1 px-3 text-right">3 months</td>
                  </tr>
                  <tr>
                    <td className="py-1 px-3">
                      War Riot and Strike Extension
                    </td>
                    <td className="py-1 px-3 text-right">No</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* D. MEMBERS EXCLUDED – just an empty box area */}
          {/* <section className="space-y-2">
            <div className="font-semibold">D&nbsp;&nbsp;Members Excluded</div>
            <div className="border border-gray-300 dark:border-gray-700 rounded-md h-24" />
          </section> */}
        </CardContent>
      </Card>
    </div>
  );
};

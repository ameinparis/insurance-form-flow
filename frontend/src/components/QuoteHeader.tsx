import { getProductDisplayName } from "@/lib/quoteUtils";

interface QuoteHeaderProps {
  quoteId: string;
  clientName: string;
  productType: string;
  date?: string;
  clientEmail?: string;
  clientContact?: string;
  clientId?: string;
}

export const QuoteHeader = ({
  quoteId,
  clientName,
  productType,
  date,
  clientEmail,
  clientContact,
  clientId
}: QuoteHeaderProps) => {
  return (
    <div className="bg-white p-8 dark:bg-slate-900 print:p-6">
      <div className="mb-8 flex items-start justify-between gap-10 border-b border-slate-200 pb-6 dark:border-slate-800">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <img
            src="/exclusive.png"
            alt="Exclusive Life Insurance"
            className="h-20 object-contain object-left"
            onError={(e) => {
              e.currentTarget.src = "/exclusive2.png";
            }}
          />
          <div className="text-xs leading-[1.7] text-slate-500 dark:text-slate-400">
            <p>Plot 54368, CBD, I-towers, 3rd Floor, Unit 3A</p>
            <p>P. O. Box 404268, Gaborone</p>
            <p>Tel 392 0000 &nbsp;·&nbsp; Fax 392 0001</p>
          </div>
        </div>

        {/* Document meta */}
        <div className="min-w-[38%] text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            {getProductDisplayName(productType) || "Quotation"}
          </p>
          <div className="mt-3 space-y-1.5">
            <div className="flex items-baseline justify-end gap-3">
              <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Quote No.</span>
              <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-50">{quoteId}</span>
            </div>
            {date && (
              <div className="flex items-baseline justify-end gap-3">
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">Date</span>
                <span className="text-sm font-medium tabular-nums text-slate-700 dark:text-slate-200">
                  {new Date(date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

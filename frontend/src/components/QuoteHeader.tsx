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
    <div className="bg-white dark:bg-slate-900 p-8 print:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header row with logo and company info */}
        <div className="flex justify-between items-start mb-8">
          {/* Logo */}
          <div>
            <img
              src="/exclusive.png"
              alt="Exclusive Life Insurance"
              className="h-20 object-contain"
              onError={(e) => {
                e.currentTarget.src = "/exclusive2.png";
              }}
            />
          </div>

          {/* Company Info */}
          <div className="text-right text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <p>Plot 54368, CBD, I-towers</p>
            <p>3rd Floor, unit 3A</p>
            <p>P. O. Box 404268</p>
            <p>Gaborone</p>
            <br />
            <p>Tel: 392 0000 | Fax: 392 0001</p>
            <br />
            <div className="">
              <span className="text-gray-600 dark:text-gray-400">Quote   </span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">#{quoteId}</span>
            </div>
            {date && (
              <div className="">
                <span className="text-gray-600 dark:text-gray-400">Date:  </span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">
                  {new Date(date).toLocaleDateString()}
                </span>
              </div>
            )}
            {/* <br />
                 <span className="font-semibold text-gray-800 dark:text-gray-100">
                {getProductDisplayName(productType)}

              </span> */}
          </div>
        </div>
      </div>
    </div>
  );
};

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
    <div className="bg-white dark:bg-slate-900 border-b-4 border-gray-300 dark:border-gray-700 p-8 print:p-6">
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
            <p className="font-medium text-gray-800 dark:text-gray-200">Exclusive Life Insurance</p>
            <p>Plot 54368, I-Towers, CBD</p>
            <p>Third Floor, Unit 3A</p>
            <p>Tel: 392 0000 | Fax: 392 0001</p>
            <p>info@exclusivelife.co.bw</p>
          </div>
        </div>
        
        {/* Bill To Section and Quote Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          {/* Bill To Box */}
          <div className="bg-slate-600 dark:bg-slate-700 text-white p-6 rounded-lg">
            <h3 className="text-lg font-bold mb-3 uppercase tracking-wide">Bill To</h3>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-base">{clientName}</p>
              {clientId && <p>ID: {clientId}</p>}
              {clientContact && <p>Tel: {clientContact}</p>}
              {clientEmail && <p>Email: {clientEmail}</p>}
            </div>
          </div>

          {/* Quotation Details */}
          <div className="flex flex-col justify-between">
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">QUOTATION</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Quote Number:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">#{quoteId}</span>
                </div>
                {date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {new Date(date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {clientId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Customer ID:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{clientId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Product Info */}
        <div className="border-t border-gray-300 dark:border-gray-700 pt-6">
          <div className="text-center">
            <p className="text-xl text-gray-700 dark:text-gray-300">
              <span className="font-medium">Product: </span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">
                {getProductDisplayName(productType)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

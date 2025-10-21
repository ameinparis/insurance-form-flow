import { getProductDisplayName } from "@/lib/quoteUtils";

interface QuoteHeaderProps {
  quoteId: string;
  clientName: string;
  productType: string;
  date?: string;
}

export const QuoteHeader = ({ quoteId, clientName, productType, date }: QuoteHeaderProps) => {
  return (
    <div className="bg-white border-b-4 border-primary p-8 print:p-6">
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
          <div className="text-right text-sm text-gray-600 leading-relaxed">
            <p className="font-medium">Exclusive Life Insurance</p>
            <p>Plot 54368, I-Towers, CBD</p>
            <p>Third Floor, Unit 3A</p>
            <p>Tel: 392 0000 | Fax: 392 0001</p>
            <p>info@exclusivelife.co.bw</p>
          </div>
        </div>
        
        {/* Quote metadata */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-muted-foreground">Quote Number</p>
            <p className="text-2xl font-bold text-primary">#{quoteId}</p>
          </div>
          {date && (
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{new Date(date).toLocaleDateString()}</p>
            </div>
          )}
        </div>
        
        {/* Client and Product Info */}
        <div className="border-t border-gray-200 pt-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Quote for {clientName}
            </h1>
            <p className="text-xl text-gray-600 flex items-center justify-center gap-2">
              <span className="font-medium">Product:</span>
              <span className="text-primary font-semibold">
                {getProductDisplayName(productType)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

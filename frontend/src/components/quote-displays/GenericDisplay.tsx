import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/quoteUtils";

interface GenericDisplayProps {
  quote: any;
}

const renderValue = (value: any): string => {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    // Try to detect if it's a currency value
    if (value > 100 && value < 10000000) {
      return formatCurrency(value);
    }
    return value.toString();
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const renderObject = (obj: any, depth: number = 0) => {
  if (!obj || typeof obj !== "object") return null;
  
  return (
    <div className={depth > 0 ? "ml-4 space-y-2" : "space-y-3"}>
      {Object.entries(obj).map(([key, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return (
            <div key={key} className="border-l-2 border-muted pl-3">
              <p className="text-sm font-medium text-muted-foreground capitalize mb-2">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              {renderObject(value, depth + 1)}
            </div>
          );
        }
        
        if (Array.isArray(value)) {
          return (
            <div key={key} className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()} ({value.length})
              </p>
              {value.map((item, idx) => (
                <div key={idx} className="bg-muted/30 p-3 rounded-lg ml-4">
                  {typeof item === "object" ? renderObject(item, depth + 1) : renderValue(item)}
                </div>
              ))}
            </div>
          );
        }
        
        return (
          <div key={key} className="flex justify-between items-start">
            <span className="text-sm text-muted-foreground capitalize flex-1">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </span>
            <span className="font-medium ml-4 text-right">{renderValue(value)}</span>
          </div>
        );
      })}
    </div>
  );
};

export const GenericDisplay = ({ quote }: GenericDisplayProps) => {
  const { client, inputs, outputs } = quote;
  
  return (
    <div className="bg-white dark:bg-slate-900 p-8 space-y-8 text-sm text-gray-800 dark:text-gray-100">
      {/* Product Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
        <h2 className="text-lg font-semibold">Product: {quote.productType || "Insurance Quote"}</h2>
      </div>

      {/* Client Details */}
      {client && Object.keys(client).length > 0 && (
        <div>
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
            <h3 className="text-base font-semibold">Client Information</h3>
          </div>
          <CardContent className="p-0">
            {renderObject(client)}
          </CardContent>
        </div>
      )}

      {/* Inputs Section */}
      {inputs && Object.keys(inputs).length > 0 && (
        <div>
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
            <h3 className="text-base font-semibold">Quote Details</h3>
          </div>
          <CardContent className="p-0">
            {renderObject(inputs)}
          </CardContent>
        </div>
      )}

      {/* Outputs Section */}
      {outputs && Object.keys(outputs).length > 0 && (
        <div>
          <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-4">
            <h3 className="text-base font-semibold">Calculation Results</h3>
          </div>
          <CardContent className="p-0">
            {renderObject(outputs)}
          </CardContent>
        </div>
      )}

      {(!client || Object.keys(client).length === 0) && 
       (!inputs || Object.keys(inputs).length === 0) && 
       (!outputs || Object.keys(outputs).length === 0) && (
        <div className="py-8 text-center text-muted-foreground">
          No detailed information available for this quote.
        </div>
      )}
    </div>
  );
};

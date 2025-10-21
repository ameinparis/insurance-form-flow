import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatCurrency } from "@/lib/quoteUtils";

interface GenericDisplayProps {
  inputs?: any;
  outputs?: any;
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

export const GenericDisplay = ({ inputs, outputs }: GenericDisplayProps) => {
  return (
    <div className="space-y-6">
      <Accordion type="multiple" defaultValue={["inputs", "outputs"]} className="w-full">
        {/* Inputs Section */}
        {inputs && Object.keys(inputs).length > 0 && (
          <AccordionItem value="inputs">
            <Card>
              <CardHeader>
                <AccordionTrigger className="hover:no-underline">
                  <CardTitle>Quote Inputs</CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent>
                  {renderObject(inputs)}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        )}

        {/* Outputs Section */}
        {outputs && Object.keys(outputs).length > 0 && (
          <AccordionItem value="outputs">
            <Card>
              <CardHeader>
                <AccordionTrigger className="hover:no-underline">
                  <CardTitle>Calculation Results</CardTitle>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent>
                  {renderObject(outputs)}
                </CardContent>
              </AccordionContent>
            </Card>
          </AccordionItem>
        )}
      </Accordion>

      {(!inputs || Object.keys(inputs).length === 0) && (!outputs || Object.keys(outputs).length === 0) && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No detailed information available for this quote.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

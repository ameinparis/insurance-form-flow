// Utility functions for quote rendering and data fetching

export interface QuoteData {
  _id: string;
  quoteId: string;
  productType?: string;
  type?: string; // legacy field
  client?: {
    fullName?: string;
    dateOfBirth?: string;
    idNumber?: string;
    contactNumber?: string;
    email?: string;
  };
  // Legacy fields (common)
  fullName?: string;
  email?: string;
  contactNumber?: string;
  dateOfBirth?: string;
  idNumber?: string;
  
  // Legacy annuity-specific fields
  singlePurchasePremium?: number;
  drawdown?: number;
  guaranteedAnnuity?: number;
  fundsRemaining?: number;
  frequency?: string;
  guaranteedStartAge?: number;
  monthlyLifeAnnuity?: number;
  annualLifeAnnuity?: number;
  disclaimerText?: string;
  
  inputs?: any;
  outputs?: any;
  termsAndConditions?: string;
  createdBy?: {
    name?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SavedQuoteResponse {
  _id?: string;
  quoteId?: string;
  quote?: {
    _id?: string;
    quoteId?: string;
  };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch quote details from either legacy or new API endpoint
 */
export const fetchQuoteDetails = async (
  quoteId: string,
  isLegacy: boolean = false
): Promise<QuoteData> => {
  const token = localStorage.getItem("token");
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://njs.exclusivelife.co.bw";
  const endpoint = isLegacy 
    ? `/api/quotes/${quoteId}` 
    : `/api/new-quotes/${quoteId}`;
  
  const response = await fetch(`${baseUrl}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch quote: ${response.statusText}`);
  }
  
  return response.json();
};

export const getSavedQuoteId = (response: SavedQuoteResponse): string | null => {
  return response._id || response.quote?._id || null;
};

export const waitForQuoteReady = async (
  quoteId: string,
  options: {
    isLegacy?: boolean;
    retries?: number;
    intervalMs?: number;
    minimumMs?: number;
  } = {}
): Promise<QuoteData> => {
  const {
    isLegacy = false,
    retries = 15,
    intervalMs = 1000,
    minimumMs = 0,
  } = options;

  const readinessPromise = (async () => {
    let lastError: unknown;

    for (let attempt = 0; attempt < retries; attempt += 1) {
      try {
        return await fetchQuoteDetails(quoteId, isLegacy);
      } catch (error) {
        lastError = error;

        if (attempt === retries - 1) {
          break;
        }

        await delay(intervalMs);
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Quote is not ready yet");
  })();

  const [quote] = await Promise.all([
    readinessPromise,
    minimumMs > 0 ? delay(minimumMs) : Promise.resolve(),
  ]);

  return quote;
};

/**
 * Format currency with BWP prefix
 */
export const formatCurrency = (amount: number | string | undefined): string => {
  if (amount === undefined || amount === null) return "—";
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return "—";
  return `BWP ${numAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Get friendly display name for product type
 */
export const getProductDisplayName = (productType?: string): string => {
  if (!productType) return "Insurance Quote";
  
  const mapping: Record<string, string> = {
    "Exclusive Annuity": "Exclusive Annuity",
    "Exclusive Funeral": "Exclusive Funeral Plan",
    "life": "Life Insurance",
    "funeral": "Funeral Plan",
    "annuity": "Living Annuity",
  };
  
  return mapping[productType] || productType;
};

/**
 * Convert a string to Title Case (first letter uppercase, rest lowercase per word)
 */
export const toTitleCase = (str: string | undefined | null): string => {
  if (!str) return "—";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("-")
    )
    .join(" ");
};

/**
 * Format date string
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return "—";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
};

/**
 * Get client info from quote (handles both legacy and new schema)
 */
export const getClientInfo = (quote: QuoteData) => {
  return {
    fullName: quote.client?.fullName || quote.fullName || "—",
    email: quote.client?.email || quote.email || "—",
    contactNumber: quote.client?.contactNumber || quote.contactNumber || "—",
    dateOfBirth: quote.client?.dateOfBirth || quote.dateOfBirth || "—",
    idNumber: quote.client?.idNumber || quote.idNumber || "—",
  };
};

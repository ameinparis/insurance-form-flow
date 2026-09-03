import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/api";

export interface NormalizedQuote {
  id: string;
  quoteId: string;
  fullName?: string;
  clientName?: string;
  schemeName?: string;
  email: string;
  contactNumber?: string;
  type: string;
  createdByName: string;
  createdAt: string;
  isLegacy: boolean;
  premium?: number;
}

const fetchQuotesList = async (): Promise<NormalizedQuote[]> => {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [oldRes, newRes] = await Promise.all([
    fetch(`${API_BASE_URL}/quotes`, { headers }),
    fetch(`${API_BASE_URL}/new-quotes`, { headers }),
  ]);

  if (!oldRes.ok || !newRes.ok) throw new Error("Failed to fetch quotes");

  const [oldQuotes, newQuotes] = await Promise.all([oldRes.json(), newRes.json()]);

  const mappedOld: NormalizedQuote[] = oldQuotes.map((q: any) => ({
    id: q._id,
    quoteId: q.quoteId,
    fullName: q.fullName || "Unnamed",
    clientName: q.fullName || "Unnamed",
    email: q.email || "—",
    contactNumber: q.contactNumber || "—",
    type: "Exclusive Annuity",
    createdByName: q.createdByName || q.createdBy?.firstName || "—",
    createdAt: q.createdAt,
    isLegacy: true,
  }));

  const mappedNew: NormalizedQuote[] = newQuotes.map((q: any) => ({
    id: q._id,
    quoteId: q.quoteId || "—",
    fullName: q.client?.fullName || q.client?.companyName || q.client?.schemeName || "Unnamed",
    clientName: q.client?.fullName || q.client?.companyName || q.client?.schemeName || "Unnamed",
    schemeName: q.client?.schemeName,
    email: q.client?.email || q.client?.companyEmail || "—",
    contactNumber: q.client?.contactNumber || "—",
    type: q.productType || "Unknown",
    createdByName:
      q.createdByName ||
      (q.createdBy?.firstName ? `${q.createdBy.firstName} ${q.createdBy.lastName || ""}`.trim() : "—"),
    createdAt: q.createdAt,
    isLegacy: false,
  }));

  return [...mappedOld, ...mappedNew].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const QUOTES_LIST_KEY = ["quotes-list"] as const;

export const useQuotesList = () => {
  return useQuery({
    queryKey: QUOTES_LIST_KEY,
    queryFn: fetchQuotesList,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
};

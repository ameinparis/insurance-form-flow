import React, { createContext, useContext, useState, ReactNode } from "react";

interface SearchContextType {
  globalSearchTerm: string;
  setGlobalSearchTerm: (term: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");

  return (
    <SearchContext.Provider value={{ globalSearchTerm, setGlobalSearchTerm }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useGlobalSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error("useGlobalSearch must be used within a SearchProvider");
  }
  return context;
}

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calculate from "./pages/Calculate";
import CalculateForm from "./pages/CalculateForm";
import Results from "./pages/Results";
import PersonalDetails from "./pages/PersonalDetails";
import QuotePreview from "./pages/QuotePreview";
import Quotes from "./pages/Quotes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calculate" element={<Calculate />} />
            <Route path="/calculate/:type" element={<CalculateForm />} />
            <Route path="/calculate/results" element={<Results />} />
            <Route path="/quote/personal-details" element={<PersonalDetails />} />
            <Route path="/quote/preview" element={<QuotePreview />} />
            <Route path="/quotes" element={<Quotes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

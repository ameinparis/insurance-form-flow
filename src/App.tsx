
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calculate from "./pages/Calculate";
import CalculateForm from "./pages/CalculateForm";
import CalculatorForm from "./components/CalculatorForm";
import Results from "./pages/Results";
import PersonalDetails from "./pages/PersonalDetails";
import QuotePreview from "./pages/QuotePreview";
import Quotes from "./pages/Quotes";
import LivingAnnuityCalculator from "./pages/LivingAnnuityCalculator";
import Settings from "./pages/Settings";
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
            <Route path="/calculator" element={<Calculate />} />
            <Route path="/calculator/:type" element={<CalculatorForm />} />
            <Route path="/calculate/results" element={<Results />} />
            <Route path="/quote/personal-details" element={<PersonalDetails />} />
            <Route path="/quote/preview" element={<QuotePreview />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/living-annuity-calculator" element={<LivingAnnuityCalculator />} />
            <Route path="/settings" element={<Settings />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

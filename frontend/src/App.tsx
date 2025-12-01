import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SearchProvider } from "@/lib/searchContext";
import { BackgroundJobProvider } from "@/contexts/BackgroundJobContext";
import MultiJobWidget from "@/components/BackgroundJobWidget";
import { useBackgroundJob } from "@/contexts/BackgroundJobContext";
import { Layout } from "./components/Layout";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Calculate from "./pages/Calculate";
import Team from "./pages/Team";
import CalculateForm from "./pages/CalculateForm";
import FormRouter from "./components/FormRouter";
import Results from "./pages/Results";
import PersonalDetails from "./pages/PersonalDetails";
import QuotePreview from "./pages/QuotePreview";
import Quotes from "./pages/Quotes";
import QuoteDetail from "./pages/QuoteDetail";
import LivingAnnuityCalculator from "./pages/LivingAnnuityCalculator";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import LogoutHandler from "./components/LogoutHandler";

const queryClient = new QueryClient();

const GlobalBackgroundJobWidget = () => {
  const { jobs, removeJob } = useBackgroundJob();
  
  return (
    <MultiJobWidget
      jobs={jobs}
      onDismissJob={removeJob}
    />
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SearchProvider>
      <BackgroundJobProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <GlobalBackgroundJobWidget />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={
              <Layout>
                <Dashboard />
              </Layout>
            } />
              <Route path="/calculator" element={
                <Layout>
                  <Calculate />
                </Layout>
              } />
              <Route path="/calculator/:type" element={
                <Layout>
                  <FormRouter />
                </Layout>
              } />
              <Route path="/calculate/results" element={
                <Layout>
                  <Results />
                </Layout>
              } />
              <Route path="/quote/personal-details" element={
                <Layout>
                  <PersonalDetails />
                </Layout>
              } />
              <Route path="/quote/preview" element={
                <Layout>
                  <QuotePreview />
                </Layout>
              } />
              <Route path="/quotes" element={
                <Layout>
                  <Quotes />
                </Layout>
              } />
              <Route path="/quotes/:id" element={
                <Layout>
                  <QuoteDetail />
                </Layout>
              } />
              <Route path="/living-annuity-calculator" element={
                <Layout>
                  <LivingAnnuityCalculator />
                </Layout>
              } />
              <Route path="/settings" element={
                <Layout>
                  <Settings />
                </Layout>
              } />
              <Route path="/team" element={
                <Layout>
                  <Team />
                </Layout>
              } />
              <Route path="/logout" element={<LogoutHandler />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </BackgroundJobProvider>
    </SearchProvider>
  </QueryClientProvider>
);

export default App;

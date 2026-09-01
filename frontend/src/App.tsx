import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SearchProvider } from "@/lib/searchContext";
import { BackgroundJobProvider } from "@/contexts/BackgroundJobContext";
import MultiJobWidget from "@/components/BackgroundJobWidget";
import { useBackgroundJob } from "@/contexts/BackgroundJobContext";
import { Layout } from "./components/Layout";
import { ScrollToTop } from "./components/ScrollToTop";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Calculate from "./pages/Calculate";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";

import Claims from "./pages/Claims";
import Conversions from "./pages/Conversions";
import Administration from "./pages/Administration";
import CalculateForm from "./pages/CalculateForm";
import FormRouter from "./components/FormRouter";
import Results from "./pages/Results";
import PersonalDetails from "./pages/PersonalDetails";
import QuotePreview from "./pages/QuotePreview";
import Quotes from "./pages/Quotes";
import QuoteDetail from "./pages/QuoteDetail";
import Settings from "./pages/Settings";
import ConvertToPolicy from "./pages/ConvertToPolicy";
import PolicyDraftPreview from "./pages/PolicyDraftPreview";
import NotFound from "./pages/NotFound";
import LogoutHandler from "./components/LogoutHandler";
import RoleGuard from "./components/RoleGuard";
import SetPassword from "./pages/auth/SetPassword";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import AccountPending from "./pages/auth/AccountPending";
import LinkExpired from "./pages/auth/LinkExpired";

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
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth/set-password" element={<SetPassword />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/pending" element={<AccountPending />} />
            <Route path="/auth/link-expired" element={<LinkExpired />} />
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
            
              <Route path="/settings" element={
                <Layout>
                  <Settings />
                </Layout>
              } />
              <Route path="/policies/convert" element={
                <Layout>
                  <ConvertToPolicy />
                </Layout>
              } />
              <Route path="/policies/drafts/:id" element={
                <Layout>
                  <PolicyDraftPreview />
                </Layout>
              } />

              <Route path="/clients" element={
                <Layout>
                  <Clients />
                </Layout>
              } />
              <Route path="/clients/:id" element={
                <Layout>
                  <ClientDetail />
                </Layout>
              } />
              <Route path="/clients/:id/policies/:policyId" element={
                <Layout>
                  <ClientDetail />
                </Layout>
              } />

              <Route path="/conversions" element={
                <Layout>
                  <Conversions />
                </Layout>
              } />
              <Route path="/approvals" element={<Navigate to="/conversions" replace />} />

              <Route path="/claims" element={
                <Layout>
                  <Claims />
                </Layout>
              } />
              <Route path="/administration" element={
                <Layout>
                  <RoleGuard require="canManageUsers">
                    <Administration />
                  </RoleGuard>
                </Layout>
              } />
              <Route path="/team" element={<Navigate to="/administration" replace />} />
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

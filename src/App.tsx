import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EmployeeProvider } from "@/contexts/EmployeeContext";
import { Layout } from "@/components/Layout";
import { ProtectLayout } from "@/components/ProtectLayout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Heures from "./pages/Heures";
import Chantiers from "./pages/Chantiers";
import NotFound from "./pages/NotFound";
import { RequireAdmin } from "./components/RequireAdmin";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <EmployeeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectLayout><Layout /></ProtectLayout>}>
              <Route path="/" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
              <Route path="/employes" element={<RequireAdmin><Employees /></RequireAdmin>} />
              <Route path="/heures" element={<Heures />} />
              <Route path="/chantiers" element={<RequireAdmin><Chantiers /></RequireAdmin>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </EmployeeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { useAutoInitializeProjects } from "@/hooks/useAutoInitializeProjects";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectConfig from "./pages/ProjectConfig";
import Projects from "./pages/Projects";
import Pipelines from "./pages/Pipelines";
import Teams from "./pages/Teams";
import Versions from "./pages/Versions";
import Data from "./pages/Data";
import DataUpload from "./pages/DataUpload";
import Settings from "./pages/Settings";
import Templates from "./pages/Templates";

const queryClient = new QueryClient();

function AppContent() {
  // Auto-initialize projects with templates on first load
  useAutoInitializeProjects();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/config" element={<ProjectConfig />} />
        <Route path="/pipelines" element={<Pipelines />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/versions" element={<Versions />} />
        <Route path="/data" element={<Data />} />
        <Route path="/data/upload" element={<DataUpload />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

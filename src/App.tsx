import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InternDashboard from "./pages/intern/Dashboard";
import InternTasks from "./pages/intern/Tasks";
import SubmitTask from "./pages/intern/SubmitTask";
import InternProgress from "./pages/intern/Progress";
import AdminDashboard from "./pages/admin/Dashboard";
import InternManagement from "./pages/admin/InternManagement";
import TaskPool from "./pages/admin/TaskPool";
import AIUsage from "./pages/admin/AIUsage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/intern/dashboard" element={<InternDashboard />} />
          <Route path="/intern/tasks" element={<InternTasks />} />
          <Route path="/intern/submit" element={<SubmitTask />} />
          <Route path="/intern/progress" element={<InternProgress />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/interns" element={<InternManagement />} />
          <Route path="/admin/tasks" element={<TaskPool />} />
          <Route path="/admin/ai-usage" element={<AIUsage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

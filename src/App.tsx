import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/intern/dashboard" element={<ProtectedRoute requiredRole="intern"><InternDashboard /></ProtectedRoute>} />
            <Route path="/intern/tasks" element={<ProtectedRoute requiredRole="intern"><InternTasks /></ProtectedRoute>} />
            <Route path="/intern/submit" element={<ProtectedRoute requiredRole="intern"><SubmitTask /></ProtectedRoute>} />
            <Route path="/intern/progress" element={<ProtectedRoute requiredRole="intern"><InternProgress /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/interns" element={<ProtectedRoute requiredRole="admin"><InternManagement /></ProtectedRoute>} />
            <Route path="/admin/tasks" element={<ProtectedRoute requiredRole="admin"><TaskPool /></ProtectedRoute>} />
            <Route path="/admin/ai-usage" element={<ProtectedRoute requiredRole="admin"><AIUsage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

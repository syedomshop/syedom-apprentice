import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/student/Dashboard";
import StudentTasks from "./pages/student/Tasks";
import SubmitTask from "./pages/student/SubmitTask";
import Progress from "./pages/student/Progress";
import Certificate from "./pages/student/Certificate";
import Notifications from "./pages/student/Notifications";
import VerifyCertificate from "./pages/VerifyCertificate";
import Portfolio from "./pages/Portfolio";
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
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify/:code" element={<VerifyCertificate />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/intern/:username" element={<Portfolio />} />
            <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><StudentTasks /></ProtectedRoute>} />
            <Route path="/submit" element={<ProtectedRoute><SubmitTask /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/certificate" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

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
import AdminRoute from "@/components/AdminRoute";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminInterns from "./pages/admin/Interns";
import AdminCertificates from "./pages/admin/Certificates";
import AdminBatches from "./pages/admin/Batches";
import AdminTasks from "./pages/admin/Tasks";
import AdminApiUsage from "./pages/admin/ApiUsage";
import AdminRevenue from "./pages/admin/Revenue";
import AdminLogs from "./pages/admin/Logs";
import AdminAutomations from "./pages/admin/Automations";
import AdminNotificationsPage from "./pages/admin/Notifications";

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
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/certificate" element={<ProtectedRoute><Certificate /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/interns" element={<AdminRoute><AdminInterns /></AdminRoute>} />
            <Route path="/admin/certificates" element={<AdminRoute><AdminCertificates /></AdminRoute>} />
            <Route path="/admin/batches" element={<AdminRoute><AdminBatches /></AdminRoute>} />
            <Route path="/admin/tasks" element={<AdminRoute><AdminTasks /></AdminRoute>} />
            <Route path="/admin/api-usage" element={<AdminRoute><AdminApiUsage /></AdminRoute>} />
            <Route path="/admin/revenue" element={<AdminRoute><AdminRevenue /></AdminRoute>} />
            <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
            <Route path="/admin/automations" element={<AdminRoute><AdminAutomations /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotificationsPage /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

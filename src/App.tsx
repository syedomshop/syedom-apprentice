import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import VerifyCertificate from "./pages/VerifyCertificate";
import InternDashboard from "./pages/intern/Dashboard";
import InternTasks from "./pages/intern/Tasks";
import InternSubmissions from "./pages/intern/Submissions";
import InternGrades from "./pages/intern/Grades";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminInterns from "./pages/admin/Interns";
import AdminInternDetail from "./pages/admin/InternDetail";
import AdminTasks from "./pages/admin/Tasks";
import AdminSubmissions from "./pages/admin/Submissions";
import AdminGrading from "./pages/admin/Grading";
import AdminBatches from "./pages/admin/Batches";
import AdminNotifications from "./pages/admin/Notifications";
import AdminAiGrading from "./pages/admin/AiGrading";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<VerifyCertificate />} />

            {/* Intern portal */}
            <Route path="/intern/dashboard" element={<ProtectedRoute><InternDashboard /></ProtectedRoute>} />
            <Route path="/intern/tasks" element={<ProtectedRoute><InternTasks /></ProtectedRoute>} />
            <Route path="/intern/submissions" element={<ProtectedRoute><InternSubmissions /></ProtectedRoute>} />
            <Route path="/intern/grades" element={<ProtectedRoute><InternGrades /></ProtectedRoute>} />

            {/* Admin panel */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/interns" element={<AdminRoute><AdminInterns /></AdminRoute>} />
            <Route path="/admin/interns/:id" element={<AdminRoute><AdminInternDetail /></AdminRoute>} />
            <Route path="/admin/batches" element={<AdminRoute><AdminBatches /></AdminRoute>} />
            <Route path="/admin/tasks" element={<AdminRoute><AdminTasks /></AdminRoute>} />
            <Route path="/admin/submissions" element={<AdminRoute><AdminSubmissions /></AdminRoute>} />
            <Route path="/admin/grading" element={<AdminRoute><AdminGrading /></AdminRoute>} />
            <Route path="/admin/ai-grading" element={<AdminRoute><AdminAiGrading /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

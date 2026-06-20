import { Navigate, Route, Routes } from "react-router-dom";

import AdminRoute from "./components/AdminRoute";
import CandidateRoute from "./components/CandidateRoute";
import ClientRoute from "./components/ClientRoute";
import EmployeeRoute from "./components/EmployeeRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import CandidateApplications from "./pages/CandidateApplications";
import CandidateJobs from "./pages/CandidateJobs";
import CandidateLogin from "./pages/CandidateLogin";
import CandidatePortalLayout from "./pages/CandidatePortalLayout";
import CandidateRegister from "./pages/CandidateRegister";
import ClientDashboard from "./pages/ClientDashboard";
import ClientLogin from "./pages/ClientLogin";
import ClientPortalLayout from "./pages/ClientPortalLayout";
import ClientRequirements from "./pages/ClientRequirements";
import CompanySettings from "./pages/CompanySettings";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeDocuments from "./pages/EmployeeDocuments";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeePortalLayout from "./pages/EmployeePortalLayout";
import EmployeeSelfService from "./pages/EmployeeSelfService";
import ForgotPassword from "./pages/ForgotPassword";
import InvoiceManagement from "./pages/InvoiceManagement";
import LeadManagement from "./pages/LeadManagement";
import Login from "./pages/Login";
import ModulePage from "./pages/ModulePage";
import Notifications from "./pages/Notifications";
import PipelineBoard from "./pages/PipelineBoard";
import PublicInfoPage from "./pages/PublicInfoPage";
import PublicHome from "./pages/PublicHome";
import RequirementManagement from "./pages/RequirementManagement";
import SlaDashboard from "./pages/SlaDashboard";
import ResetPassword from "./pages/ResetPassword";
import ShiftRoster from "./pages/ShiftRoster";

const modules = [
  ["clients", "Clients"],
  ["policies", "Policies"],
  ["jobs", "Jobs"],
  ["candidates", "Candidates"],
  ["interviews", "Interviews"],
  ["offers", "Offers"],
  ["employees", "Employees"],
  ["attendance", "Attendance"],
  ["leaves", "Leave Requests"],
  ["tours", "Tour Requests"],
  ["expenses", "Expense Claims"],
  ["payroll", "Payroll"],
  ["resignations", "Resignations"],
  ["users", "Users & Roles"]
];

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/about" element={<PublicInfoPage page="about" />} />
      <Route path="/services" element={<PublicInfoPage page="services" />} />
      <Route path="/industries" element={<PublicInfoPage page="industries" />} />
      <Route path="/contact" element={<PublicInfoPage page="contact" />} />
      <Route path="/privacy" element={<PublicInfoPage page="privacy" />} />
      <Route path="/terms" element={<PublicInfoPage page="terms" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/client/login" element={<ClientLogin />} />
      <Route path="/employee/login" element={<EmployeeLogin />} />
      <Route path="/candidate/login" element={<CandidateLogin />} />
      <Route path="/candidate/register" element={<CandidateRegister />} />

      <Route element={<CandidateRoute />}>
        <Route path="/candidate" element={<CandidatePortalLayout />}>
          <Route index element={<Navigate to="/candidate/jobs" replace />} />
          <Route path="jobs" element={<CandidateJobs />} />
          <Route path="applications" element={<CandidateApplications />} />
        </Route>
      </Route>

      <Route element={<EmployeeRoute />}>
        <Route path="/employee" element={<EmployeePortalLayout />}>
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmployeeDashboard />} />
          <Route path="attendance" element={<EmployeeSelfService module="attendance" />} />
          <Route path="leaves" element={<EmployeeSelfService module="leaves" />} />
          <Route path="tours" element={<EmployeeSelfService module="tours" />} />
          <Route path="expenses" element={<EmployeeSelfService module="expenses" />} />
          <Route path="payroll" element={<EmployeeSelfService module="payroll" />} />
          <Route path="documents" element={<EmployeeDocuments />} />
          <Route path="resignation" element={<EmployeeSelfService module="resignation" />} />
        </Route>
      </Route>

      <Route element={<ClientRoute />}>
        <Route path="/client" element={<ClientPortalLayout />}>
          <Route index element={<Navigate to="/client/dashboard" replace />} />
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="jobs" element={<ClientDashboard module="jobs" />} />
          <Route path="requirements" element={<ClientRequirements />} />
          <Route path="candidates" element={<ClientDashboard module="candidates" />} />
          <Route path="employees" element={<ClientDashboard module="employees" />} />
          <Route path="invoices" element={<InvoiceManagement clientView />} />
          <Route path="sla" element={<SlaDashboard clientView />} />
          <Route path="compliance" element={<ComplianceDashboard clientView />} />
          <Route path="attendance-health" element={<ShiftRoster clientView />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />

          {modules.map(([path, title]) => (
            <Route
              key={path}
              path={path}
              element={<ModulePage module={path} title={title} />}
            />
          ))}

          <Route
            path="reports"
            element={<ModulePage module="payroll" title="Reports" />}
          />
          <Route path="leads" element={<LeadManagement />} />
          <Route path="settings" element={<CompanySettings />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="requirements" element={<RequirementManagement />} />
          <Route path="pipeline" element={<PipelineBoard />} />
          <Route path="invoices" element={<InvoiceManagement />} />
          <Route path="sla" element={<SlaDashboard />} />
          <Route path="compliance" element={<ComplianceDashboard />} />
          <Route path="shifts" element={<ShiftRoster />} />
        </Route>
      </Route>

      {modules.map(([path]) => (
        <Route
          key={`legacy-${path}`}
          path={`/${path}`}
          element={<Navigate to={`/admin/${path}`} replace />}
        />
      ))}
      <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

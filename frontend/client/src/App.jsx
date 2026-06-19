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
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeDocuments from "./pages/EmployeeDocuments";
import EmployeeLogin from "./pages/EmployeeLogin";
import EmployeePortalLayout from "./pages/EmployeePortalLayout";
import EmployeeSelfService from "./pages/EmployeeSelfService";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import ModulePage from "./pages/ModulePage";
import PublicHome from "./pages/PublicHome";
import ResetPassword from "./pages/ResetPassword";

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
          <Route path="candidates" element={<ClientDashboard module="candidates" />} />
          <Route path="employees" element={<ClientDashboard module="employees" />} />
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

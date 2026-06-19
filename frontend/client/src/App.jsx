import { Navigate, Route, Routes } from "react-router-dom";

import AdminRoute from "./components/AdminRoute";
import CandidateRoute from "./components/CandidateRoute";
import EmployeeRoute from "./components/EmployeeRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import CandidateApplications from "./pages/CandidateApplications";
import CandidateJobs from "./pages/CandidateJobs";
import CandidateLogin from "./pages/CandidateLogin";
import CandidatePortalLayout from "./pages/CandidatePortalLayout";
import CandidateRegister from "./pages/CandidateRegister";
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeePortalLayout from "./pages/EmployeePortalLayout";
import EmployeeSelfService from "./pages/EmployeeSelfService";
import Login from "./pages/Login";
import ModulePage from "./pages/ModulePage";

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
      <Route path="/login" element={<Login />} />
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
          <Route path="resignation" element={<EmployeeSelfService module="resignation" />} />
        </Route>
      </Route>

      <Route element={<AdminRoute />}>
        <Route element={<DashboardLayout />}>
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

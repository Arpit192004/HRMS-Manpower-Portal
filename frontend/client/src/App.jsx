import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
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

      <Route element={<ProtectedRoute />}>
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
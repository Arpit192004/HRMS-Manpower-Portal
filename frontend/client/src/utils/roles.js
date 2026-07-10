export const normalizeRole = (role = "") => role.trim().toLowerCase();

export const isCandidateRole = (role) => normalizeRole(role) === "candidate";

export const isEmployeeRole = (role) => normalizeRole(role) === "employee";

export const isManagerRole = (role) =>
  ["manager", "client approver"].includes(normalizeRole(role));

export const isAdminRole = (role) =>
  ![isCandidateRole, isEmployeeRole, isManagerRole].some((checker) => checker(role));

export const getRoleHomePath = (user) => {
  if (!user) return "/login";
  if (isCandidateRole(user.role)) return "/candidate/jobs";
  if (isEmployeeRole(user.role)) return "/employee/dashboard";
  if (isManagerRole(user.role)) return "/client/dashboard";
  return "/admin";
};

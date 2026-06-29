import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import downloadFile from "../utils/downloadFile";
import FileUploadField from "../components/FileUploadField";

const endpointConfiguration = {
  users: { endpoint: "/users", key: "users" },
  clients: { endpoint: "/clients", key: "clients" },
  policies: { endpoint: "/policies", key: "policies" },
  jobs: { endpoint: "/jobs", key: "jobs" },
  candidates: { endpoint: "/candidates", key: "candidates" },
  interviews: { endpoint: "/interviews", key: "interviews" },
  offers: { endpoint: "/offers", key: "offers" },
  employees: { endpoint: "/employees", key: "employees" },
  attendance: { endpoint: "/attendance", key: "attendance" },
  leaves: { endpoint: "/leaves", key: "leaveRequests" },
  tours: { endpoint: "/tours", key: "tourRequests" },
  expenses: { endpoint: "/expenses", key: "claims" },
  payroll: { endpoint: "/payroll", key: "payrolls" },
  resignations: { endpoint: "/resignations", key: "resignations" }
};

const formConfigurations = {
  users: [
    { name: "name", label: "Full Name", placeholder: "Amit Kumar" },
    { name: "email", label: "Official Email", placeholder: "name@company.com" },
    { name: "password", label: "Password", type: "password" },
    {
      name: "role",
      label: "Role",
      type: "select",
      options: [
        "Super Admin",
        "HR Admin",
        "Client Approver",
        "Manager",
        "Employee",
        "Payroll Team",
        "Candidate"
      ]
    },
    { name: "client", label: "Department ID optional", placeholder: "Paste department _id" }
  ],
  clients: [
    { name: "name", label: "Client Name", placeholder: "ABC Technologies" },
    { name: "code", label: "Client Code", placeholder: "ABC001" },
    { name: "industry", label: "Industry", placeholder: "IT Services" },
    { name: "contactName", label: "Contact Name", placeholder: "Rahul Sharma" },
    { name: "contactEmail", label: "Contact Email", placeholder: "rahul@abc.com" },
    { name: "contactPhone", label: "Contact Phone", placeholder: "9876543210" },
    { name: "city", label: "City", placeholder: "Noida" },
    { name: "state", label: "State", placeholder: "Uttar Pradesh" },
    { name: "gstNumber", label: "GST Number", placeholder: "09ABCDE1234F1Z5" }
  ],
  policies: [
    { name: "client", label: "Client ID", placeholder: "Paste client _id" },
    { name: "name", label: "Policy Name", placeholder: "Grade A Leave Policy" },
    {
      name: "type",
      label: "Policy Type",
      type: "select",
      options: ["Attendance", "Leave", "Tour", "Claim", "Resignation"]
    },
    { name: "grade", label: "Grade", placeholder: "A" },
    { name: "effectiveFrom", label: "Effective From", type: "date" },
    { name: "maximumAmount", label: "Max Amount / Limit", type: "number" },
    { name: "noticePeriodDays", label: "Notice Period Days", type: "number" }
  ],
  jobs: [
    { name: "client", label: "Client ID", placeholder: "Paste client _id" },
    { name: "title", label: "Job Title", placeholder: "HR Executive" },
    { name: "department", label: "Department", placeholder: "Human Resources" },
    { name: "grade", label: "Grade", placeholder: "A" },
    { name: "vacancies", label: "Vacancies", type: "number" },
    { name: "salaryMin", label: "Min Salary", type: "number" },
    { name: "salaryMax", label: "Max Salary", type: "number" },
    { name: "experienceMin", label: "Min Experience", type: "number" },
    { name: "experienceMax", label: "Max Experience", type: "number" },
    { name: "skills", label: "Skills comma separated", placeholder: "Excel, Payroll, HRMS" },
    { name: "location", label: "Location", placeholder: "Noida" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["Draft", "Open", "On Hold", "Closed"]
    },
    { name: "description", label: "Description", type: "textarea" }
  ],
  offers: [
    { name: "candidate", label: "Candidate ID", placeholder: "Paste candidate _id" },
    { name: "designation", label: "Designation", placeholder: "HR Executive" },
    { name: "joiningDate", label: "Joining Date", type: "date" },
    { name: "basic", label: "Basic Salary", type: "number" },
    { name: "hra", label: "HRA", type: "number" },
    { name: "specialAllowance", label: "Special Allowance", type: "number" },
    { name: "pf", label: "PF Deduction", type: "number" },
    { name: "professionalTax", label: "Professional Tax", type: "number" },
    { name: "ctc", label: "CTC", type: "number" },
    {
      name: "requiresInternalApproval",
      label: "Needs Internal Approval?",
      type: "select",
      options: ["No", "Yes"]
    }
  ],
  employees: [
    { name: "offer", label: "Accepted Offer ID", placeholder: "Paste offer _id" },
    { name: "department", label: "Department", placeholder: "Human Resources" },
    { name: "grade", label: "Grade", placeholder: "A" },
    { name: "phone", label: "Phone", placeholder: "9876543210" },
    { name: "aadhaar", label: "Aadhaar", placeholder: "123412341234" },
    { name: "pan", label: "PAN", placeholder: "ABCDE1234F" },
    { name: "bankName", label: "Bank Name", placeholder: "HDFC Bank" },
    { name: "accountNumber", label: "Account Number", placeholder: "1234567890" },
    { name: "ifscCode", label: "IFSC Code", placeholder: "HDFC0001234" }
  ],
  attendance: [
    { name: "employee", label: "Employee ID (admin/payroll only)", placeholder: "Paste employee _id" },
    { name: "date", label: "Date", type: "date" },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["Present", "Absent", "Half Day", "Leave", "Holiday", "Weekly Off"]
    },
    { name: "checkIn", label: "Check In", type: "datetime-local" },
    { name: "checkOut", label: "Check Out", type: "datetime-local" },
    { name: "remarks", label: "Remarks", placeholder: "Optional remarks" }
  ],
  leaves: [
    {
      name: "leaveType",
      label: "Leave Type",
      type: "select",
      options: ["Casual", "Sick", "Earned", "Unpaid", "Other"]
    },
    { name: "fromDate", label: "From Date", type: "date" },
    { name: "toDate", label: "To Date", type: "date" },
    { name: "reason", label: "Reason", type: "textarea" },
    { name: "approver", label: "Approver User ID", placeholder: "Paste manager/admin user _id" }
  ],
  tours: [
    { name: "purpose", label: "Purpose", placeholder: "Client visit" },
    { name: "fromLocation", label: "From Location", placeholder: "Noida" },
    { name: "destination", label: "Destination", placeholder: "Mumbai" },
    { name: "startDate", label: "Start Date", type: "date" },
    { name: "endDate", label: "End Date", type: "date" },
    {
      name: "travelMode",
      label: "Travel Mode",
      type: "select",
      options: ["Flight", "Train", "Bus", "Cab", "Own Vehicle", "Other"]
    },
    { name: "estimatedAmount", label: "Estimated Amount", type: "number" },
    {
      name: "advanceRequired",
      label: "Advance Required?",
      type: "select",
      options: ["No", "Yes"]
    },
    { name: "advanceAmount", label: "Advance Amount", type: "number" },
    { name: "approver", label: "Approver User ID", placeholder: "Paste manager/admin user _id" }
  ],
  expenses: [
    { name: "title", label: "Claim Title", placeholder: "Mumbai client visit expenses" },
    { name: "tour", label: "Tour ID optional", placeholder: "Paste tour _id" },
    {
      name: "category",
      label: "Category",
      type: "select",
      options: ["Travel", "Accommodation", "Food", "Fuel", "Medical", "Office", "Other"]
    },
    { name: "expenseDate", label: "Expense Date", type: "date" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "amount", label: "Amount", type: "number" },
    { name: "receiptUrl", label: "Receipt URL", placeholder: "https://example.com/receipt.pdf" },
    { name: "approver", label: "Approver User ID", placeholder: "Paste manager/admin user _id" }
  ],
  payroll: [
    { name: "employee", label: "Employee ID", placeholder: "Paste employee _id" },
    { name: "month", label: "Month", type: "number" },
    { name: "year", label: "Year", type: "number" },
    { name: "totalWorkingDays", label: "Total Working Days", type: "number" },
    { name: "basic", label: "Basic", type: "number" },
    { name: "hra", label: "HRA", type: "number" },
    { name: "specialAllowance", label: "Special Allowance", type: "number" },
    { name: "pf", label: "PF", type: "number" },
    { name: "professionalTax", label: "Professional Tax", type: "number" }
  ],
  resignations: [
    { name: "resignationDate", label: "Resignation Date", type: "date" },
    { name: "requestedLastWorkingDate", label: "Requested Last Working Date", type: "date" },
    { name: "reason", label: "Reason", type: "textarea" },
    { name: "remarks", label: "Remarks", placeholder: "Optional remarks" },
    { name: "approver", label: "Approver User ID", placeholder: "Paste manager/admin user _id" }
  ]
};

const requiredFields = [
  "name",
  "code",
  "industry",
  "contactName",
  "contactEmail",
  "contactPhone",
  "email",
  "password",
  "role",
  "client",
  "type",
  "grade",
  "title",
  "department",
  "description",
  "location",
  "effectiveFrom",
  "candidate",
  "designation",
  "joiningDate",
  "ctc",
  "offer",
  "employee",
  "date",
  "status",
  "leaveType",
  "fromDate",
  "toDate",
  "reason",
  "approver",
  "purpose",
  "fromLocation",
  "destination",
  "startDate",
  "endDate",
  "travelMode",
  "estimatedAmount",
  "category",
  "expenseDate",
  "amount",
  "month",
  "year",
  "totalWorkingDays"
];

const getDisplayValue = (value) => {
  if (value === null || value === undefined) return "-";

  if (Array.isArray(value)) {
    return value.length ? `${value.length} item(s)` : "-";
  }

  if (typeof value === "object") {
    return value.name || value.title || value.employeeCode || value.code || value.email || "-";
  }

  return String(value);
};

const buildPayload = (module, form) => {
  if (module === "users") {
    return {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      client: form.client || null
    };
  }

  if (module === "clients") {
    return {
      name: form.name,
      code: form.code,
      industry: form.industry,
      contactPerson: {
        name: form.contactName,
        email: form.contactEmail,
        phone: form.contactPhone
      },
      address: {
        city: form.city,
        state: form.state,
        country: "India"
      },
      gstNumber: form.gstNumber
    };
  }

  if (module === "policies") {
    return {
      client: form.client,
      name: form.name,
      type: form.type,
      grade: form.grade,
      effectiveFrom: form.effectiveFrom,
      rules: {
        maximumAmount: Number(form.maximumAmount || 0),
        noticePeriodDays: Number(form.noticePeriodDays || 0)
      }
    };
  }

  if (module === "jobs") {
    return {
      client: form.client,
      title: form.title,
      department: form.department,
      grade: form.grade,
      vacancies: Number(form.vacancies || 1),
      salaryRange: {
        minimum: Number(form.salaryMin || 0),
        maximum: Number(form.salaryMax || 0)
      },
      experience: {
        minimum: Number(form.experienceMin || 0),
        maximum: Number(form.experienceMax || 0)
      },
      skills: form.skills
        ? form.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
        : [],
      description: form.description,
      location: form.location,
      status: form.status || "Draft"
    };
  }

  if (module === "offers") {
    const earnings = [
      { name: "Basic", amount: Number(form.basic || 0) },
      { name: "HRA", amount: Number(form.hra || 0) },
      { name: "Special Allowance", amount: Number(form.specialAllowance || 0) }
    ];

    const deductions = [
      { name: "PF", amount: Number(form.pf || 0) },
      { name: "Professional Tax", amount: Number(form.professionalTax || 0) }
    ];

    return {
      candidate: form.candidate,
      designation: form.designation,
      joiningDate: form.joiningDate,
      earnings,
      deductions,
      ctc: Number(form.ctc || 0),
      requiresInternalApproval: form.requiresInternalApproval === "Yes"
    };
  }

  if (module === "employees") {
    return {
      offer: form.offer,
      department: form.department,
      grade: form.grade,
      personalDetails: {
        phone: form.phone,
        aadhaar: form.aadhaar,
        pan: form.pan
      },
      bankDetails: {
        bankName: form.bankName,
        accountNumber: form.accountNumber,
        ifscCode: form.ifscCode
      }
    };
  }

  if (module === "attendance") {
    const payload = {
      date: form.date,
      status: form.status,
      checkIn: form.checkIn || undefined,
      checkOut: form.checkOut || undefined,
      remarks: form.remarks
    };

    if (form.employee) {
      payload.employee = form.employee;
    }

    return payload;
  }

  if (module === "leaves") {
    return {
      leaveType: form.leaveType,
      fromDate: form.fromDate,
      toDate: form.toDate,
      reason: form.reason,
      approver: form.approver
    };
  }

  if (module === "tours") {
    return {
      purpose: form.purpose,
      fromLocation: form.fromLocation,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      travelMode: form.travelMode,
      estimatedAmount: Number(form.estimatedAmount || 0),
      advanceRequired: form.advanceRequired === "Yes",
      advanceAmount: Number(form.advanceAmount || 0),
      approver: form.approver
    };
  }

  if (module === "expenses") {
    return {
      title: form.title,
      tour: form.tour || null,
      items: [
        {
          category: form.category,
          expenseDate: form.expenseDate,
          description: form.description,
          amount: Number(form.amount || 0),
          receiptUrl: form.receiptUrl
        }
      ],
      approver: form.approver
    };
  }

  if (module === "payroll") {
    return {
      employee: form.employee,
      month: Number(form.month || 1),
      year: Number(form.year || new Date().getFullYear()),
      totalWorkingDays: Number(form.totalWorkingDays || 30),
      earnings: [
        { name: "Basic", amount: Number(form.basic || 0) },
        { name: "HRA", amount: Number(form.hra || 0) },
        { name: "Special Allowance", amount: Number(form.specialAllowance || 0) }
      ],
      deductions: [
        { name: "PF", amount: Number(form.pf || 0) },
        { name: "Professional Tax", amount: Number(form.professionalTax || 0) }
      ]
    };
  }

  if (module === "resignations") {
    return {
      resignationDate: form.resignationDate || undefined,
      requestedLastWorkingDate: form.requestedLastWorkingDate || undefined,
      reason: form.reason,
      remarks: form.remarks,
      approver: form.approver
    };
  }

  return form;
};

const getCreateRequest = (module, endpoint, payload, user) => {
  if (module === "attendance") {
    const route =
      user?.role === "Employee" && !payload.employee
        ? "/attendance/mark"
        : "/attendance/manual";

    return api[route === "/attendance/manual" ? "put" : "post"](route, payload);
  }

  if (module === "payroll") {
    return api.post("/payroll/generate", payload);
  }

  return api.post(endpoint, payload);
};

const isFieldRequired = (module, fieldName) => {
  if (module === "users" && fieldName === "client") return false;
  if (module === "attendance" && fieldName === "employee") return false;
  if (module === "expenses" && ["tour", "receiptUrl"].includes(fieldName)) return false;
  if (module === "tours" && fieldName === "advanceAmount") return false;
  if (module === "resignations" && ["resignationDate", "requestedLastWorkingDate", "remarks"].includes(fieldName)) return false;
  if (module === "offers" && fieldName === "requiresInternalApproval") return false;

  return requiredFields.includes(fieldName);
};

const ModulePage = ({ module, title }) => {
  const { user } = useAuth();

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({});
  const [applyForm, setApplyForm] = useState({
    phone: "",
    resumeUrl: "",
    expectedSalary: "",
    totalExperience: ""
  });
  const [selectedJob, setSelectedJob] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const configuration = endpointConfiguration[module];
  const formFields = formConfigurations[module] || [];
  const canCreate = formFields.length > 0;

  const loadRecords = async () => {
    if (!configuration) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await api.get(configuration.endpoint);
      setRecords(data[configuration.key] || []);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load ${title}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setForm({});
    setSelectedJob(null);
    setShowForm(false);
    setSearchTerm("");
    setStatusFilter("All");
    loadRecords();
  }, [module]);

  const columns = useMemo(() => {
    if (!records.length) return [];

    return Object.keys(records[0])
      .filter((key) => !["_id", "__v", "createdAt", "updatedAt", "password"].includes(key))
      .slice(0, 7);
  }, [records]);

  const statusOptions = useMemo(() => {
    const statuses = records
      .map((record) => record.status)
      .filter((status) => status !== undefined && status !== null && status !== "");

    return ["All", ...new Set(statuses.map(String))];
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const matchesStatus =
        statusFilter === "All" || String(record.status || "") === statusFilter;

      const matchesSearch =
        !query ||
        Object.values(record).some((value) =>
          getDisplayValue(value).toLowerCase().includes(query)
        );

      return matchesStatus && matchesSearch;
    });
  }, [records, searchTerm, statusFilter]);

  const renderCellValue = (column, value) => {
    const displayValue = getDisplayValue(value);

    if (column === "status") {
      return (
        <span className={`status-pill ${displayValue.toLowerCase().replace(/\s+/g, "-")}`}>
          {displayValue}
        </span>
      );
    }

    if (String(displayValue).startsWith("http")) {
      return (
        <a className="mini-link" href={displayValue} target="_blank" rel="noreferrer">
          Open
        </a>
      );
    }

    return displayValue;
  };

  const handleChange = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = buildPayload(module, form);
      await getCreateRequest(module, configuration.endpoint, payload, user);

      setSuccess(`${title} created successfully`);
      setForm({});
      setShowForm(false);
      await loadRecords();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to create ${title}`);
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (label, request) => {
    setError("");
    setSuccess("");

    try {
      await request();
      setSuccess(`${label} completed successfully`);
      await loadRecords();
    } catch (err) {
      setError(err.response?.data?.message || `${label} failed`);
    }
  };

  const applyForJob = async (event) => {
    event.preventDefault();

    await runAction("Job application", () =>
      api.post("/candidates", {
        job: selectedJob._id,
        phone: applyForm.phone,
        resumeUrl: applyForm.resumeUrl,
        expectedSalary: Number(applyForm.expectedSalary || 0),
        totalExperience: Number(applyForm.totalExperience || 0)
      })
    );

    setSelectedJob(null);
    setApplyForm({
      phone: "",
      resumeUrl: "",
      expectedSalary: "",
      totalExperience: ""
    });
  };

  const renderActions = (record) => {
    const actions = [];

    if (module === "jobs" && user?.role === "Candidate" && record.status === "Open") {
      actions.push(
        <button key="apply" className="mini-button" onClick={() => setSelectedJob(record)}>
          Apply
        </button>
      );
    }

    if (module === "candidates" && ["Super Admin", "HR Admin"].includes(user?.role)) {
      if (record.status === "Applied") {
        actions.push(
          <button
            key="shortlist"
            className="mini-button"
            onClick={() =>
              runAction("Shortlist", () =>
                api.patch(`/candidates/${record._id}/status`, { status: "Shortlisted" })
              )
            }
          >
            Shortlist
          </button>
        );
      }

      if (["Shortlisted", "Interview"].includes(record.status)) {
        actions.push(
          <button
            key="pre-offer"
            className="mini-button"
            onClick={() =>
              runAction("Pre-Offer", () =>
                api.patch(`/candidates/${record._id}/status`, { status: "Pre-Offer" })
              )
            }
          >
            Move Pre-Offer
          </button>
        );
      }

      if (["Shortlisted", "Interview", "Pre-Offer"].includes(record.status)) {
        actions.push(
          <button
            key="submit-client"
            className="mini-button"
            onClick={() =>
              runAction("Submit to client", () =>
                api.patch(`/candidates/${record._id}/submit-to-client`)
              )
            }
          >
            Submit to Client
          </button>
        );
      }
    }

    if (module === "offers" && ["Super Admin", "HR Admin"].includes(user?.role)) {
      actions.push(
        <button
          key="offer-letter"
          className="mini-button"
          onClick={() =>
            downloadFile(`/documents/offer/${record._id}`, `offer-letter-${record._id}.pdf`)
          }
        >
          Offer PDF
        </button>
      );

      if (record.status === "Pending Approval") {
        actions.push(
          <button
            key="approve-offer"
            className="mini-button"
            onClick={() =>
              runAction("Offer approval", () =>
                api.patch(`/offers/${record._id}/approve`, { decision: "Approved" })
              )
            }
          >
            Approve
          </button>
        );
      }

      if (record.status === "Approved") {
        actions.push(
          <button
            key="send-offer"
            className="mini-button"
            onClick={() => runAction("Offer send", () => api.patch(`/offers/${record._id}/send`))}
          >
            Send
          </button>
        );
      }
    }

    if (module === "offers" && user?.role === "Candidate" && record.status === "Sent") {
      actions.push(
        <button
          key="accept-offer"
          className="mini-button"
          onClick={() =>
            runAction("Offer response", () =>
              api.patch(`/offers/${record._id}/respond`, {
                decision: "Accepted",
                remarks: "Accepted from portal"
              })
            )
          }
        >
          Accept
        </button>
      );
    }

    if (["leaves", "tours", "expenses", "resignations"].includes(module)) {
      const processPath = {
        leaves: `/leaves/${record._id}/process`,
        tours: `/tours/${record._id}/process`,
        expenses: `/expenses/${record._id}/process`,
        resignations: `/resignations/${record._id}/process`
      }[module];

      if (
        record.status === "Pending" &&
        ["Super Admin", "HR Admin", "Manager", "Client Approver"].includes(user?.role)
      ) {
        actions.push(
          <button
            key="approve"
            className="mini-button"
            onClick={() =>
              runAction("Approval", () =>
                api.patch(processPath, {
                  decision: "Approved",
                  remarks: "Approved from portal"
                })
              )
            }
          >
            Approve
          </button>
        );

        actions.push(
          <button
            key="reject"
            className="mini-button danger"
            onClick={() =>
              runAction("Rejection", () =>
                api.patch(processPath, {
                  decision: "Rejected",
                  remarks: "Rejected from portal"
                })
              )
            }
          >
            Reject
          </button>
        );
      }
    }

    if (module === "expenses" && record.status === "Approved" && ["Super Admin", "Payroll Team"].includes(user?.role)) {
      actions.push(
        <button
          key="pay-claim"
          className="mini-button"
          onClick={() => runAction("Claim payment", () => api.patch(`/expenses/${record._id}/pay`))}
        >
          Process
        </button>
      );
    }

    if (module === "payroll" && ["Super Admin", "Payroll Team"].includes(user?.role)) {
      actions.push(
        <button
          key="payslip"
          className="mini-button"
          onClick={() =>
            downloadFile(`/documents/payslip/${record._id}`, `payslip-${record.month}-${record.year}.pdf`)
          }
        >
          Payslip
        </button>
      );

      if (record.status === "Draft") {
        actions.push(
          <button
            key="confirm"
            className="mini-button"
            onClick={() => runAction("Payroll confirm", () => api.patch(`/payroll/${record._id}/confirm`))}
          >
            Confirm
          </button>
        );
      }

      if (record.status === "Confirmed") {
        actions.push(
          <button
            key="paid"
            className="mini-button"
            onClick={() => runAction("Payroll paid", () => api.patch(`/payroll/${record._id}/paid`))}
          >
            Paid
          </button>
        );
      }
    }

    if (module === "employees" && ["Super Admin", "HR Admin"].includes(user?.role)) {
      actions.push(
        <button
          key="appointment"
          className="mini-button"
          onClick={() =>
            downloadFile(
              `/documents/appointment/${record._id}`,
              `appointment-letter-${record.employeeCode || record._id}.pdf`
            )
          }
        >
          Appointment PDF
        </button>
      );
    }

    if (!actions.length) return "-";

    return <div className="row-actions">{actions}</div>;
  };

  if (!configuration) {
    return (
      <section>
        <div className="error-message">Unknown module: {module}</div>
      </section>
    );
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>{title}</h1>
          <p>View and manage {title.toLowerCase()}</p>
        </div>

        <div className="page-actions">
          <button className="secondary-button" onClick={loadRecords}>
            Refresh
          </button>

          {canCreate && (
            <button
              className="primary-button"
              onClick={() => setShowForm((value) => !value)}
            >
              {showForm ? "Close" : "+ Add New"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="content-card module-toolbar">
        <div>
          <strong>{filteredRecords.length}</strong>
          <span> of {records.length} records</span>
        </div>

        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={`Search ${title.toLowerCase()}...`}
        />

        {statusOptions.length > 1 && (
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "All" ? "All statuses" : status}
              </option>
            ))}
          </select>
        )}
      </div>

      {showForm && canCreate && (
        <form className="content-card form-grid" onSubmit={submitCreate}>
          {formFields.map((field) => (
            <label key={field.name}>
              {field.label}

              {field.type === "select" ? (
                <select
                  value={form[field.name] || ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  required={isFieldRequired(module, field.name)}
                >
                  <option value="">Select</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : field.type === "textarea" ? (
                <textarea
                  value={form[field.name] || ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  required={isFieldRequired(module, field.name)}
                />
              ) : (
                <input
                  type={field.type || "text"}
                  value={form[field.name] || ""}
                  placeholder={field.placeholder}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  required={isFieldRequired(module, field.name)}
                />
              )}
            </label>
          ))}

          <button className="primary-button" disabled={saving}>
            {saving ? "Saving..." : `Save ${title}`}
          </button>
        </form>
      )}

      {selectedJob && (
        <form className="content-card form-grid" onSubmit={applyForJob}>
          <h3>Apply for {selectedJob.title}</h3>

          <label>
            Phone
            <input
              value={applyForm.phone}
              onChange={(event) =>
                setApplyForm((current) => ({ ...current, phone: event.target.value }))
              }
              required
            />
          </label>

          <label>
            Resume URL
            <input
              value={applyForm.resumeUrl}
              onChange={(event) =>
                setApplyForm((current) => ({ ...current, resumeUrl: event.target.value }))
              }
              placeholder="https://example.com/resume.pdf"
              required
            />
          </label>

          <div>
            <FileUploadField
              label="Upload Resume"
              folder="resumes"
              onUploaded={(url) =>
                setApplyForm((current) => ({ ...current, resumeUrl: url }))
              }
            />
          </div>

          <label>
            Expected Salary
            <input
              type="number"
              value={applyForm.expectedSalary}
              onChange={(event) =>
                setApplyForm((current) => ({ ...current, expectedSalary: event.target.value }))
              }
            />
          </label>

          <label>
            Total Experience
            <input
              type="number"
              value={applyForm.totalExperience}
              onChange={(event) =>
                setApplyForm((current) => ({ ...current, totalExperience: event.target.value }))
              }
            />
          </label>

          <button className="primary-button">Submit Application</button>
          <button type="button" className="secondary-button" onClick={() => setSelectedJob(null)}>
            Cancel
          </button>
        </form>
      )}

      <div className="content-card table-card">
        {loading ? (
          <p className="table-padding">Loading...</p>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <h3>No records found</h3>
            <p>Try changing your search or filter, or add a new record.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  {columns.map((column) => (
                    <th key={column}>{column.replace(/([A-Z])/g, " $1")}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record._id}>
                    <td>
                      <code>{record._id}</code>
                    </td>

                    {columns.map((column) => (
                      <td key={column}>{renderCellValue(column, record[column])}</td>
                    ))}

                    <td>{renderActions(record)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default ModulePage;

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Briefcase,
  CircleDollarSign,
  Clock3,
  ShieldCheck,
  Users
} from "lucide-react";
import api from "../api/axios";

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

const maxValue = (items, key) => Math.max(1, ...items.map((item) => Number(item[key] || 0)));

const MiniBars = ({ data, valueKey, labelKey = "month", money = false }) => {
  const max = maxValue(data, valueKey);

  return (
    <div className="mini-bars">
      {data.map((item) => {
        const value = Number(item[valueKey] || 0);
        return (
          <div className="mini-bar-row" key={`${item[labelKey]}-${valueKey}`}>
            <span>{item[labelKey]}</span>
            <div>
              <i style={{ width: `${Math.max(4, (value / max) * 100)}%` }} />
            </div>
            <strong>{money ? currency(value) : value}</strong>
          </div>
        );
      })}
      {!data.length && <p className="muted-text">No trend data yet.</p>}
    </div>
  );
};

const Funnel = ({ data }) => {
  const max = maxValue(data, "value");

  return (
    <div className="analytics-funnel">
      {data.map((item) => (
        <div className="funnel-row" key={item.label}>
          <span>{item.label}</span>
          <div>
            <i style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
};

const ExecutiveAnalytics = ({ clientView = false }) => {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/reports/executive");
      setAnalytics(data.analytics || null);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load executive analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const kpis = analytics?.kpis || {};
  const attendance = analytics?.attendance || { byStatus: {}, late: 0, overtime: 0 };
  const compliance = analytics?.compliance || {};

  const cards = useMemo(
    () => [
      {
        title: clientView ? "Assigned Employees" : "Active Employees",
        value: kpis.activeEmployees || 0,
        icon: Users,
        helper: "Current manpower strength"
      },
      {
        title: "Hiring Pipeline",
        value: kpis.totalCandidates || 0,
        icon: Briefcase,
        helper: "Candidates across all stages"
      },
      {
        title: "Monthly Payroll",
        value: currency(kpis.payrollCost?.netSalary || 0),
        icon: CircleDollarSign,
        helper: `${kpis.payrollCost?.headcount || 0} payroll records`
      },
      {
        title: "Outstanding Revenue",
        value: currency(kpis.invoiceRevenue?.outstanding || 0),
        icon: BarChart3,
        helper: "Open invoice value"
      },
      {
        title: "Pending Approvals",
        value: kpis.pendingApprovals || 0,
        icon: Clock3,
        helper: `${kpis.overdueApprovals || 0} overdue SLA`
      },
      {
        title: "Compliance Verified",
        value: compliance.Verified || 0,
        icon: ShieldCheck,
        helper: `${compliance.Pending || 0} pending checks`
      }
    ],
    [kpis, compliance, clientView]
  );

  return (
    <section>
      <div className={clientView ? "client-heading" : "page-heading"}>
        <div>
          <h1>{clientView ? "Client Analytics" : "Executive Analytics"}</h1>
          <p>Live business intelligence across manpower, hiring, payroll, SLA and compliance.</p>
        </div>
        <button className="secondary-button" onClick={loadAnalytics}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="content-card">Loading executive analytics...</div>
      ) : (
        <>
          <div className="analytics-kpi-grid">
            {cards.map(({ title, value, icon: Icon, helper }) => (
              <article className="content-card analytics-kpi-card" key={title}>
                <Icon size={24} />
                <span>{title}</span>
                <strong>{value}</strong>
                <small>{helper}</small>
              </article>
            ))}
          </div>

          <div className="analytics-grid">
            <article className="content-card">
              <div className="table-section-heading">
                <h3>Hiring Funnel</h3>
                <p>Application to joining conversion flow.</p>
              </div>
              <Funnel data={analytics?.hiringFunnel || []} />
            </article>

            <article className="content-card">
              <div className="table-section-heading">
                <h3>Attendance Health Today</h3>
                <p>Shift-based smart attendance signals.</p>
              </div>
              <div className="attendance-health-grid">
                {[
                  ["Present", attendance.byStatus?.Present || 0],
                  ["Absent", attendance.byStatus?.Absent || 0],
                  ["Leave", attendance.byStatus?.Leave || 0],
                  ["Late", attendance.late || 0],
                  ["Overtime", attendance.overtime || 0]
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="content-card">
              <div className="table-section-heading">
                <h3>Hiring Trend</h3>
                <p>Monthly candidate flow and joining.</p>
              </div>
              <MiniBars data={analytics?.trends?.hiring || []} valueKey="candidates" />
            </article>

            <article className="content-card">
              <div className="table-section-heading">
                <h3>Revenue Trend</h3>
                <p>Invoice value created month-wise.</p>
              </div>
              <MiniBars data={analytics?.trends?.revenue || []} valueKey="revenue" money />
            </article>
          </div>

          {!clientView && (
            <div className="content-card table-card">
              <div className="table-section-heading">
                <h3>Client Manpower Scorecard</h3>
                <p>Top clients by active employee allocation.</p>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Code</th>
                      <th>Active Employees</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(analytics?.clientManpower || []).map((client) => (
                      <tr key={client.clientId}>
                        <td>{client.name}</td>
                        <td>{client.code}</td>
                        <td>{client.employees}</td>
                      </tr>
                    ))}
                    {!analytics?.clientManpower?.length && (
                      <tr>
                        <td colSpan="3">No manpower data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default ExecutiveAnalytics;

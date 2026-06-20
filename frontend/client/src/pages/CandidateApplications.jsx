import { useEffect, useState } from "react";
import api from "../api/axios";

const stages = ["Applied", "Shortlisted", "Interview", "Pre-Offer", "Offered", "Joined"];

const CandidateApplications = () => {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/candidates");
      setApplications(data.candidates || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const withdrawApplication = async (applicationId) => {
    setError("");
    setSuccess("");

    try {
      await api.delete(`/candidates/${applicationId}`);
      setSuccess("Application withdrawn successfully");
      await loadApplications();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to withdraw application");
    }
  };

  return (
    <section>
      <div className="candidate-heading">
        <div>
          <h1>My Applications</h1>
          <p>Track your application stage from applied to joining.</p>
        </div>
        <button className="secondary-button" onClick={loadApplications}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="content-card">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="empty-state content-card">
          <h3>No applications yet</h3>
          <p>Apply for an open job and it will appear here.</p>
        </div>
      ) : (
        <div className="application-list">
          {applications.map((application) => {
            const currentStage = Math.max(0, stages.indexOf(application.status));

            return (
              <article className="application-card" key={application._id}>
                <div className="application-header">
                  <div>
                    <h3>{application.job?.title || "Job"}</h3>
                    <p>{application.client?.name || "Client"} • {application.job?.department || "Department"}</p>
                  </div>
                  <span className={`status-pill ${application.status === "Rejected" ? "danger" : ""}`}>
                    {application.status}
                  </span>
                </div>

                <div className="stage-track">
                  {stages.map((stage, index) => (
                    <div
                      className={`stage-item ${index <= currentStage ? "active" : ""}`}
                      key={stage}
                    >
                      <span>{index + 1}</span>
                      <small>{stage}</small>
                    </div>
                  ))}
                </div>

                <div className="application-details">
                  <span>Phone: {application.phone}</span>
                  <span>Experience: {application.totalExperience || 0} years</span>
                  <span>Expected: {application.expectedSalary || 0}</span>
                  <span>Match: {application.matchScore || 0}% - {application.matchRecommendation || "Review"}</span>
                </div>

                {application.status === "Applied" && (
                  <button
                    className="secondary-button"
                    onClick={() => withdrawApplication(application._id)}
                  >
                    Withdraw Application
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default CandidateApplications;

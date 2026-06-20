import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const stages = ["Applied", "Shortlisted", "Interview", "Pre-Offer", "Offered", "Joined", "Rejected"];

const PipelineBoard = () => {
  const [candidates, setCandidates] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCandidates = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/candidates");
      setCandidates(data.candidates || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load candidate pipeline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const grouped = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage] = candidates.filter((candidate) => candidate.status === stage);
      return acc;
    }, {});
  }, [candidates]);

  const moveCandidate = async (candidate, status) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/candidates/${candidate._id}/status`, { status });
      setSuccess(`${candidate.user?.name || "Candidate"} moved to ${status}`);
      await loadCandidates();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to move candidate");
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Candidate Pipeline</h1>
          <p>Visual hiring board across all client jobs.</p>
        </div>
        <button className="secondary-button" onClick={loadCandidates}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="content-card">Loading pipeline...</div>
      ) : (
        <div className="pipeline-board">
          {stages.map((stage) => (
            <div className="pipeline-column" key={stage}>
              <div className="pipeline-column-header">
                <strong>{stage}</strong>
                <span>{grouped[stage]?.length || 0}</span>
              </div>

              {(grouped[stage] || []).map((candidate) => (
                <article className="pipeline-card" key={candidate._id}>
                  <h3>{candidate.user?.name || "Candidate"}</h3>
                  <p>{candidate.job?.title || "Job"} - {candidate.client?.name || "Client"}</p>
                  <small>{candidate.totalExperience || 0} yrs exp | Expected Rs. {candidate.expectedSalary || 0}</small>
                  <select
                    value={candidate.status}
                    onChange={(event) => moveCandidate(candidate, event.target.value)}
                  >
                    {stages.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default PipelineBoard;

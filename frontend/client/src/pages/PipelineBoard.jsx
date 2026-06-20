import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const stages = [
  "Applied",
  "Shortlisted",
  "Interview",
  "Submitted to Client",
  "Client Shortlisted",
  "Client Rejected",
  "More Profiles Requested",
  "Pre-Offer",
  "Offered",
  "Joined",
  "Rejected"
];

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
      acc[stage] = candidates
        .filter((candidate) => candidate.status === stage)
        .sort((a, b) => Number(b.matchScore || 0) - Number(a.matchScore || 0));
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

  const refreshMatch = async (candidate) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/candidates/${candidate._id}/match`);
      setSuccess(`Match refreshed for ${candidate.user?.name || "Candidate"}`);
      await loadCandidates();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to refresh match score");
    }
  };

  const refreshAllMatches = async () => {
    setError("");
    setSuccess("");

    try {
      const { data } = await api.patch("/candidates/match/recalculate-all");
      setSuccess(data.message || "All match scores refreshed");
      await loadCandidates();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to refresh match scores");
    }
  };

  const submitToClient = async (candidate) => {
    setError("");
    setSuccess("");

    try {
      await api.patch(`/candidates/${candidate._id}/submit-to-client`);
      setSuccess(`${candidate.user?.name || "Candidate"} submitted to client`);
      await loadCandidates();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit candidate to client");
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Candidate Pipeline</h1>
          <p>Visual hiring board with AI-style job fit scoring.</p>
        </div>
        <div className="page-actions">
          <button className="secondary-button" onClick={refreshAllMatches}>Recalculate All</button>
          <button className="secondary-button" onClick={loadCandidates}>Refresh</button>
        </div>
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
                  <div className="match-meter">
                    <div>
                      <strong>{candidate.matchScore || 0}%</strong>
                      <span>{candidate.matchRecommendation || "Review"}</span>
                    </div>
                    <i style={{ width: `${candidate.matchScore || 0}%` }} />
                  </div>
                  <div className="match-tags">
                    {(candidate.matchedSkills || []).slice(0, 3).map((skill) => (
                      <span key={skill}>{skill}</span>
                    ))}
                    {(candidate.missingSkills || []).slice(0, 2).map((skill) => (
                      <span className="missing" key={skill}>Missing {skill}</span>
                    ))}
                  </div>
                  <select
                    value={candidate.status}
                    onChange={(event) => moveCandidate(candidate, event.target.value)}
                  >
                    {stages.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  <button className="mini-button" onClick={() => refreshMatch(candidate)}>
                    Recalculate Match
                  </button>
                  {["Shortlisted", "Interview", "Pre-Offer"].includes(candidate.status) && (
                    <button className="mini-button" onClick={() => submitToClient(candidate)}>
                      Submit to Client
                    </button>
                  )}
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

import { useEffect, useState } from "react";
import api from "../api/axios";

const initialApplication = {
  phone: "",
  currentCompany: "",
  currentDesignation: "",
  totalExperience: "",
  currentSalary: "",
  expectedSalary: "",
  noticePeriod: "",
  skills: "",
  resumeUrl: ""
};

const CandidateJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState(initialApplication);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/jobs?status=Open");
      setJobs(data.jobs || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load open jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await api.post("/candidates", {
        job: selectedJob._id,
        phone: form.phone,
        currentCompany: form.currentCompany,
        currentDesignation: form.currentDesignation,
        totalExperience: Number(form.totalExperience || 0),
        currentSalary: Number(form.currentSalary || 0),
        expectedSalary: Number(form.expectedSalary || 0),
        noticePeriod: form.noticePeriod,
        skills: form.skills
          ? form.skills.split(",").map((skill) => skill.trim()).filter(Boolean)
          : [],
        resumeUrl: form.resumeUrl
      });

      setSuccess("Application submitted successfully. Track it from My Applications.");
      setSelectedJob(null);
      setForm(initialApplication);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit application");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="candidate-heading">
        <div>
          <h1>Open Jobs</h1>
          <p>Apply for live manpower openings posted by HR.</p>
        </div>
        <button className="secondary-button" onClick={loadJobs}>Refresh</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {selectedJob && (
        <form className="content-card candidate-apply-form" onSubmit={submitApplication}>
          <div className="form-title-row">
            <div>
              <h3>Apply for {selectedJob.title}</h3>
              <p>{selectedJob.location} • {selectedJob.department}</p>
            </div>
            <button type="button" className="secondary-button" onClick={() => setSelectedJob(null)}>
              Close
            </button>
          </div>

          <label>
            Phone
            <input value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} required />
          </label>

          <label>
            Current Company
            <input value={form.currentCompany} onChange={(event) => handleChange("currentCompany", event.target.value)} />
          </label>

          <label>
            Current Designation
            <input value={form.currentDesignation} onChange={(event) => handleChange("currentDesignation", event.target.value)} />
          </label>

          <label>
            Total Experience
            <input type="number" value={form.totalExperience} onChange={(event) => handleChange("totalExperience", event.target.value)} />
          </label>

          <label>
            Current Salary
            <input type="number" value={form.currentSalary} onChange={(event) => handleChange("currentSalary", event.target.value)} />
          </label>

          <label>
            Expected Salary
            <input type="number" value={form.expectedSalary} onChange={(event) => handleChange("expectedSalary", event.target.value)} />
          </label>

          <label>
            Notice Period
            <input value={form.noticePeriod} onChange={(event) => handleChange("noticePeriod", event.target.value)} placeholder="Immediate / 30 days" />
          </label>

          <label>
            Skills
            <input value={form.skills} onChange={(event) => handleChange("skills", event.target.value)} placeholder="React, Payroll, Excel" />
          </label>

          <label className="wide-field">
            Resume URL
            <input value={form.resumeUrl} onChange={(event) => handleChange("resumeUrl", event.target.value)} placeholder="https://drive.google.com/resume.pdf" required />
          </label>

          <button className="primary-button" disabled={saving}>
            {saving ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="content-card">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state content-card">
          <h3>No open jobs right now</h3>
          <p>Open positions will appear here once HR posts them.</p>
        </div>
      ) : (
        <div className="job-grid">
          {jobs.map((job) => (
            <article className="job-card" key={job._id}>
              <div>
                <span className="status-pill">{job.status}</span>
                <h3>{job.title}</h3>
                <p>{job.client?.name || "Client"} • {job.location}</p>
              </div>

              <div className="job-meta">
                <span>{job.department}</span>
                <span>{job.vacancies} opening(s)</span>
                <span>
                  {job.salaryRange?.minimum || 0} - {job.salaryRange?.maximum || 0}
                </span>
              </div>

              <p>{job.description}</p>

              <button className="primary-button" onClick={() => setSelectedJob(job)}>
                Apply Now
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default CandidateJobs;

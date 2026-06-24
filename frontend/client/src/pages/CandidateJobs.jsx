import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import FileUploadField from "../components/FileUploadField";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

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

  const departments = useMemo(() => {
    const uniqueDepartments = new Set(
      jobs.map((job) => job.department).filter(Boolean)
    );

    return ["all", ...Array.from(uniqueDepartments).sort()];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return jobs.filter((job) => {
      const matchesDepartment =
        departmentFilter === "all" || job.department === departmentFilter;
      const searchableText = [
        job.title,
        job.client?.name,
        job.location,
        job.department,
        job.description
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesDepartment && (!query || searchableText.includes(query));
    });
  }, [departmentFilter, jobs, searchTerm]);

  const totalOpenings = jobs.reduce(
    (sum, job) => sum + Number(job.vacancies || 0),
    0
  );

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
    <section className="candidate-jobs-page">
      <div className="candidate-hero">
        <div>
          <span className="candidate-kicker">Verified workforce openings</span>
          <h1>Open Jobs</h1>
          <p>Apply to active manpower requirements from verified client companies.</p>

          <div className="candidate-hero-stats">
            <span><strong>{jobs.length}</strong> live roles</span>
            <span><strong>{totalOpenings}</strong> total openings</span>
            <span><strong>{departments.length - 1}</strong> departments</span>
          </div>
        </div>

        <button className="secondary-button candidate-refresh" onClick={loadJobs}>
          Refresh Jobs
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {selectedJob && (
        <form className="content-card candidate-apply-form premium-apply-form" onSubmit={submitApplication}>
          <div className="form-title-row">
            <div>
              <h3>Apply for {selectedJob.title}</h3>
              <p>
                {selectedJob.client?.name || "Client"} | {selectedJob.location} | {selectedJob.department}
              </p>
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

          <div className="wide-field">
            <FileUploadField
              label="Upload Resume"
              folder="resumes"
              onUploaded={(url) => handleChange("resumeUrl", url)}
            />
          </div>

          <button className="primary-button" disabled={saving}>
            {saving ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="content-card candidate-loading-card">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state content-card">
          <h3>No open jobs right now</h3>
          <p>Open positions will appear here once HR posts them.</p>
        </div>
      ) : (
        <>
          <div className="candidate-job-toolbar">
            <div>
              <label>Search roles</label>
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, company, city..."
              />
            </div>

            <div>
              <label>Department</label>
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
              >
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department === "all" ? "All departments" : department}
                  </option>
                ))}
              </select>
            </div>

            <div className="candidate-result-count">
              <strong>{filteredJobs.length}</strong>
              <span>matching roles</span>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="empty-state content-card">
              <h3>No matching jobs</h3>
              <p>Try changing your search or department filter.</p>
            </div>
          ) : (
            <div className="job-grid premium-job-grid">
              {filteredJobs.map((job) => (
                <article className="job-card premium-job-card" key={job._id}>
                  <div className="job-card-top">
                    <span className="status-pill open">{job.status}</span>
                    <span className="job-openings">{job.vacancies} openings</span>
                  </div>

                  <div className="job-title-block">
                    <h3>{job.title}</h3>
                    <p>{job.client?.name || "Client"} | {job.location}</p>
                  </div>

                  <div className="job-meta premium-job-meta">
                    <span>{job.department || "General"}</span>
                    <span>
                      Rs. {job.salaryRange?.minimum || 0} - {job.salaryRange?.maximum || 0}
                    </span>
                  </div>

                  <p className="job-description">{job.description}</p>

                  <div className="job-card-footer">
                    <small>Application reviewed by HR team</small>
                    <button className="primary-button" onClick={() => setSelectedJob(job)}>
                      Apply Now
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default CandidateJobs;

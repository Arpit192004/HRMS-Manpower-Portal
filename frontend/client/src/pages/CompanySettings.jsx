import { useEffect, useState } from "react";
import api from "../api/axios";
import FileUploadField from "../components/FileUploadField";
import { useCompany } from "../context/CompanyContext";

const fields = [
  ["companyName", "Company Name"],
  ["tagline", "Tagline"],
  ["email", "Business Email"],
  ["phone", "Phone"],
  ["website", "Website"],
  ["address", "Address"],
  ["gstNumber", "GST Number"],
  ["cinNumber", "CIN Number"],
  ["footerText", "Document Footer"]
];

const CompanySettings = () => {
  const { refreshSettings } = useCompany();
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/settings/company");
      setForm(data.settings || {});
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load company settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.put("/settings/company", form);
      await refreshSettings();
      setSuccess("Company branding updated successfully");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update company settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>Company Settings</h1>
          <p>Control branding, contact details and document footer for the live website.</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {loading ? (
        <div className="content-card">Loading company settings...</div>
      ) : (
        <form className="content-card form-grid company-settings-form" onSubmit={saveSettings}>
          <label className="wide-field">
            Logo URL
            <input
              value={form.logoUrl || ""}
              onChange={(event) => handleChange("logoUrl", event.target.value)}
              placeholder="https://..."
            />
          </label>

          <div className="wide-field">
            <FileUploadField
              label="Upload Company Logo"
              folder="branding"
              onUploaded={(url) => handleChange("logoUrl", url)}
            />
          </div>

          {form.logoUrl && (
            <div className="wide-field logo-preview-card">
              <img src={form.logoUrl} alt="Company logo preview" />
              <span>Logo preview</span>
            </div>
          )}

          {fields.map(([name, label]) => (
            <label key={name} className={["address", "footerText"].includes(name) ? "wide-field" : ""}>
              {label}
              {["address", "footerText"].includes(name) ? (
                <textarea
                  value={form[name] || ""}
                  onChange={(event) => handleChange(name, event.target.value)}
                />
              ) : (
                <input
                  value={form[name] || ""}
                  onChange={(event) => handleChange(name, event.target.value)}
                />
              )}
            </label>
          ))}

          <button className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save Company Settings"}
          </button>
        </form>
      )}
    </section>
  );
};

export default CompanySettings;

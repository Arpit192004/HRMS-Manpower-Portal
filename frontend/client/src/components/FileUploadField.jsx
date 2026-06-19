import { useState } from "react";
import api from "../api/axios";

const FileUploadField = ({ label, folder = "documents", onUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const { data } = await api.post("/uploads", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      onUploaded(data.file.url, data.file);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "File upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-field">
      <label>
        {label}
        <input type="file" onChange={handleUpload} />
      </label>
      {fileName && <small>{uploading ? `Uploading ${fileName}...` : `Selected: ${fileName}`}</small>}
      {error && <small className="upload-error">{error}</small>}
    </div>
  );
};

export default FileUploadField;

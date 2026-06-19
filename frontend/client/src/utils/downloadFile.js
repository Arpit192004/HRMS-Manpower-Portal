import api from "../api/axios";

const downloadFile = async (url, filename) => {
  const { data } = await api.get(url, {
    responseType: "blob"
  });

  const blobUrl = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export default downloadFile;

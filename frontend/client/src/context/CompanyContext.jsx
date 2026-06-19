import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const defaultSettings = {
  companyName: "HRMS Manpower Portal",
  tagline: "Complete HRMS and manpower services platform",
  logoUrl: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  footerText: "Thank you for choosing our HRMS manpower services."
};

const CompanyContext = createContext({
  settings: defaultSettings,
  refreshSettings: async () => {}
});

export const CompanyProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);

  const refreshSettings = async () => {
    try {
      const { data } = await api.get("/settings/public");
      setSettings({ ...defaultSettings, ...(data.settings || {}) });
    } catch {
      setSettings(defaultSettings);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <CompanyContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => useContext(CompanyContext);

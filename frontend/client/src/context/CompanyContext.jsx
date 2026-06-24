import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const defaultSettings = {
  companyName: "Niyukti",
  tagline: "From hiring to workforce management",
  logoUrl: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  footerText: "Thank you for choosing Niyukti workforce services."
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

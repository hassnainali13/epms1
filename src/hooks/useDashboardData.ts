import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import type { Panel } from "../context/AppContext";
import {
  fetchCompanyProfile,
  fetchPanels,
  saveCompanyProfile,
  uploadCompanyLogo,
} from "../services/panelService";

export function useDashboardData() {
  const { currentUser } = useApp();
  const [panels, setPanels] = useState<Panel[]>([]);
  const [companyProfile, setCompanyProfile] = useState({
    name: "",
    logoUrl: "",
    installerAccessCode: "",
  });
  const [companySaving, setCompanySaving] = useState(false);
  const [companyNotice, setCompanyNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [panelSearch, setPanelSearch] = useState("");

  const loadPanels = async () => {
    if (!currentUser) return;
    try {
      const nextPanels = await fetchPanels();
      setPanels(nextPanels);
    } catch {
      setPanels([]);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const loadCompany = async () => {
      try {
        const company = await fetchCompanyProfile();
        setCompanyProfile({
          name: company?.name || currentUser.name || "",
          logoUrl: company?.logoUrl || "",
          installerAccessCode: company?.installerAccessCode || "",
        });
      } catch {
        setCompanyProfile({
          name: currentUser.name || "",
          logoUrl: "",
          installerAccessCode: "",
        });
      }
    };

    void loadPanels();
    void loadCompany();
  }, [currentUser]);

  const saveCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    setCompanySaving(true);
    setCompanyNotice(null);
    try {
      const company = await saveCompanyProfile({
        name: companyProfile.name,
        logoUrl: companyProfile.logoUrl,
        installerAccessCode: companyProfile.installerAccessCode,
      });
      setCompanyProfile({
        name: company?.name || companyProfile.name,
        logoUrl: company?.logoUrl || companyProfile.logoUrl,
        installerAccessCode:
          company?.installerAccessCode || companyProfile.installerAccessCode,
      });
      setCompanyNotice({ type: "success", text: "Company profile updated." });
    } catch (error) {
      setCompanyNotice({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to update company profile.",
      });
    } finally {
      setCompanySaving(false);
    }
  };

  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCompanySaving(true);
    setCompanyNotice(null);
    try {
      const url = await uploadCompanyLogo(file);
      setCompanyProfile((prev) => ({ ...prev, logoUrl: url }));
      setCompanyNotice({
        type: "success",
        text: "Logo uploaded successfully.",
      });
    } catch (error) {
      setCompanyNotice({
        type: "error",
        text: error instanceof Error ? error.message : "Logo upload failed.",
      });
    } finally {
      setCompanySaving(false);
    }
  };

  const refreshPanels = async () => {
    await loadPanels();
  };

  const removePanel = (panelId: string) => {
    setPanels((prev) =>
      prev.filter((panel) => panel._id !== panelId && panel.id !== panelId),
    );
  };

  const filteredPanels = useMemo(() => {
    if (!panelSearch) return panels;

    return panels.filter((panel) => {
      const name = panel.panelName || panel.name || "";
      const id = panel.panelId || panel.id || "";
      const customer = panel.customer || "";
      return (
        name.toLowerCase().includes(panelSearch.toLowerCase()) ||
        id.toLowerCase().includes(panelSearch.toLowerCase()) ||
        customer.toLowerCase().includes(panelSearch.toLowerCase())
      );
    });
  }, [panelSearch, panels]);

  return {
    panels,
    companyProfile,
    setCompanyProfile,
    companySaving,
    companyNotice,
    panelSearch,
    setPanelSearch,
    filteredPanels,
    saveCompany,
    uploadLogo,
    refreshPanels,
    removePanel,
  };
}

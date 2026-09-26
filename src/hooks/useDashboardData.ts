import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import type { Panel } from "../context/AppContext";
import {
  fetchCompanyProfile,
  fetchPanels,
  saveCompanyProfile,
  uploadCompanyLogo,
} from "../services/panelService";

export interface PanelInstallNotification {
  id: string;
  panelName: string;
  createdAt: Date;
  isRead: boolean;
}

export function useDashboardData() {
  const { currentUser } = useApp();
  const [panels, setPanels] = useState<Panel[]>([]);
  const notificationStorageKey = currentUser?.id
    ? `epms_install_notifications_${currentUser.id}`
    : null;
  const [installNotifications, setInstallNotifications] = useState<
    PanelInstallNotification[]
  >(() => {
    if (typeof window === "undefined" || !currentUser?.id) return [];
    try {
      const stored = JSON.parse(
        window.localStorage.getItem(
          `epms_install_notifications_${currentUser.id}`,
        ) || "[]",
      );
      if (!Array.isArray(stored)) return [];
      return stored.flatMap((item) => {
        const createdAt = new Date(item.createdAt);
        if (
          typeof item.id !== "string" ||
          typeof item.panelName !== "string" ||
          Number.isNaN(createdAt.getTime())
        ) {
          return [];
        }
        return [{
          id: item.id,
          panelName: item.panelName,
          createdAt,
          isRead: item.isRead === true,
        }];
      });
    } catch {
      return [];
    }
  });
  const previousPanelStatuses = useRef<Map<string, Panel["status"]> | null>(null);
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
      const previousStatuses = previousPanelStatuses.current;
      if (previousStatuses) {
        const transitions = nextPanels.flatMap((panel) => {
          const panelKey = panel.id || panel.panelId || panel._id;
          if (!panelKey || previousStatuses.get(panelKey) !== "Ready" || panel.status !== "Installed") {
            return [];
          }
          return [{
            id: `${panelKey}-${Date.now()}`,
            panelName: panel.panelName || panel.name || panel.panelId || "Panel",
            createdAt: new Date(),
            isRead: false,
          }];
        });
        if (transitions.length > 0) {
          setInstallNotifications((current) => [...transitions, ...current]);
        }
      }
      previousPanelStatuses.current = new Map(
        nextPanels.flatMap((panel) => {
          const panelKey = panel.id || panel.panelId || panel._id;
          return panelKey ? [[panelKey, panel.status] as const] : [];
        }),
      );
      setPanels(nextPanels);
    } catch {
      setPanels([]);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

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
    const pollPanels = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadPanels();
    }, 20_000);

    return () => window.clearInterval(pollPanels);
  }, [currentUser?.id]);

  useEffect(() => {
    if (!notificationStorageKey) return;
    try {
      window.localStorage.setItem(
        notificationStorageKey,
        JSON.stringify(installNotifications),
      );
    } catch (error) {
      console.warn("Unable to persist panel notifications.", error);
    }
  }, [installNotifications, notificationStorageKey]);

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

  const clearInstallNotifications = () => setInstallNotifications([]);
  const markInstallNotificationsRead = useCallback((notificationIds: string[]) => {
    const ids = new Set(notificationIds);
    setInstallNotifications((current) =>
      current.map((notification) =>
        ids.has(notification.id) ? { ...notification, isRead: true } : notification,
      ),
    );
  }, []);

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
    installNotifications,
    clearInstallNotifications,
    markInstallNotificationsRead,
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

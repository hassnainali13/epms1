import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import api, { getAuthErrorMessage } from "../lib/api";

export type Plan = "FREE" | "PREMIUM";

export interface PanelTechnicalSpecs {
  voltage?: string;
  current?: string;
  frequency?: string;
  phase?: string;
  powerRating?: string;
  powerFactor?: string;
  tpBreaker?: string;
  spBreaker?: string;
  mccb?: string;
  mcb?: string;
  fuseRating?: string;
  plc?: string;
  hmi?: string;
  relay?: string;
  contactor?: string;
  vfd?: string;
  softStarter?: string;
  timer?: string;
  overloadRelay?: string;
  digitalMeter?: string;
  cableDuct?: string;
  terminalBlock?: string;
  autoManualSelectorSwitch?: string;
  smps?: string;
  controlTransformer?: string;
  startPushButton?: string;
  stopPushButton?: string;
  emergencyStop?: string;
  selectorSwitch?: string;
  indicatorLamps?: string;
  busbarRating?: string;
  busbarMaterial?: string;
  cableSize?: string;
  controlCableSize?: string;
  overCurrentProtection?: boolean;
  shortCircuitProtection?: boolean;
  earthFaultProtection?: boolean;
  phaseFailureProtection?: boolean;
  overVoltageProtection?: boolean;
  underVoltageProtection?: boolean;
  dryRunProtection?: boolean;
  overloadProtection?: boolean;
  controlVoltage?: string;
  protectionType?: string;
  ipRating?: string;
  enclosureMaterial?: string;
  panelColor?: string;
  dimensions?: string;
  weight?: string;
  mountingType?: string;
  drawingNumber?: string;
  revision?: string;
  instrumentQuantities?: Record<string, string>;
}

export interface PanelImages {
  frontImage?: string;
  insideImage?: string;
  namePlateImage?: string;
  sideImage?: string;
}

export interface PanelDiagram {
  name?: string;
  url?: string;
  publicId?: string;
  fileType?: string;
}

export interface PanelDocuments {
  specificationPdf?: string;
  testReport?: string;
  autoCadDrawing?: string;
  additionalDocuments?: Array<
    | string
    | {
        url?: string;
        name?: string;
        fileUrl?: string;
        type?: string;
        size?: string;
        uploadedAt?: string;
        category?: string;
      }
  >;
}

export interface PanelMaintenance {
  installationEngineer?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  maintenanceInterval?: string;
  notes?: string;
  faultHistory?: string;
  engineer?: string;
  remarks?: string;
}

export interface Panel {
  _id?: string;
  id?: string;
  panelId?: string;
  name?: string;
  panelName?: string;
  type?: string;
  panelType?: string;
  manufacturer?: string;
  installer?: string;
  installationDate?: string;
  customer?: string;
  installationLocation?: string;
  projectName?: string;
  description?: string;
  companyName?: string;
  createdByName?: string;
  qrUrl?: string;
  status:
    | "Draft"
    | "Installed"
    | "Pending"
    | "In Production"
    | "QC Review"
    | "Maintenance Due";
  createdAt?: string;
  qrGenerated?: boolean;
  technicalSpecs?: PanelTechnicalSpecs;
  images?: PanelImages;
  diagrams?: PanelDiagram[];
  instrumentModels?: Record<string, string[]>;
  documents?: PanelDocuments;
  maintenance?: PanelMaintenance;
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  plan: Plan;
  blocked: boolean;
  joinedAt: string;
  panels: Panel[];
  monthlySpend: number;
  role?: string;
  company?: string;
  companyName?: string;
  companyLogoUrl?: string;
}

export interface AppState {
  currentUser: User | null;
  isAdmin: boolean;
  view: "login" | "dashboard" | "admin";
  users: User[];
  subscriptionPrice: number;
  loginUser: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  loginAdmin: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  registerUser: (
    name: string,
    email: string,
    password: string,
    companyName?: string,
    companyLogoUrl?: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  upgradePlan: (userId: string) => Promise<void>;
  downgradePlan: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  addPanel: (
    panel: Omit<Panel, "id" | "createdAt" | "qrGenerated">,
  ) => Promise<{ ok: boolean; error?: string }>;
  setSubscriptionPrice: (price: number) => Promise<void>;
  activatePremium: (userId: string) => Promise<void>;
  deactivatePremium: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppState["view"]>("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptionPrice, setSubscriptionPriceState] = useState(49);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("epms_token");
    if (!token) {
      setIsAuthReady(true);
      return;
    }
    api
      .get("/auth/me")
      .then(async (res) => {
        const user = res.data.user;
        const mappedUser: User = {
          id: user._id || user.id,
          ...user,
          name: user.name,
          email: user.email,
          plan: user.plan || "FREE",
          blocked: Boolean(user.blocked),
          joinedAt: user.createdAt
            ? new Date(user.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          panels: [],
          monthlySpend: 0,
        };
        setCurrentUser(mappedUser);
        setView(user.role === "super_admin" ? "admin" : "dashboard");
        setIsAdmin(user.role === "super_admin");
        if (user.role !== "super_admin") {
          const panelsRes = await api.get("/panels");
          const panels = (panelsRes.data.panels || []).map((panel: any) => ({
            ...panel,
            id: panel.panelId || panel._id,
            panelName: panel.panelName || panel.name,
            panelType: panel.panelType || panel.type,
            installationLocation: panel.installationLocation || panel.location,
            customer: panel.customer,
            status: panel.status,
            createdAt: panel.createdAt
              ? new Date(panel.createdAt).toISOString().split("T")[0]
              : "",
            qrGenerated: Boolean(panel.qrGenerated),
          }));
          setCurrentUser((prev) => (prev ? { ...prev, panels } : prev));
        }
      })
      .catch((error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          localStorage.removeItem("epms_token");
          localStorage.removeItem("epms_refresh_token");
        }
      })
      .finally(() => {
        setIsAuthReady(true);
      });
  }, []);

  async function loginUser(email: string, password: string) {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      if (user.role === "super_admin") {
        return {
          ok: false,
          error: "Administrator credentials are not allowed on this page.",
        };
      }
      localStorage.setItem("epms_token", token);
      const mappedUser: User = {
        id: user._id || user.id,
        ...user,
        name: user.name,
        email: user.email,
        plan: user.plan || "FREE",
        blocked: Boolean(user.blocked),
        joinedAt: user.createdAt
          ? new Date(user.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        panels: [],
        monthlySpend: 0,
      };
      setCurrentUser(mappedUser);
      setUsers([]);
      setIsAdmin(false);
      setView("dashboard");
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", "/dashboard");
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getAuthErrorMessage(error) };
    }
  }

  async function loginAdmin(email: string, password: string) {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data;
      if (user.role !== "super_admin") {
        return {
          ok: false,
          error: "Only system administrators may log in here.",
        };
      }
      localStorage.setItem("epms_token", token);
      const mappedUser: User = {
        id: user._id || user.id,
        ...user,
        name: user.name,
        email: user.email,
        plan: user.plan || "FREE",
        blocked: Boolean(user.blocked),
        joinedAt: user.createdAt
          ? new Date(user.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        panels: [],
        monthlySpend: 0,
      };
      setCurrentUser(mappedUser);
      setIsAdmin(true);
      setView("admin");
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", "/admin");
      }
      try {
        const overview = await api.get("/admin/overview");
        const nextUsers = (overview.data.users || []).map((entry: any) => ({
          id: entry._id || entry.id,
          ...entry,
          name: entry.name,
          email: entry.email,
          plan: entry.plan || "FREE",
          blocked: Boolean(entry.blocked),
          joinedAt: entry.createdAt
            ? new Date(entry.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          panels: [],
          monthlySpend: 0,
        }));
        setUsers(nextUsers);
        setSubscriptionPriceState(overview.data.subscriptionPrice || 49);
      } catch {
        setUsers([]);
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getAuthErrorMessage(error) };
    }
  }

  function logout() {
    localStorage.removeItem("epms_token");
    localStorage.removeItem("epms_refresh_token");
    setCurrentUser(null);
    setIsAdmin(false);
    setView("login");
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
    }
  }

  async function registerUser(
    name: string,
    email: string,
    password: string,
    companyName?: string,
    companyLogoUrl?: string,
  ) {
    try {
      const response = await api.post("/auth/signup", {
        name,
        email,
        password,
        companyName,
        companyLogoUrl,
      });
      const { token, user } = response.data;
      localStorage.setItem("epms_token", token);
      const mappedUser: User = {
        id: user.id || user._id,
        ...user,
        name: user.name,
        email: user.email,
        plan: user.plan || "FREE",
        blocked: Boolean(user.blocked),
        joinedAt: user.createdAt
          ? new Date(user.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        panels: [],
        monthlySpend: 0,
      };
      setCurrentUser(mappedUser);
      setIsAdmin(false);
      setView("dashboard");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getAuthErrorMessage(error) };
    }
  }

  async function upgradePlan(userId: string) {
    try {
      await api.patch(`/admin/users/${userId}`, { plan: "PREMIUM" });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, plan: "PREMIUM", monthlySpend: subscriptionPrice }
            : u,
        ),
      );
    } catch {
      // ignore failure; state remains stale until refresh
    }
  }

  async function downgradePlan(userId: string) {
    try {
      await api.patch(`/admin/users/${userId}`, { plan: "FREE" });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, plan: "FREE", monthlySpend: 0 } : u,
        ),
      );
    } catch {
      // ignore failure
    }
  }

  async function blockUser(userId: string) {
    try {
      await api.patch(`/admin/users/${userId}`, { blocked: true });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, blocked: true } : u)),
      );
    } catch {
      // ignore failure
    }
  }

  async function unblockUser(userId: string) {
    try {
      await api.patch(`/admin/users/${userId}`, { blocked: false });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, blocked: false } : u)),
      );
    } catch {
      // ignore failure
    }
  }

  async function addPanel(
    panel: Omit<Panel, "id" | "createdAt" | "qrGenerated">,
  ) {
    if (!currentUser) return { ok: false, error: "Not authenticated." };
    try {
      const response = await api.post("/panels", {
        panelName: panel.panelName || panel.name,
        panelType: panel.panelType || panel.type,
        installationLocation: panel.installationLocation,
        customer: panel.customer,
        status: panel.status,
      });
      const created = response.data.panel;
      const mappedPanel: Panel = {
        ...created,
        id: created.panelId || created._id,
        name: created.panelName,
        type: created.panelType,
        location: created.installationLocation,
        customer: created.customer,
        status: created.status,
        createdAt: created.createdAt
          ? new Date(created.createdAt).toISOString().split("T")[0]
          : undefined,
        qrGenerated: Boolean(created.qrGenerated),
      };
      setCurrentUser((prev) =>
        prev
          ? { ...prev, panels: [mappedPanel, ...(prev.panels || [])] }
          : prev,
      );
      return { ok: true };
    } catch (error) {
      return { ok: false, error: getAuthErrorMessage(error) };
    }
  }

  async function setSubscriptionPrice(price: number) {
    setSubscriptionPriceState(price);
    try {
      await api.patch("/admin/subscription-price", {
        subscriptionPrice: price,
      });
    } catch {
      // ignore
    }
  }

  const value = useMemo(
    () => ({
      currentUser,
      isAdmin,
      view,
      users,
      subscriptionPrice,
      loginUser,
      loginAdmin,
      logout,
      registerUser,
      upgradePlan,
      downgradePlan,
      activatePremium: upgradePlan,
      deactivatePremium: downgradePlan,
      blockUser,
      unblockUser,
      addPanel,
      setSubscriptionPrice,
      isAuthReady,
    }),
    [currentUser, isAdmin, view, users, subscriptionPrice, isAuthReady],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

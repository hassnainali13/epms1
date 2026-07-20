import { useEffect, useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import LoginPage from "./components/LoginPage";
import EPMSDashboard from "./components/EPMSDashboard";
import AdminDashboard from "./components/AdminDashboard";
import PanelQrPage from "./components/PanelQrPage";
import PanelWizard from "./components/PanelWizard";
import PanelCreatedSuccess from "./components/PanelCreatedSuccess";
import PanelDetails from "./components/PanelDetails";

function AppRouter() {
  const { view, currentUser, isAuthReady } = useApp();
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handleRouteChange = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleRouteChange);
    window.addEventListener("locationchange", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      window.removeEventListener("locationchange", handleRouteChange);
    };
  }, []);

  const normalizedPath = path.replace(/\/+$/, "") || "/";

  if (!isAuthReady) {
    return null;
  }

  if (normalizedPath.startsWith("/panel/")) {
    const panelId = normalizedPath.replace("/panel/", "").replace(/\/$/, "");
    return <PanelQrPage panelId={panelId} />;
  }

  if (normalizedPath.startsWith("/panels/edit/")) {
    const panelId = normalizedPath
      .replace("/panels/edit/", "")
      .replace(/\/$/, "");
    return <PanelWizard mode="edit" panelId={panelId} />;
  }

  if (normalizedPath === "/panels/create") {
    return <PanelWizard />;
  }

  if (normalizedPath.startsWith("/panels/success/")) {
    return <PanelCreatedSuccess />;
  }

  if (normalizedPath.startsWith("/panels/")) {
    const panelId = normalizedPath.replace("/panels/", "").replace(/\/$/, "");
    if (panelId && panelId !== "create" && panelId !== "success") {
      return <PanelDetails panelId={panelId} />;
    }
  }

  if (
    (normalizedPath === "/instrument-master" ||
      normalizedPath === "/instruments" ||
      normalizedPath.startsWith("/instruments/")) &&
    currentUser?.role === "company_admin"
  ) {
    return <EPMSDashboard />;
  }

  if (currentUser) {
    return currentUser.role === "super_admin" ? (
      <AdminDashboard />
    ) : (
      <EPMSDashboard />
    );
  }

  if (normalizedPath === "/admin-login") {
    return <LoginPage initialMode="admin" />;
  }

  if (view === "dashboard") return <EPMSDashboard />;
  if (view === "admin") return <AdminDashboard />;
  return <LoginPage initialMode="login" showAdminLink />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

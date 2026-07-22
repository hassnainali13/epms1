import { useEffect, useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import LoginPage from "./components/LoginPage";
import EPMSDashboard from "./components/EPMSDashboard";
import AdminDashboard from "./components/AdminDashboard";
import PanelQrPage from "./components/PanelQrPage";
import PanelWizard from "./components/PanelWizard";
import PanelCreatedSuccess from "./components/PanelCreatedSuccess";
import PanelDetails from "./components/PanelDetails";
import AppLoader from "./components/AppLoader";

function AppRouter() {
  const { view, currentUser, isAuthReady, appLoading } = useApp();
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    document.body.style.overflow = appLoading ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [appLoading]);

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
    return <AppLoader visible={true} />;
  }

  let content;

  if (normalizedPath.startsWith("/panel/")) {
    const panelId = normalizedPath.replace("/panel/", "").replace(/\/$/, "");
    content = <PanelQrPage panelId={panelId} />;
  } else if (normalizedPath.startsWith("/panels/edit/")) {
    const panelId = normalizedPath
      .replace("/panels/edit/", "")
      .replace(/\/$/, "");
    content = <PanelWizard mode="edit" panelId={panelId} />;
  } else if (normalizedPath === "/panels/create") {
    content = <PanelWizard />;
  } else if (normalizedPath.startsWith("/panels/success/")) {
    content = <PanelCreatedSuccess />;
  } else if (normalizedPath.startsWith("/panels/")) {
    const panelId = normalizedPath.replace("/panels/", "").replace(/\/$/, "");
    if (panelId && panelId !== "create" && panelId !== "success") {
      content = <PanelDetails panelId={panelId} />;
    }
  } else if (
    (normalizedPath === "/instrument-master" ||
      normalizedPath === "/instruments" ||
      normalizedPath.startsWith("/instruments/")) &&
    currentUser?.role === "company_admin"
  ) {
    content = <EPMSDashboard />;
  } else if (currentUser) {
    content =
      currentUser.role === "super_admin" ? (
        <AdminDashboard />
      ) : (
        <EPMSDashboard />
      );
  } else if (normalizedPath === "/admin-login") {
    content = <LoginPage initialMode="admin" />;
  } else if (view === "dashboard") {
    content = <EPMSDashboard />;
  } else if (view === "admin") {
    content = <AdminDashboard />;
  } else {
    content = <LoginPage initialMode="login" showAdminLink />;
  }

  return (
    <>
      <AppLoader visible={appLoading} />
      {content}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}

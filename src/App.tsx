import { lazy, Suspense, useEffect, useState } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import AppLoader from "./components/AppLoader";

const LoginPage = lazy(() => import("./components/LoginPage"));
const EPMSDashboard = lazy(() => import("./components/EPMSDashboard"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const PanelQrPage = lazy(() => import("./components/PanelQrPage"));
const PanelWizard = lazy(() => import("./components/PanelWizard"));
const PanelCreatedSuccess = lazy(
  () => import("./components/PanelCreatedSuccess"),
);
const PanelDetails = lazy(() => import("./components/PanelDetails"));
const QRCodeTemplatesPage = lazy(
  () => import("./components/QRCodeTemplatesPage"),
);

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
  const publicPanelRoute = normalizedPath.match(/^\/(\d{12})\/([^/]+)$/);

  if (!isAuthReady) {
    return <AppLoader visible={true} />;
  }

  let content;

  if (publicPanelRoute) {
    content = (
      <PanelDetails
        panelId={decodeURIComponent(publicPanelRoute[2])}
        publicAccessCode={publicPanelRoute[1]}
      />
    );
  } else if (normalizedPath.startsWith("/panel/")) {
    const panelId = normalizedPath.replace("/panel/", "").replace(/\/$/, "");
    content = <PanelQrPage panelId={panelId} />;
  } else if (normalizedPath === "/qr-code-templates") {
    content = <QRCodeTemplatesPage />;
  } else if (normalizedPath.startsWith("/panels/edit/")) {
    const panelId = normalizedPath
      .replace("/panels/edit/", "")
      .replace(/\/$/, "");
    content = <PanelWizard mode="edit" panelId={panelId} />;
  } else if (normalizedPath.startsWith("/panels/duplicate/")) {
    const panelId = normalizedPath
      .replace("/panels/duplicate/", "")
      .replace(/\/$/, "");
    content = <PanelWizard mode="duplicate" panelId={panelId} />;
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
      <Suspense fallback={<AppLoader visible={true} />}>
        {content}
      </Suspense>
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

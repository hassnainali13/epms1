import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Zap,
  Building2,
  Users,
  UserCheck,
  Wrench,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
  Trash2,
  Edit3,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  Lock,
  Crown,
  AlertTriangle,
  Upload,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import PanelQRCode from "./PanelQRCode";
import UpgradeModal from "./UpgradeModal";
import InstallerCodeSettings from "./InstallerCodeSettings";
import { SearchPanelModal } from "./dashboard/SearchPanelModal";
import { StatusBadge } from "./dashboard/StatusBadge";
import { useDashboardData } from "../hooks/useDashboardData";
import { deletePanel } from "../services/panelService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import InstrumentMaster from "./InstrumentMaster";
import DiagramLibrary from "./DiagramLibrary";
import epmsLogo from "../assets/epms_logo.svg";

// ─── Nav config ──────────────────────────────────────────────────────────────

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Zap, label: "Panels", id: "panels" },
  { icon: Building2, label: "Company", id: "company" },
  { icon: Users, label: "Employees", id: "employees" },
  { icon: UserCheck, label: "Customers", id: "customers" },
  { icon: MapPin, label: "Installations", id: "installations" },
  { icon: QrCode, label: "QR Code Templates", id: "qr-templates" },
  { icon: QrCode, label: "QR Codes", id: "qrcodes" },
  { icon: FileText, label: "Diagrams", id: "diagrams" },
  { icon: BarChart3, label: "Reports", id: "reports" },
  { icon: Wrench, label: "Maintenance", id: "maintenance" },
].filter((item) => item.id !== "instrument-master");

// ─── Premium feature lock hint ─────────────────────────────────────────────────

function PremiumBadge({
  label,
  onUpgrade,
}: {
  label: string;
  onUpgrade: () => void;
}) {
  return (
    <button
      onClick={onUpgrade}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0369A1] bg-[#E0F2FE] border border-[#BAE6FD] rounded-lg hover:bg-[#BAE6FD] transition-colors"
    >
      <Crown size={11} className="text-[#0EA5E9]" />
      {label}
      <Lock size={10} className="ml-0.5 text-[#0EA5E9]" />
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function EPMSDashboard() {
  const { currentUser, logout } = useApp();
  const {
    panels,
    installNotifications,
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
    removePanel,
  } = useDashboardData();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [selectedDeletePanel, setSelectedDeletePanel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const canEditInstallerCode =
    currentUser?.role === "company_admin" ||
    currentUser?.role === "super_admin";
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth >= 768,
  );
  useEffect(() => {
    const syncSidebarWithViewport = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", syncSidebarWithViewport);
    return () => window.removeEventListener("resize", syncSidebarWithViewport);
  }, []);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState<"new" | "read">("new");
  const notificationListRef = useRef<HTMLUListElement>(null);
  const [selectedMonthKey, setSelectedMonthKey] = useState(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
  });
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | undefined>();
  const [showSearch, setShowSearch] = useState(false);
  const [showDuplicatePicker, setShowDuplicatePicker] = useState(false);
  const [qrPanelId, setQrPanelId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{
    src: string;
    name: string;
  } | null>(null);
  const showDashboardOverview = activeNav === "dashboard";
  const showPanelsTable = activeNav === "dashboard" || activeNav === "panels";
  const showDedicatedPageOnly =
    activeNav === "diagrams" || activeNav === "employees";

  const markVisibleNewNotificationsRead = useCallback(() => {
    if (!notificationsOpen || notificationTab !== "new") return;
    const list = notificationListRef.current;
    if (!list) return;
    const listBounds = list.getBoundingClientRect();
    const viewedIds = Array.from(
      list.querySelectorAll<HTMLElement>("[data-notification-id]"),
    ).flatMap((item) => {
      const bounds = item.getBoundingClientRect();
      const visibleHeight = Math.max(
        0,
        Math.min(bounds.bottom, listBounds.bottom) -
          Math.max(bounds.top, listBounds.top),
      );
      const id = item.dataset.notificationId;
      return id && visibleHeight / bounds.height >= 0.75 ? [id] : [];
    });
    if (viewedIds.length > 0) markInstallNotificationsRead(viewedIds);
  }, [markInstallNotificationsRead, notificationTab, notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen || notificationTab !== "new") return;
    const frameId = window.requestAnimationFrame(
      markVisibleNewNotificationsRead,
    );
    return () => window.cancelAnimationFrame(frameId);
  }, [markVisibleNewNotificationsRead, notificationTab, notificationsOpen]);

  function triggerUpgrade(reason?: string) {
    setUpgradeReason(reason);
    setShowUpgrade(true);
  }

  const saveCompanyProfile = saveCompany;
  const handleCompanyLogoUpload = uploadLogo;

  if (!currentUser) return null;
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getFullYear() * 12 + currentDate.getMonth();
  const panelHistoryDates = panels.flatMap((panel) => {
    if (
      !panel.createdAt ||
      (panel.status !== "Ready" && panel.status !== "Installed")
    ) {
      return [];
    }
    const createdDate = new Date(panel.createdAt);
    return !Number.isNaN(createdDate.getTime()) && createdDate <= currentDate
      ? [createdDate]
      : [];
  });
  const earliestMonthIndex = panelHistoryDates.reduce(
    (earliest, date) =>
      Math.min(earliest, date.getFullYear() * 12 + date.getMonth()),
    currentMonthIndex,
  );
  const historyMonths = Array.from(
    { length: currentMonthIndex - earliestMonthIndex + 1 },
    (_, index) => {
      const monthIndex = currentMonthIndex - index;
      const date = new Date(Math.floor(monthIndex / 12), monthIndex % 12, 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`,
        label: date.toLocaleString(undefined, { month: "short", year: "numeric" }),
      };
    },
  );
  const [selectedYear, selectedMonthNumber] = selectedMonthKey
    .split("-")
    .map(Number);
  const selectedMonth = new Date(selectedYear, selectedMonthNumber, 1);
  const panelsInSelectedMonth = panels.filter((panel) => {
    if (
      !panel.createdAt ||
      (panel.status !== "Ready" && panel.status !== "Installed")
    ) {
      return false;
    }
    const createdDate = new Date(panel.createdAt);
    return (
      !Number.isNaN(createdDate.getTime()) &&
      createdDate.getFullYear() === selectedMonth.getFullYear() &&
      createdDate.getMonth() === selectedMonth.getMonth()
    );
  }).length;
  const installed = panels.filter((p) => p.status === "Installed").length;
  const ready = panels.filter((p) => p.status === "Ready").length;
  const isPremium = currentUser.plan === "PREMIUM";
  const isFree = currentUser.plan === "FREE";
  const unreadNotificationCount = installNotifications.filter(
    (notification) => !notification.isRead,
  ).length;
  const visibleNotifications = installNotifications.filter((notification) =>
    notificationTab === "new" ? !notification.isRead : notification.isRead,
  );
  const panelLimitReached = isFree && panels.length >= 3;
  const logoUrl = companyProfile.logoUrl || currentUser.companyLogoUrl || "";
  const companyName =
    companyProfile.name || currentUser.companyName || currentUser.name;

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-[Inter,sans-serif] overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 ${sidebarOpen ? "w-[200px] md:w-[264px]" : "w-12 md:w-[72px]"} h-screen flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col transition-[width] duration-300 ease-in-out ${sidebarOpen ? "z-50" : "z-30"}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center md:justify-start px-2 md:px-5 border-b border-[#E5E7EB] gap-2 md:gap-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#f5f6f6] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <Zap size={16} className="text-white" />
            )}
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[#0F172A] whitespace-nowrap">
                {companyName || "ElectraPanel"}
              </p>
              <p className="text-[10px] text-[#64748B] whitespace-nowrap">
                Management System
              </p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-2 md:px-3 space-y-0.5">
            {navItems
              .filter((item) => item.id !== "employees" || canEditInstallerCode)
              .map(({ icon: Icon, label, id }) => {
                const active = activeNav === id;
                const isLocked = isFree && id === "reports";
                return (
                  <button
                    key={id}
                    onClick={() => {
                      if (isLocked) {
                        triggerUpgrade(
                          "Premium Reports are not available on the Free plan.",
                        );
                        return;
                      }
                      if (id === "qr-templates") {
                        window.history.pushState({}, "", "/qr-code-templates");
                        window.dispatchEvent(new PopStateEvent("popstate"));
                        return;
                      }
                      setActiveNav(id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-center md:justify-start gap-2 md:gap-3 px-1 md:px-3 py-2 md:py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                      active
                        ? "bg-[#F0F9FF] text-[#0369A1]"
                        : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`h-4 w-4 md:h-[18px] md:w-[18px] flex-shrink-0 ${active ? "text-[#0EA5E9]" : "text-[#94A3B8] group-hover:text-[#64748B]"}`}
                    />
                    {sidebarOpen && (
                      <span className="whitespace-nowrap flex-1 text-left">
                        {label}
                      </span>
                    )}
                    {sidebarOpen && isLocked && (
                      <Lock size={11} className="text-[#CBD5E1]" />
                    )}
                    {active && sidebarOpen && !isLocked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                    )}
                  </button>
                );
              })}
          </div>
        </nav>

        {/* Plan pill in sidebar */}
        {sidebarOpen && (
          <div className="px-3 pb-2">
            {isPremium ? (
              <div className="flex items-center gap-2 bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] rounded-xl px-3 py-2.5">
                <Crown size={13} className="text-white flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Premium Plan</p>
                  <p className="text-[10px] text-white/70">Unlimited access</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => triggerUpgrade()}
                className="w-full flex items-center gap-2 bg-[#F0F9FF] border border-[#BAE6FD] rounded-xl px-3 py-2.5 hover:bg-[#E0F2FE] transition-colors"
              >
                <Zap size={13} className="text-[#0EA5E9] flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold text-[#0369A1]">Free Plan</p>
                  <p className="text-[10px] text-[#64748B]">
                    Upgrade to Premium →
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Bottom */}
        <div className="border-t border-[#E5E7EB] p-2 md:p-3 space-y-0.5">
          <button className="w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">
            <Settings size={18} className="h-4 w-4 md:h-[18px] md:w-[18px] flex-shrink-0 text-[#94A3B8]" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center md:justify-start gap-3 px-2 md:px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} className="h-4 w-4 md:h-[18px] md:w-[18px] flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>

          {sidebarOpen && (
            <div className="mt-2 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white text-xs font-bold">
                  {currentUser.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] truncate">
                    {currentUser.name}
                  </p>
                  <p className="text-[10px] text-[#64748B] truncate">
                    {currentUser.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div aria-hidden="true" className="w-12 flex-shrink-0 md:hidden" />

      <button
        type="button"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-label={sidebarOpen ? "Collapse navigation" : "Open navigation"}
        className={`absolute top-1/2 -translate-y-1/2 z-[55] flex h-7 w-3 md:h-9 md:w-5 items-center justify-center rounded-r-lg border border-l-0 border-[#E5E7EB] bg-white text-[#64748B] shadow-sm transition-[left] duration-300 ease-in-out ${sidebarOpen ? "left-[199px] md:left-[263px]" : "left-[47px] md:left-[71px]"}`}
      >
        {sidebarOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
      </button>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/35 md:hidden"
        />
      )}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Navbar ── */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-3 sm:px-6 gap-2 sm:gap-4 flex-shrink-0 z-20">
          <div className="flex items-center">
            <img
              src={epmsLogo}
              alt="EPMS"
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {/* Plan badge */}
            <span
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] sm:text-xs font-semibold ${
                isPremium
                  ? "border-sky-200 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <Crown size={13} className={isPremium ? "text-sky-600" : "text-slate-400"} />
              {isPremium ? "Premium Plan" : "Free Plan"}
            </span>

            <div className="relative ml-1">
              <button
                type="button"
                aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`}
                aria-expanded={notificationsOpen}
                onClick={() => {
                  if (notificationsOpen) {
                    setNotificationsOpen(false);
                    return;
                  }
                  setNotificationTab("new");
                  setNotificationsOpen(true);
                }}
                className="relative p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
              >
                <Bell size={18} />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(12rem,calc(100vw-5rem))] sm:w-80 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
                    <h2 className="text-xs sm:text-sm font-semibold text-[#0F172A]">Notifications</h2>
                  </div>
                  <div className="grid grid-cols-2 border-b border-[#E5E7EB]">
                    <button
                      type="button"
                      aria-pressed={notificationTab === "new"}
                      onClick={() => setNotificationTab("new")}
                      className={`px-2 py-2 text-[10px] sm:text-xs font-semibold ${notificationTab === "new" ? "border-b-2 border-[#0E7490] text-[#0E7490]" : "text-[#64748B]"}`}
                    >
                      New ({unreadNotificationCount})
                    </button>
                    <button
                      type="button"
                      aria-pressed={notificationTab === "read"}
                      onClick={() => setNotificationTab("read")}
                      className={`px-2 py-2 text-[10px] sm:text-xs font-semibold ${notificationTab === "read" ? "border-b-2 border-[#0E7490] text-[#0E7490]" : "text-[#64748B]"}`}
                    >
                      Read ({installNotifications.length - unreadNotificationCount})
                    </button>
                  </div>
                  {visibleNotifications.length === 0 ? (
                    <p className="px-3 py-5 text-center text-xs sm:px-4 sm:py-6 sm:text-sm text-[#64748B]">
                      {notificationTab === "new"
                        ? "You’re all caught up."
                        : "No read notifications yet."}
                    </p>
                  ) : (
                    <ul
                      ref={notificationListRef}
                      onWheel={() => {
                        window.requestAnimationFrame(
                          markVisibleNewNotificationsRead,
                        );
                      }}
                      onTouchMove={() => {
                        window.requestAnimationFrame(
                          markVisibleNewNotificationsRead,
                        );
                      }}
                      className="max-h-64 overflow-y-auto divide-y divide-[#F1F5F9]"
                    >
                      {visibleNotifications.map((notification) => (
                        <li
                          key={notification.id}
                          data-notification-id={notification.id}
                          className="min-h-16 px-3 py-2 sm:px-4 sm:py-3"
                        >
                          <p className="line-clamp-2 text-[11px] sm:text-sm text-[#0F172A]">
                            <span className="font-semibold">{notification.panelName}</span>
                            {" is now installed."}
                          </p>
                          <time className="mt-1 block text-[10px] sm:text-xs text-[#64748B]">
                            {notification.createdAt.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Page header */}
          {showDashboardOverview && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[#0F172A]">Dashboard</h1>
                <p className="text-sm text-[#64748B] mt-0.5">
                  Welcome back, {currentUser.name.split(" ")[0]}
                </p>
              </div>
            </div>
          )}

          {/* Free plan limit warning */}
          {!showDedicatedPageOnly && isFree && panels.length === 3 && (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  size={16}
                  className="text-amber-600 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-amber-800">
                    Panel limit reached
                  </p>
                  <p className="text-xs text-amber-700">
                    You've used all 3 panels on the Free plan. Upgrade for
                    unlimited panels.
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  triggerUpgrade(
                    "You've reached the 3-panel limit on the Free plan.",
                  )
                }
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors ml-4"
              >
                <Crown size={11} /> Upgrade
              </button>
            </div>
          )}

          {activeNav === "company" && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A]">
                    Company Profile
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Company name is required during signup. The logo can be
                    added now or later.
                  </p>
                </div>
              </div>

              {companyNotice && (
                <div
                  className={`mb-4 rounded-xl border px-3 py-2 text-sm ${companyNotice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}
                >
                  {companyNotice.text}
                </div>
              )}

              <form
                onSubmit={saveCompanyProfile}
                className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
              >
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
                      Company Name
                    </label>
                    <input
                      type="text"
                      required
                      value={companyProfile.name}
                      onChange={(e) =>
                        setCompanyProfile((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-3.5 py-2.5 text-sm border border-[#E5E7EB] rounded-xl bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={companySaving}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0EA5E9] rounded-xl hover:bg-[#0284C7] transition-colors disabled:opacity-70"
                  >
                    {companySaving ? "Saving..." : "Save Company Profile"}
                  </button>
                </div>

                <div className="rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-4">
                  <label className="text-xs font-semibold text-[#0F172A] block mb-2">
                    Company Logo
                  </label>
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-[#CBD5E1] bg-white p-4 min-h-[180px]">
                    {companyProfile.logoUrl ? (
                      <img
                        src={companyProfile.logoUrl}
                        alt="Company logo preview"
                        className="max-h-32 object-contain"
                      />
                    ) : (
                      <div className="text-center text-[#64748B]">
                        <Upload size={20} className="mx-auto mb-2" />
                        <p className="text-sm">No logo yet</p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCompanyLogoUpload}
                    className="mt-3 w-full text-sm text-[#64748B] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0EA5E9] file:px-3 file:py-2 file:text-white"
                  />
                </div>
              </form>
            </div>
          )}

          {activeNav === "diagrams" && <DiagramLibrary />}

          {activeNav === "employees" && canEditInstallerCode && (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A]">
                    Employees
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Manage employee and installer access.
                  </p>
                </div>
              </div>

              <InstallerCodeSettings
                installerAccessCode={companyProfile.installerAccessCode}
                onChange={(value) =>
                  setCompanyProfile((prev) => ({
                    ...prev,
                    installerAccessCode: value,
                  }))
                }
                onSubmit={saveCompanyProfile}
                saving={companySaving}
                notice={companyNotice}
              />
            </div>
          )}

          {currentUser.role === "super_admin" &&
            activeNav === "instrument-master" && <InstrumentMaster />}

          {!showDedicatedPageOnly &&
            !(
              currentUser.role === "super_admin" &&
              activeNav === "instrument-master"
            ) && (
              <div>
                {/* ── KPI Cards ── */}
                {activeNav === "dashboard" && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    {/* Total Panels */}
                    <div className="min-w-0 min-h-[120px] sm:min-h-0 bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-2.5 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-[#E0F2FE] flex items-center justify-center">
                          <Zap size={13} className="text-[#0284C7]" />
                        </div>
                        {isFree && (
                          <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                            {panels.length}/3
                          </span>
                        )}
                      </div>
                      <p className="text-2xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                        {panels.length}
                      </p>
                      <p className="text-xs font-medium text-[#0F172A] mt-0.5 leading-tight">
                        Total Panels
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-[#64748B] mt-0.5 leading-tight">
                        {isFree
                          ? `${3 - panels.length} slot${3 - panels.length !== 1 ? "s" : ""} remaining`
                          : "All time"}
                      </p>
                    </div>

                    {/* Installed */}
                    <div className="min-w-0 min-h-[120px] sm:min-h-0 bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-2.5 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-[#DCFCE7] flex items-center justify-center mb-2 sm:mb-3">
                        <CheckCircle2 size={13} className="text-[#16A34A]" />
                      </div>
                      <p className="text-2xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                        {installed}
                      </p>
                      <p className="text-xs font-medium text-[#0F172A] mt-0.5 leading-tight">
                        Installed Panels
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-[#64748B] mt-0.5 leading-tight">
                        Successfully deployed
                      </p>
                    </div>

                    {/* Ready */}
                    <div className="min-w-0 min-h-[120px] sm:min-h-0 bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-2.5 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-[#FEF3C7] flex items-center justify-center mb-2 sm:mb-3">
                        <Clock size={13} className="text-[#D97706]" />
                      </div>
                      <p className="text-2xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                        {ready}
                      </p>
                      <p className="text-xs font-medium text-[#0F172A] mt-0.5 leading-tight">
                        Ready Panels
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-[#64748B] mt-0.5 leading-tight">
                        Ready for installation
                      </p>
                    </div>

                    {/* Panels created this month */}
                    <div className="min-w-0 min-h-[120px] sm:min-h-0 bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-2.5 sm:p-5 hover:shadow-md transition-shadow">
                      <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-[#CCFBF1] flex items-center justify-center mb-2 sm:mb-3">
                        <CalendarDays size={13} className="text-[#0F766E]" />
                      </div>
                      <p className="text-2xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                        {panelsInSelectedMonth}
                      </p>
                      <label className="block text-xs font-medium text-[#0F172A] mt-0.5 leading-tight">
                        Panels in
                        <select
                          aria-label="Select month for panel history"
                          value={selectedMonthKey}
                          onChange={(event) => setSelectedMonthKey(event.target.value)}
                          className="mt-1 block w-full min-w-0 rounded-md border border-[#E5E7EB] bg-white px-1.5 py-1.5 text-[10px] sm:text-[11px] font-medium text-[#0E7490] focus:outline-none focus:ring-1 focus:ring-[#0E7490]"
                        >
                          {historyMonths.map((month) => (
                            <option key={month.key} value={month.key}>
                              {month.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p className="text-[10px] sm:text-[11px] text-[#64748B] mt-1 leading-tight">
                        Ready + Installed
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Quick Actions ── */}
                {showDashboardOverview && (
                  <div className="mt-3 sm:mt-4 bg-white rounded-xl sm:rounded-2xl border border-[#E5E7EB] p-3 sm:p-5">
                    <h2 className="text-sm font-bold text-[#0F172A] mb-3 sm:mb-4">
                      Quick Actions
                    </h2>
                    <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {/* Create Panel */}
                      <button
                        onClick={() => {
                          window.history.pushState({}, "", "/panels/create");
                          window.dispatchEvent(new PopStateEvent("popstate"));
                        }}
                        disabled={panelLimitReached}
                        className={`min-w-0 min-h-[76px] sm:min-h-[84px] flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-2 px-1 sm:py-4 sm:px-3 rounded-lg sm:rounded-xl border transition-all text-[10px] sm:text-sm font-medium text-center leading-tight ${
                          panelLimitReached
                            ? "border-[#E5E7EB] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed"
                            : "border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF] text-[#0F172A]"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-xl flex items-center justify-center ${panelLimitReached ? "bg-[#F1F5F9]" : "bg-[#E0F2FE]"}`}
                        >
                          <Plus
                            size={13}
                            className={
                              panelLimitReached
                                ? "text-[#CBD5E1]"
                                : "text-[#0284C7]"
                            }
                          />
                        </div>
                        <span>Create Panel</span>
                        {panelLimitReached && (
                          <span className="text-[9px] sm:text-[10px] text-amber-500 font-medium">
                            Limit reached
                          </span>
                        )}
                      </button>

                      {/* Duplicate Panel */}
                      <button
                        onClick={() => setShowDuplicatePicker(true)}
                        disabled={panels.length === 0 || panelLimitReached}
                        className={`min-w-0 min-h-[76px] sm:min-h-[84px] flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-2 px-1 sm:py-4 sm:px-3 rounded-lg sm:rounded-xl border transition-all text-[10px] sm:text-sm font-medium text-center leading-tight ${
                          panels.length === 0 || panelLimitReached
                            ? "border-[#E5E7EB] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed"
                            : "border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF] text-[#0F172A]"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-xl flex items-center justify-center ${panels.length === 0 || panelLimitReached ? "bg-[#F1F5F9]" : "bg-[#CCFBF1]"}`}
                        >
                          <FileText
                            size={13}
                            className={panels.length === 0 || panelLimitReached ? "text-[#CBD5E1]" : "text-[#0F766E]"}
                          />
                        </div>
                        <span>Duplicate Panel</span>
                      </button>

                      {/* Generate QR */}
                      <button
                        onClick={() => {
                          if (isFree && panels.length === 0) return;
                        }}
                        className="min-w-0 min-h-[76px] sm:min-h-[84px] flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-2 px-1 sm:py-4 sm:px-3 rounded-lg sm:rounded-xl border border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF] transition-all text-[10px] sm:text-sm font-medium text-center leading-tight text-[#0F172A]"
                      >
                        <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-md sm:rounded-xl bg-[#DCFCE7] flex items-center justify-center">
                          <QrCode size={13} className="text-[#16A34A]" />
                        </div>
                        <span>Generate QR</span>
                      </button>

                    </div>

                    {/* Premium feature hints for free users */}
                    {isFree && (
                      <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex flex-wrap gap-2">
                        <span className="text-xs text-[#94A3B8]">
                          Premium unlocks:
                        </span>
                        {[
                          "Upload Images",
                          "Wiring Diagrams",
                          "Spec PDFs",
                          "Company Branding",
                          "Premium Reports",
                        ].map((f) => (
                          <PremiumBadge
                            key={f}
                            label={f}
                            onUpgrade={() =>
                              triggerUpgrade(`${f} is a Premium feature.`)
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Recent Panels Table ── */}
                {showPanelsTable && (
                  <div className="mt-3 bg-[#F8FAFC] md:bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#E5E7EB]">
                      <div>
                        <h2 className="text-sm font-bold text-[#0F172A]">
                          Recent Panels
                        </h2>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {panels.length} panel{panels.length !== 1 ? "s" : ""}{" "}
                          in your account
                        </p>
                      </div>
                      <div className="relative">
                        <Search
                          size={13}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                        />
                        <input
                          type="text"
                          placeholder="Filter panels..."
                          value={panelSearch}
                          onChange={(e) => setPanelSearch(e.target.value)}
                          className="pl-8 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] w-full sm:w-44 transition-all"
                        />
                      </div>
                    </div>

                    {panels.length === 0 ? (
                      <div className="text-center py-16 px-6">
                        <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
                          <Zap size={22} className="text-[#CBD5E1]" />
                        </div>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          No panels yet
                        </p>
                        <p className="text-xs text-[#64748B] mt-1 mb-4">
                          Create your first panel to get started.
                        </p>
                        <button
                          onClick={() => {
                            window.history.pushState({}, "", "/panels/create");
                            window.dispatchEvent(new PopStateEvent("popstate"));
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0EA5E9] rounded-xl hover:bg-[#0284C7] transition-colors"
                        >
                          <Plus size={14} /> Create Panel
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Table header */}
                        <div className="hidden md:grid grid-cols-[minmax(220px,1fr)_100px_90px_80px_repeat(4,32px)] gap-3 px-4 lg:px-6 py-2.5 bg-[#F8FAFC] border-b border-[#E5E7EB] text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                          <span>Panel</span>
                          <span>Customer</span>
                          <span>Status</span>
                          <span>Created</span>
                          <span>Edit</span>
                          <span>QR</span>
                          <span>View</span>
                          <span />
                        </div>

                        {deleteSuccess && (
                          <div className="col-span-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {deleteSuccess}
                          </div>
                        )}
                        {deleteError && (
                          <div className="col-span-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {deleteError}
                          </div>
                        )}
                        {filteredPanels.length === 0 ? (
                          <p className="text-xs text-[#94A3B8] text-center py-8">
                            No panels match your filter.
                          </p>
                        ) : (
                          filteredPanels.map((panel) => (
                            <div
                              key={panel.id}
                              className="grid grid-cols-1 md:grid-cols-[minmax(220px,1fr)_100px_90px_80px_repeat(4,32px)] gap-3 md:px-4 lg:px-6 p-3 md:py-3.5 mb-2 md:mb-0 rounded-xl md:rounded-none bg-white border border-[#E5E7EB] md:border-0 md:border-b md:border-[#F1F5F9] shadow-[0_2px_8px_rgba(15,23,42,0.06)] md:shadow-none hover:bg-[#F8FAFC] transition-colors items-center md:items-center"
                            >
                              <div className="min-w-0 flex items-center gap-3">
                                {panel.images?.frontImage ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLightboxImage({
                                        src: panel.images?.frontImage || "",
                                        name: panel.panelName || panel.name || "Panel front image",
                                      })
                                    }
                                    className="group relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-[#DBEAFE] border-2 border-white shadow-[0_1px_5px_rgba(15,23,42,0.2)] ring-1 ring-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                                    title="Open front image"
                                  >
                                    <img
                                      src={panel.images.frontImage}
                                      alt="Panel front"
                                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                    />
                                    <span className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors" />
                                  </button>
                                ) : (
                                  <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] border-2 border-white shadow-[0_1px_5px_rgba(15,23,42,0.15)] ring-1 ring-[#CBD5E1] flex items-center justify-center">
                                    <span className="text-[10px] font-bold tracking-wide text-[#2563EB]">
                                      N/A
                                    </span>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-[#0F172A] truncate">
                                    {panel.panelName || panel.name}
                                  </p>
                                  <p className="text-[10px] font-mono text-[#94A3B8] mt-0.5">
                                    {panel.panelId || panel.id} ·{" "}
                                    {panel.installationLocation}
                                  </p>
                                  <p className="text-[10px] text-[#64748B] mt-1 truncate">
                                    Motors: {panel.motorConfiguration?.length || 0} · Size: {panel.technicalSpecs?.dimensions || "N/A"}
                                  </p>
                                  <div className="flex md:hidden items-center gap-2 mt-2 flex-wrap">
                                    <StatusBadge status={panel.status} size="sm" />
                                    <span className="text-[10px] text-[#64748B]">
                                      {panel.customer || "No customer"}
                                    </span>
                                    <span className="text-[10px] text-[#94A3B8]">
                                      {panel.createdAt || "—"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="hidden md:block text-xs text-[#64748B] truncate">
                                {panel.customer}
                              </p>
                              <div className="hidden md:block">
                                <StatusBadge status={panel.status} />
                              </div>
                              <p className="hidden md:block text-xs text-[#64748B]">
                                {panel.createdAt}
                              </p>
                              <div className="col-span-full flex items-center justify-end gap-1.5 border-t border-[#F1F5F9] pt-2 md:contents">
                              <button
                                onClick={() => {
                                  window.history.pushState(
                                    {},
                                    "",
                                    `/panels/edit/${panel.panelId || panel.id}`,
                                  );
                                  window.dispatchEvent(
                                    new PopStateEvent("popstate"),
                                  );
                                }}
                                className="p-2 md:p-1.5 rounded-lg text-[#64748B] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center"
                                title="Edit panel"
                              >
                                <Edit3 size={14} />
                              </button>
                              {!isFree ? (
                                <button
                                  onClick={() =>
                                    setQrPanelId(
                                      panel.panelId || panel.id || null,
                                    )
                                  }
                                  className="p-2 md:p-1.5 rounded-lg text-[#64748B] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center"
                                  title="View QR code"
                                >
                                  <QrCode size={14} />
                                </button>
                              ) : (
                                <div className="p-2 md:p-1.5" />
                              )}
                              <button
                                onClick={() => {
                                  if (isFree) {
                                    setQrPanelId(
                                      panel.panelId || panel.id || null,
                                    );
                                    return;
                                  }

                                  window.history.pushState(
                                    {},
                                    "",
                                    `/panels/${panel.panelId || panel.id}`,
                                  );
                                  window.dispatchEvent(
                                    new PopStateEvent("popstate"),
                                  );
                                }}
                                className="p-2 md:p-1.5 rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center"
                                title={
                                  isFree ? "View panel review" : "View panel"
                                }
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDeletePanel({
                                    id: panel._id || panel.id || "",
                                    name:
                                      panel.panelName ||
                                      panel.name ||
                                      panel.panelId ||
                                      "panel",
                                  });
                                  setDeleteError(null);
                                  setDeleteSuccess(null);
                                  setShowDeleteDialog(true);
                                }}
                                className="p-2 md:p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center"
                                title="Delete panel"
                              >
                                <Trash2 size={14} />
                              </button>
                              </div>
                            </div>
                          ))
                        )}

                        {/* Free plan add-more CTA */}
                        {showDeleteDialog && selectedDeletePanel && (
                          <Dialog
                            open={showDeleteDialog}
                            onOpenChange={setShowDeleteDialog}
                          >
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Panel?</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to permanently delete
                                  this panel? This action cannot be undone.
                                </DialogDescription>
                              </DialogHeader>

                              {deleteError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                  {deleteError}
                                </div>
                              )}

                              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E5E7EB]">
                                <p className="text-sm text-[#0F172A] font-semibold">
                                  {selectedDeletePanel.name}
                                </p>
                                <p className="text-xs text-[#64748B] mt-1">
                                  This panel will be removed permanently from
                                  your account.
                                </p>
                              </div>
                              <DialogFooter>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowDeleteDialog(false);
                                    setDeleteError(null);
                                  }}
                                  className="inline-flex h-10 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white px-4 text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC] transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!selectedDeletePanel?.id) return;
                                    setDeleting(true);
                                    setDeleteError(null);
                                    try {
                                      await deletePanel(selectedDeletePanel.id);
                                      removePanel(selectedDeletePanel.id);
                                      setDeleteSuccess(
                                        "Panel deleted successfully.",
                                      );
                                      setShowDeleteDialog(false);
                                    } catch (error) {
                                      setDeleteError(
                                        error instanceof Error
                                          ? error.message
                                          : "Unable to delete panel.",
                                      );
                                    } finally {
                                      setDeleting(false);
                                    }
                                  }}
                                  className="inline-flex h-10 items-center justify-center rounded-xl bg-red-500 px-4 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
                                >
                                  {deleting ? "Deleting..." : "Delete"}
                                </button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                        {qrPanelId && (
                          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                            <div className="relative w-full max-w-3xl max-h-[90vh] rounded-3xl bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden">
                              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
                                <div>
                                  <p className="text-sm font-bold text-[#0F172A]">
                                    Panel QR Code
                                  </p>
                                  <p className="text-xs text-[#64748B] mt-0.5">
                                    View the QR code without leaving the panel
                                    list.
                                  </p>
                                </div>
                                <button
                                  onClick={() => setQrPanelId(null)}
                                  className="p-2 rounded-xl text-[#64748B] hover:bg-[#F8FAFC] transition-colors"
                                  aria-label="Close QR code modal"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                                {filteredPanels.find(
                                  (item) =>
                                    item.panelId === qrPanelId ||
                                    item.id === qrPanelId,
                                ) ? (
                                  <PanelQRCode
                                    panel={filteredPanels.find(
                                      (item) =>
                                        item.panelId === qrPanelId ||
                                        item.id === qrPanelId,
                                    )}
                                    onBack={() => setQrPanelId(null)}
                                    isFree={isFree}
                                  />
                                ) : (
                                  <div className="rounded-3xl border border-[#E5E7EB] p-10 text-center text-sm text-[#64748B]">
                                    Panel data not available.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        {isFree && panels.length < 3 && (
                          <div className="px-6 py-3 border-t border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
                            <span className="text-xs text-[#64748B]">
                              {3 - panels.length} slot
                              {3 - panels.length !== 1 ? "s" : ""} remaining on
                              Free plan
                            </span>
                            <button
                              onClick={() => {
                                window.history.pushState(
                                  {},
                                  "",
                                  "/panels/create",
                                );
                                window.dispatchEvent(
                                  new PopStateEvent("popstate"),
                                );
                              }}
                              className="text-xs text-[#0EA5E9] font-medium hover:underline flex items-center gap-1"
                            >
                              <Plus size={11} /> Add panel
                            </button>
                          </div>
                        )}
                        {panelLimitReached && (
                          <div className="px-6 py-3 border-t border-[#F1F5F9] flex items-center justify-between">
                            <span className="text-xs text-amber-700">
                              Free plan limit reached (3/3 panels)
                            </span>
                            <button
                              onClick={() =>
                                triggerUpgrade(
                                  "Upgrade to create unlimited panels.",
                                )
                              }
                              className="text-xs text-[#0EA5E9] font-semibold hover:underline flex items-center gap-1"
                            >
                              <ArrowUpRight size={11} /> Upgrade for unlimited
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
        </main>
      </div>

      {/* ── Modals ── */}
      {showUpgrade && (
        <UpgradeModal
          trigger={upgradeReason}
          onClose={() => setShowUpgrade(false)}
        />
      )}
      {showSearch && (
        <SearchPanelModal
          onClose={() => setShowSearch(false)}
          panels={panels}
        />
      )}
      {showDuplicatePicker && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          onClick={() => setShowDuplicatePicker(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
              <div>
                <h2 className="text-base font-bold text-[#0F172A]">Select Panel to Duplicate</h2>
                <p className="text-xs text-[#64748B] mt-1">Images will not be copied to the new panel.</p>
              </div>
              <button
                onClick={() => setShowDuplicatePicker(false)}
                className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9]"
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
            <div className="p-3 overflow-y-auto max-h-[60vh] space-y-2">
              {panels.map((panel) => {
                const panelId = panel.panelId || panel.id;
                return (
                  <button
                    key={panelId}
                    disabled={!panelId}
                    onClick={() => {
                      if (!panelId) return;
                      window.history.pushState({}, "", `/panels/duplicate/${panelId}`);
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl border border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF] transition-colors"
                  >
                    <p className="text-sm font-semibold text-[#0F172A] truncate">
                      {panel.panelName || panel.name || "Unnamed panel"}
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      {panelId} {panel.customer ? `· ${panel.customer}` : ""}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center gap-3"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="w-full flex items-center justify-between px-1">
              <p className="text-sm font-semibold text-white truncate pr-4">
                {lightboxImage.name}
              </p>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="flex-shrink-0 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Close image"
              >
                <X size={18} />
              </button>
            </div>
            <img
              src={lightboxImage.src}
              alt={lightboxImage.name}
              className="max-w-full max-h-[calc(90vh-60px)] rounded-2xl object-contain shadow-2xl ring-1 ring-white/20"
            />
          </div>
        </div>
      )}
      {profileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import {
  LayoutDashboard,
  Zap,
  Building2,
  Users,
  UserCheck,
  Wrench,
  QrCode,
  Boxes,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  Eye,
  Edit3,
  ArrowUpRight,
  Menu,
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
import { SearchPanelModal } from "./dashboard/SearchPanelModal";
import { StatusBadge } from "./dashboard/StatusBadge";
import { useDashboardData } from "../hooks/useDashboardData";
import InstrumentMaster from "./InstrumentMaster";

// ─── Nav config ──────────────────────────────────────────────────────────────

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Zap, label: "Panels", id: "panels" },
  { icon: Building2, label: "Company", id: "company" },
  { icon: Users, label: "Employees", id: "employees" },
  { icon: UserCheck, label: "Customers", id: "customers" },
  { icon: MapPin, label: "Installations", id: "installations" },
  { icon: QrCode, label: "QR Codes", id: "qrcodes" },
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
    companyProfile,
    setCompanyProfile,
    companySaving,
    companyNotice,
    panelSearch,
    setPanelSearch,
    filteredPanels,
    saveCompany,
    uploadLogo,
  } = useDashboardData();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<string | undefined>();
  const [showSearch, setShowSearch] = useState(false);
  const [qrPanelId, setQrPanelId] = useState<string | null>(null);

  function triggerUpgrade(reason?: string) {
    setUpgradeReason(reason);
    setShowUpgrade(true);
  }

  const saveCompanyProfile = saveCompany;
  const handleCompanyLogoUpload = uploadLogo;

  if (!currentUser) return null;
  const installed = panels.filter((p) => p.status === "Installed").length;
  const pending = panels.filter(
    (p) =>
      p.status === "Pending" ||
      p.status === "In Production" ||
      p.status === "QC Review",
  ).length;
  const isPremium = currentUser.plan === "PREMIUM";
  const isFree = currentUser.plan === "FREE";
  const panelLimitReached = isFree && panels.length >= 3;
  const logoUrl = companyProfile.logoUrl || currentUser.companyLogoUrl || "";
  const companyName =
    companyProfile.name || currentUser.companyName || currentUser.name;

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-[Inter,sans-serif] overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`${sidebarOpen ? "w-[264px]" : "w-[72px]"} flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-200 ease-in-out z-30`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#E5E7EB] gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#f5f6f6] flex items-center justify-center flex-shrink-0 overflow-hidden">
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
          <div className="px-3 space-y-0.5">
            {navItems.map(({ icon: Icon, label, id }) => {
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
                    setActiveNav(id);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                    active
                      ? "bg-[#F0F9FF] text-[#0369A1]"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`flex-shrink-0 ${active ? "text-[#0EA5E9]" : "text-[#94A3B8] group-hover:text-[#64748B]"}`}
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
        <div className="border-t border-[#E5E7EB] p-3 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">
            <Settings size={18} className="flex-shrink-0 text-[#94A3B8]" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} className="flex-shrink-0" />
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

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Navbar ── */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-6 gap-4 flex-shrink-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
          >
            <Menu size={18} />
          </button>

          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-[#64748B]">EPMS</span>
            <span className="text-[#CBD5E1]">/</span>
            <span className="font-medium text-[#0F172A] capitalize">
              {activeNav}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {/* Plan badge */}
            <span
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                isPremium
                  ? "bg-[#0EA5E9] text-white"
                  : "bg-[#F1F5F9] text-[#64748B]"
              }`}
            >
              {isPremium ? (
                <>
                  <Crown size={10} /> PREMIUM
                </>
              ) : (
                "FREE"
              )}
            </span>

            <button className="relative p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors ml-1">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">Dashboard</h1>
              <p className="text-sm text-[#64748B] mt-0.5">
                Welcome back, {currentUser.name.split(" ")[0]}
              </p>
            </div>
            <button
              onClick={() => {
                window.history.pushState({}, "", "/panels/create");
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0EA5E9] rounded-xl hover:bg-[#0284C7] transition-colors shadow-sm"
            >
              <Plus size={14} />
              New Panel
            </button>
          </div>

          {/* Free plan limit warning */}
          {isFree && panels.length === 3 && (
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

          {currentUser.role === "super_admin" &&
            activeNav === "instrument-master" && <InstrumentMaster />}

          {!(
            currentUser.role === "super_admin" &&
            activeNav === "instrument-master"
          ) && (
            <div>
              {/* ── KPI Cards ── */}
              {activeNav !== "company" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Panels */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-[#0EA5E9] flex items-center justify-center">
                        <Zap size={16} className="text-white" />
                      </div>
                      {isFree && (
                        <span className="text-[10px] font-semibold text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">
                          {panels.length}/3
                        </span>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
                      {panels.length}
                    </p>
                    <p className="text-xs font-medium text-[#0F172A] mt-0.5">
                      Total Panels
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      {isFree
                        ? `${3 - panels.length} slot${3 - panels.length !== 1 ? "s" : ""} remaining`
                        : "All time"}
                    </p>
                  </div>

                  {/* Installed */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
                    <div className="w-9 h-9 rounded-xl bg-[#22C55E] flex items-center justify-center mb-3">
                      <CheckCircle2 size={16} className="text-white" />
                    </div>
                    <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
                      {installed}
                    </p>
                    <p className="text-xs font-medium text-[#0F172A] mt-0.5">
                      Installed Panels
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      Successfully deployed
                    </p>
                  </div>

                  {/* Pending */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
                    <div className="w-9 h-9 rounded-xl bg-[#F59E0B] flex items-center justify-center mb-3">
                      <Clock size={16} className="text-white" />
                    </div>
                    <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
                      {pending}
                    </p>
                    <p className="text-xs font-medium text-[#0F172A] mt-0.5">
                      Pending Panels
                    </p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">
                      In progress or awaiting install
                    </p>
                  </div>

                  {/* Subscription */}
                  <div
                    className={`rounded-2xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${
                      isPremium
                        ? "bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] border-[#0EA5E9]"
                        : "bg-white border-[#E5E7EB]"
                    }`}
                    onClick={() => isFree && triggerUpgrade()}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${isPremium ? "bg-white/20" : "bg-[#F1F5F9]"}`}
                    >
                      <Crown
                        size={16}
                        className={isPremium ? "text-white" : "text-[#64748B]"}
                      />
                    </div>
                    <p
                      className={`text-2xl font-bold tracking-tight ${isPremium ? "text-white" : "text-[#0F172A]"}`}
                    >
                      {isPremium ? "PREMIUM" : "FREE"}
                    </p>
                    <p
                      className={`text-xs font-medium mt-0.5 ${isPremium ? "text-white/90" : "text-[#0F172A]"}`}
                    >
                      Subscription Status
                    </p>
                    <p
                      className={`text-[11px] mt-0.5 ${isPremium ? "text-white/70" : "text-[#0EA5E9] font-medium"}`}
                    >
                      {isPremium ? "Unlimited access" : "Tap to upgrade →"}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Quick Actions ── */}
              {activeNav !== "company" && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                  <h2 className="text-sm font-bold text-[#0F172A] mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Create Panel */}
                    <button
                      onClick={() => {
                        window.history.pushState({}, "", "/panels/create");
                        window.dispatchEvent(new PopStateEvent("popstate"));
                      }}
                      disabled={panelLimitReached}
                      className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all text-sm font-medium ${
                        panelLimitReached
                          ? "border-[#E5E7EB] bg-[#F8FAFC] text-[#CBD5E1] cursor-not-allowed"
                          : "border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF] text-[#0F172A]"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${panelLimitReached ? "bg-[#F1F5F9]" : "bg-[#0EA5E9]"}`}
                      >
                        <Plus
                          size={17}
                          className={
                            panelLimitReached ? "text-[#CBD5E1]" : "text-white"
                          }
                        />
                      </div>
                      <span>Create Panel</span>
                      {panelLimitReached && (
                        <span className="text-[10px] text-amber-500 font-medium">
                          Limit reached
                        </span>
                      )}
                    </button>

                    {/* Search Panel */}
                    <button
                      onClick={() => setShowSearch(true)}
                      className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF] transition-all text-sm font-medium text-[#0F172A]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#8B5CF6] flex items-center justify-center">
                        <Search size={17} className="text-white" />
                      </div>
                      <span>Search Panel</span>
                    </button>

                    {/* Generate QR */}
                    <button
                      onClick={() => {
                        if (isFree && panels.length === 0) return;
                      }}
                      className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF] transition-all text-sm font-medium text-[#0F172A]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-[#22C55E] flex items-center justify-center">
                        <QrCode size={17} className="text-white" />
                      </div>
                      <span>Generate QR</span>
                    </button>

                    {/* Export PDF */}
                    <button
                      onClick={() => {
                        if (isFree) {
                          triggerUpgrade(
                            "Export PDF with company branding requires a Premium subscription.",
                          );
                        }
                      }}
                      className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-[#E5E7EB] hover:border-[#0EA5E9] hover:bg-[#F0F9FF] transition-all text-sm font-medium text-[#0F172A] relative"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${isPremium ? "bg-[#F59E0B]" : "bg-[#F1F5F9]"}`}
                      >
                        <FileText
                          size={17}
                          className={
                            isPremium ? "text-white" : "text-[#94A3B8]"
                          }
                        />
                      </div>
                      <span className={isPremium ? "" : "text-[#94A3B8]"}>
                        Export PDF
                      </span>
                      {isFree && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-[#0EA5E9] rounded-full flex items-center justify-center">
                          <Lock size={8} className="text-white" />
                        </span>
                      )}
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
              {activeNav !== "company" && (
                <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
                    <div>
                      <h2 className="text-sm font-bold text-[#0F172A]">
                        Recent Panels
                      </h2>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        {panels.length} panel{panels.length !== 1 ? "s" : ""} in
                        your account
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
                        className="pl-8 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] w-44 transition-all"
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
                      <div className="grid grid-cols-[1fr_120px_110px_90px_36px_36px_36px] gap-4 px-6 py-2.5 bg-[#F8FAFC] border-b border-[#E5E7EB] text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                        <span>Panel</span>
                        <span>Customer</span>
                        <span>Status</span>
                        <span>Created</span>
                        <span>Edit</span>
                        <span>QR</span>
                        <span />
                      </div>

                      {filteredPanels.length === 0 ? (
                        <p className="text-xs text-[#94A3B8] text-center py-8">
                          No panels match your filter.
                        </p>
                      ) : (
                        filteredPanels.map((panel) => (
                          <div
                            key={panel.id}
                            className="grid grid-cols-[1fr_120px_110px_90px_36px_36px_36px] gap-4 px-6 py-3.5 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors items-center"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[#0F172A] truncate">
                                {panel.panelName || panel.name}
                              </p>
                              <p className="text-[10px] font-mono text-[#94A3B8] mt-0.5">
                                {panel.panelId || panel.id} ·{" "}
                                {panel.installationLocation}
                              </p>
                            </div>
                            <p className="text-xs text-[#64748B] truncate">
                              {panel.customer}
                            </p>
                            <StatusBadge status={panel.status} />
                            <p className="text-xs text-[#64748B]">
                              {panel.createdAt}
                            </p>
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
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center"
                              title="Edit panel"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() =>
                                setQrPanelId(panel.panelId || panel.id || null)
                              }
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center"
                              title="View QR code"
                            >
                              <QrCode size={14} />
                            </button>
                            <button
                              onClick={() => {
                                window.history.pushState(
                                  {},
                                  "",
                                  `/panels/${panel.panelId || panel.id}`,
                                );
                                window.dispatchEvent(
                                  new PopStateEvent("popstate"),
                                );
                              }}
                              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors flex items-center justify-center"
                              title="View panel"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        ))
                      )}

                      {/* Free plan add-more CTA */}
                      {qrPanelId && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                          <div className="relative w-full max-w-3xl rounded-3xl bg-white border border-[#E5E7EB] shadow-2xl overflow-hidden">
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
                            <div className="p-6">
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
      {profileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileOpen(false)}
        />
      )}
    </div>
  );
}

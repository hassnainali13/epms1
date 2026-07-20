import { useState } from "react";
import {
  Users,
  Zap,
  Crown,
  DollarSign,
  LogOut,
  Settings,
  Shield,
  Search,
  CheckCircle2,
  Ban,
  RefreshCw,
  Eye,
  TrendingUp,
  X,
  Check,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import type { User } from "../context/AppContext";
import InstrumentMaster from "./InstrumentMaster";

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function AdminKpi({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 hover:shadow-md transition-shadow">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}
      >
        <Icon size={16} className="text-white" />
      </div>
      <p className="text-2xl font-bold text-[#0F172A] tracking-tight">
        {value}
      </p>
      <p className="text-xs font-medium text-[#0F172A] mt-0.5">{label}</p>
      <p className="text-[11px] text-[#64748B] mt-0.5">{sub}</p>
    </div>
  );
}

// ─── Price Editor Modal ────────────────────────────────────────────────────────

function PriceModal({
  current,
  onSave,
  onClose,
}: {
  current: number;
  onSave: (p: number) => void;
  onClose: () => void;
}) {
  const [val, setVal] = useState(String(current));
  const parsed = parseInt(val, 10);
  const valid = !isNaN(parsed) && parsed > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-[#E5E7EB] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-[#0F172A]">
            Change Subscription Price
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9]"
          >
            <X size={14} />
          </button>
        </div>
        <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
          Monthly Price (USD)
        </label>
        <div className="relative mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] text-sm">
            $
          </span>
          <input
            type="number"
            min="1"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full pl-7 pr-4 py-2.5 text-sm border border-[#E5E7EB] rounded-xl bg-[#F8FAFC] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-[#64748B] border border-[#E5E7EB] rounded-xl hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (valid) {
                onSave(parsed);
                onClose();
              }
            }}
            disabled={!valid}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Price
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const { activatePremium, deactivatePremium, blockUser, unblockUser } =
    useApp();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-[#E5E7EB] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-bold text-[#0F172A]">User Details</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9]"
          >
            <X size={14} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {/* Avatar & basic */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0EA5E9] flex items-center justify-center text-white font-bold text-lg">
              {user.name[0]}
            </div>
            <div>
              <p className="text-sm font-bold text-[#0F172A]">{user.name}</p>
              <p className="text-xs text-[#64748B]">{user.email}</p>
              <p className="text-[10px] text-[#94A3B8] mt-0.5">
                Joined {user.joinedAt}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Plan", value: user.plan },
              { label: "Panels", value: user.panels.length },
              { label: "Status", value: user.blocked ? "Blocked" : "Active" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-[#F8FAFC] rounded-xl p-3 text-center"
              >
                <p className="text-sm font-bold text-[#0F172A]">{value}</p>
                <p className="text-[10px] text-[#64748B] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Panels */}
          {user.panels.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#0F172A] mb-2">
                Panels ({user.panels.length})
              </p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {user.panels.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-[#F8FAFC] rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-medium text-[#0F172A]">
                        {p.name}
                      </p>
                      <p className="text-[10px] font-mono text-[#94A3B8]">
                        {p.id}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        p.status === "Installed"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {user.plan === "FREE" ? (
              <button
                onClick={() => {
                  activatePremium(user.id);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] rounded-xl transition-colors"
              >
                <Crown size={12} /> Activate Premium
              </button>
            ) : (
              <button
                onClick={() => {
                  deactivatePremium(user.id);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[#64748B] bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-xl transition-colors"
              >
                <RefreshCw size={12} /> Deactivate Premium
              </button>
            )}
            {user.blocked ? (
              <button
                onClick={() => {
                  unblockUser(user.id);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                <Check size={12} /> Unblock User
              </button>
            ) : (
              <button
                onClick={() => {
                  blockUser(user.id);
                  onClose();
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <Ban size={12} /> Block User
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────

export default function AdminDashboard() {
  const {
    users,
    logout,
    subscriptionPrice,
    setSubscriptionPrice,
    activatePremium,
    deactivatePremium,
    blockUser,
    unblockUser,
  } = useApp();

  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("Overview");
  const [filterPlan, setFilterPlan] = useState<"ALL" | "FREE" | "PREMIUM">(
    "ALL",
  );
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const totalPremium = users.filter((u) => u.plan === "PREMIUM").length;
  const totalFree = users.filter((u) => u.plan === "FREE").length;
  const totalPanels = users.reduce((acc, u) => acc + u.panels.length, 0);
  const monthlyRevenue = totalPremium * subscriptionPrice;

  const filtered = users.filter((u) => {
    const matchPlan = filterPlan === "ALL" || u.plan === filterPlan;
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchPlan && matchSearch;
  });

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-[Inter,sans-serif] overflow-hidden">
      {/* ── Admin Sidebar ── */}
      <aside className="w-[240px] flex-shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#E5E7EB] gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0F172A] flex items-center justify-center flex-shrink-0">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">Admin Panel</p>
            <p className="text-[10px] text-[#64748B]">EPMS Control Center</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5">
          {[
            { icon: TrendingUp, label: "Overview" },
            { icon: Users, label: "Users" },
            { icon: Zap, label: "Panels" },
            { icon: Zap, label: "Instrument Master" },
            { icon: DollarSign, label: "Revenue" },
            { icon: Settings, label: "Settings" },
          ].map(({ icon: Icon, label }) => {
            const active =
              selectedSection === label ||
              (label === "Overview" && selectedSection === "Overview");
            return (
              <button
                key={label}
                onClick={() => setSelectedSection(label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#F0F9FF] text-[#0369A1]"
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                }`}
              >
                <Icon
                  size={17}
                  className={active ? "text-[#0EA5E9]" : "text-[#94A3B8]"}
                />
                {label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-[#E5E7EB] p-3">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={17} />
            Logout Admin
          </button>
          <div className="mt-2 p-3 rounded-xl bg-[#0F172A]">
            <p className="text-xs font-bold text-white">Administrator</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Full system access
            </p>
          </div>
        </div>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-6 justify-between flex-shrink-0">
          <div>
            <p className="text-sm font-bold text-[#0F172A]">
              Dashboard Overview
            </p>
            <p className="text-xs text-[#64748B]">EPMS Admin · Full access</p>
          </div>
          <button
            onClick={() => setShowPriceModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-xl transition-colors"
          >
            <DollarSign size={14} />
            Change Price · ${subscriptionPrice}/mo
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {selectedSection === "Instrument Master" ? (
            <InstrumentMaster />
          ) : (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <AdminKpi
                  label="Total Users"
                  value={users.length}
                  sub="All registered accounts"
                  icon={Users}
                  color="bg-[#0EA5E9]"
                />
                <AdminKpi
                  label="Premium Users"
                  value={totalPremium}
                  sub="Active subscriptions"
                  icon={Crown}
                  color="bg-[#8B5CF6]"
                />
                <AdminKpi
                  label="Free Users"
                  value={totalFree}
                  sub="Non-paying accounts"
                  icon={Zap}
                  color="bg-[#64748B]"
                />
                <AdminKpi
                  label="Total Panels"
                  value={totalPanels}
                  sub="All user panels"
                  icon={Zap}
                  color="bg-[#22C55E]"
                />
                <AdminKpi
                  label="Monthly Revenue"
                  value={`$${monthlyRevenue.toLocaleString()}`}
                  sub={`${totalPremium} × $${subscriptionPrice}`}
                  icon={DollarSign}
                  color="bg-[#F59E0B]"
                />
              </div>

              {/* Revenue insight */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center">
                    <TrendingUp size={18} className="text-[#22C55E]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">
                      Current Monthly Revenue
                    </p>
                    <p className="text-xs text-[#64748B]">
                      {totalPremium} premium subscribers × ${subscriptionPrice}
                      /month
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#0F172A]">
                    ${monthlyRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">
                    per month
                  </p>
                </div>
              </div>

              {/* User Management */}
              <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB] flex-wrap gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-[#0F172A]">
                      User Management
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {filtered.length} users shown
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Filter tabs */}
                    <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1">
                      {(["ALL", "FREE", "PREMIUM"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setFilterPlan(f)}
                          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            filterPlan === f
                              ? "bg-white text-[#0F172A] shadow-sm"
                              : "text-[#64748B] hover:text-[#0F172A]"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    {/* Search */}
                    <div className="relative">
                      <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                      />
                      <input
                        type="text"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-[#E5E7EB] rounded-lg bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="grid grid-cols-[1fr_140px_80px_60px_80px_120px] gap-4 px-6 py-2.5 bg-[#F8FAFC] border-b border-[#E5E7EB] text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  <span>User</span>
                  <span>Email</span>
                  <span>Plan</span>
                  <span>Panels</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {filtered.map((user) => (
                  <div
                    key={user.id}
                    className="grid grid-cols-[1fr_140px_80px_60px_80px_120px] gap-4 px-6 py-3.5 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors items-center"
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#E0F2FE] flex items-center justify-center text-[#0369A1] text-xs font-bold flex-shrink-0">
                        {user.name[0]}
                      </div>
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {user.name}
                      </p>
                    </div>

                    {/* Email */}
                    <p className="text-xs text-[#64748B] truncate">
                      {user.email}
                    </p>

                    {/* Plan badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold w-fit ${
                        user.plan === "PREMIUM"
                          ? "bg-[#0EA5E9] text-white"
                          : "bg-[#F1F5F9] text-[#64748B]"
                      }`}
                    >
                      {user.plan === "PREMIUM" && <Crown size={9} />}
                      {user.plan}
                    </span>

                    {/* Panels count */}
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {user.panels.length}
                    </p>

                    {/* Active/Blocked */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full w-fit ${
                        user.blocked
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {user.blocked ? (
                        <Ban size={9} />
                      ) : (
                        <CheckCircle2 size={9} />
                      )}
                      {user.blocked ? "Blocked" : "Active"}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#64748B] hover:bg-[#F1F5F9] transition-colors"
                        title="View Details"
                      >
                        <Eye size={13} />
                      </button>
                      {user.plan === "FREE" ? (
                        <button
                          onClick={() => activatePremium(user.id)}
                          className="p-1.5 rounded-lg text-[#0EA5E9] hover:bg-[#E0F2FE] transition-colors"
                          title="Activate Premium"
                        >
                          <Crown size={13} />
                        </button>
                      ) : (
                        <button
                          onClick={() => deactivatePremium(user.id)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] transition-colors"
                          title="Remove Premium"
                        >
                          <RefreshCw size={13} />
                        </button>
                      )}
                      {user.blocked ? (
                        <button
                          onClick={() => unblockUser(user.id)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Unblock"
                        >
                          <CheckCircle2 size={13} />
                        </button>
                      ) : (
                        <button
                          onClick={() => blockUser(user.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                          title="Block"
                        >
                          <Ban size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      {showPriceModal && (
        <PriceModal
          current={subscriptionPrice}
          onSave={setSubscriptionPrice}
          onClose={() => setShowPriceModal(false)}
        />
      )}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}

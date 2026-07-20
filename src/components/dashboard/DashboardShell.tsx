import type { ReactNode } from "react";
import { Crown, Menu, Search, Settings, LogOut, Plus } from "lucide-react";

interface DashboardShellProps {
  children: ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeNav: string;
  isPremium: boolean;
  currentUserName: string;
  currentUserEmail: string;
  onLogout: () => void;
  onCreatePanel: () => void;
  onOpenSearch: () => void;
}

export function DashboardShell({
  children,
  sidebarOpen,
  onToggleSidebar,
  activeNav,
  isPremium,
  currentUserName,
  currentUserEmail,
  onLogout,
  onCreatePanel,
  onOpenSearch,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-[Inter,sans-serif] overflow-hidden">
      <aside
        className={`${sidebarOpen ? "w-[264px]" : "w-[72px]"} shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-200 ease-in-out z-30`}
      >
        <div className="h-16 flex items-center px-5 border-b border-[#E5E7EB] gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white font-bold text-sm">
            E
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-[#0F172A] whitespace-nowrap">
                ElectraPanel
              </p>
              <p className="text-[10px] text-[#64748B] whitespace-nowrap">
                Management System
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 space-y-0.5">{children}</div>
        </nav>

        <div className="border-t border-[#E5E7EB] p-3 space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors">
            <Settings size={18} className="text-[#94A3B8]" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>

          {sidebarOpen && (
            <div className="mt-2 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0EA5E9] flex items-center justify-center text-white text-xs font-bold">
                  {currentUserName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] truncate">
                    {currentUserName}
                  </p>
                  <p className="text-[10px] text-[#64748B] truncate">
                    {currentUserEmail}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-6 gap-4 shrink-0 z-20">
          <button
            onClick={onToggleSidebar}
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
            <span
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${isPremium ? "bg-[#0EA5E9] text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}
            >
              {isPremium ? (
                <>
                  <Crown size={10} /> PREMIUM
                </>
              ) : (
                "FREE"
              )}
            </span>
            <button
              onClick={onOpenSearch}
              className="relative p-2 rounded-lg text-[#64748B] hover:bg-[#F1F5F9] transition-colors ml-1"
            >
              <Search size={18} />
            </button>
            <button
              onClick={onCreatePanel}
              className="ml-2 flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#0EA5E9] rounded-xl hover:bg-[#0284C7] transition-colors shadow-sm"
            >
              <Plus size={14} />
              New Panel
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">{children}</main>
      </div>
    </div>
  );
}

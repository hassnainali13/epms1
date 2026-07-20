import { useState } from "react";
import { Search, X } from "lucide-react";
import type { Panel } from "../../context/AppContext";
import { StatusBadge } from "./StatusBadge";

export function SearchPanelModal({
  onClose,
  panels,
}: {
  onClose: () => void;
  panels: Panel[];
}) {
  const [query, setQuery] = useState("");

  const results =
    query.length > 1
      ? panels.filter((panel) => {
          const name = panel.panelName || panel.name || "";
          const id = panel.panelId || panel.id || "";
          const customer = panel.customer || "";
          return (
            name.toLowerCase().includes(query.toLowerCase()) ||
            id.toLowerCase().includes(query.toLowerCase()) ||
            customer.toLowerCase().includes(query.toLowerCase())
          );
        })
      : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5E7EB] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E5E7EB]">
          <Search size={16} className="text-[#94A3B8] shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search by panel name, ID, or customer..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="flex-1 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#94A3B8] hover:text-[#64748B] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {query.length < 2 && (
            <p className="text-xs text-[#94A3B8] text-center py-8">
              Type at least 2 characters to search
            </p>
          )}
          {query.length >= 2 && results.length === 0 && (
            <p className="text-xs text-[#94A3B8] text-center py-8">
              No panels found for "{query}"
            </p>
          )}
          {results.map((panel) => (
            <div
              key={panel.id}
              className="flex items-center justify-between px-4 py-3 hover:bg-[#F8FAFC] border-b border-[#F1F5F9] last:border-0 cursor-pointer"
            >
              <div>
                <p className="text-sm font-medium text-[#0F172A]">
                  {panel.panelName || panel.name}
                </p>
                <p className="text-[10px] font-mono text-[#94A3B8] mt-0.5">
                  {panel.panelId || panel.id} · {panel.customer}
                </p>
              </div>
              <StatusBadge status={panel.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Lock, QrCode } from "lucide-react";
import api from "../lib/api";
import type { Panel } from "../context/AppContext";

interface PanelQrPageProps {
  panelId: string;
}

export default function PanelQrPage({ panelId }: PanelQrPageProps) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "install">("view");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [installData, setInstallData] = useState({
    installer: "",
    installationDate: "",
    installationLocation: "",
  });

  const hasInstallationDetails = Boolean(
    panel?.installer && panel?.installationDate && panel?.installationLocation,
  );

  const canCompleteInstallation = Boolean(
    !hasInstallationDetails && panel?.status !== "Installed",
  );

  const companyDisplayName = panel
    ? panel.companyName ||
      (typeof panel.company === "object"
        ? panel.company?.name
        : panel.company) ||
      "—"
    : "—";

  const companyLogoSrc =
    panel?.companyLogoUrl ||
    (typeof panel?.company === "object" ? panel.company?.logoUrl : undefined) ||
    undefined;

  const qrPayload =
    panel?.qrUrl ||
    (typeof window !== "undefined" && panel?.panelId
      ? `${window.location.origin}/panel/${panel.panelId}`
      : null);

  const qrImageSrc = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        qrPayload,
      )}`
    : null;

  useEffect(() => {
    const getPanel = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/panels/public/${panelId}`);
        setPanel(res.data.panel);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load panel. Please try again later.",
        );
      } finally {
        setLoading(false);
      }
    };
    getPanel();
  }, [panelId]);

  useEffect(() => {
    if (panel && !canCompleteInstallation) {
      setMode("view");
    }
  }, [panel, canCompleteInstallation]);

  // Auto-fill installation date with today's date when installer opens install mode
  useEffect(() => {
    if (mode === "install" && installData.installationDate === "") {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setInstallData((prev) => ({
        ...prev,
        installationDate: `${yyyy}-${mm}-${dd}`,
      }));
    }
  }, [mode, installData.installationDate]);

  useEffect(() => {
    if (
      panel &&
      !canCompleteInstallation &&
      window.location.pathname.startsWith("/panel/")
    ) {
      window.history.replaceState({}, "", `/panels/${panelId}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  }, [panel, canCompleteInstallation, panelId]);

  const handleInstallSubmit = async () => {
    if (!panel) return;
    try {
      setError(null);
      const response = await api.put(
        `/panels/complete-installation/${panelId}`,
        {
          code,
          installer: installData.installer,
          installationDate: installData.installationDate,
          installationLocation: installData.installationLocation,
        },
      );
      setPanel(response.data.panel);
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Install update failed.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 shadow-xl text-center">
          <p className="text-sm text-[#64748B]">Loading panel details…</p>
        </div>
      </div>
    );
  }

  if (!panel) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-10 shadow-xl text-center">
          <p className="text-sm text-[#64748B]">Panel not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-[#E5E7EB] shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-[#E5E7EB] flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0EA5E9] flex items-center justify-center text-white">
            <QrCode size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[#94A3B8]">
              QR panel lookup
            </p>
            <h1 className="text-xl font-bold text-[#0F172A]">
              {panel.panelName || panel.panelId}
            </h1>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#E5E7EB] p-4">
              <p className="text-xs text-[#64748B]">Panel ID</p>
              <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                {panel.panelId}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] p-4">
              <p className="text-xs text-[#64748B]">Status</p>
              <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                {panel.status}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] p-4">
              <p className="text-xs text-[#64748B]">Company</p>
              <p className="mt-2 text-sm font-semibold text-[#0F172A]">
                {companyDisplayName}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] p-5 bg-[#F8FAFC] flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-56 h-56 bg-white border-2 border-[#0F172A] rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex items-center justify-center">
                {qrImageSrc ? (
                  <img
                    src={qrImageSrc}
                    alt="Panel QR Code"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-xs text-[#64748B]">
                    QR not available
                  </div>
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#2563EB] flex items-center justify-center shadow-lg">
                  <span className="text-[10px] font-bold tracking-[0.22em] text-white">
                    EPMS
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm font-semibold text-[#0F172A]">
                {panel.panelName || panel.panelId}
              </p>
              <p className="text-xs text-[#64748B] mt-1">
                Scan to access panel details instantly
              </p>
            </div>
          </div>

          {mode === "view" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#E5E7EB] p-4">
                  <p className="text-xs text-[#64748B]">Customer</p>
                  <p className="mt-2 text-sm text-[#0F172A]">
                    {panel.customer}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] p-4">
                  <p className="text-xs text-[#64748B]">
                    Installation Location
                  </p>
                  <p className="mt-2 text-sm text-[#0F172A]">
                    {panel.installationLocation || "Not set"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#E5E7EB] p-4">
                  <p className="text-xs text-[#64748B]">Installer</p>
                  <p className="mt-2 text-sm text-[#0F172A]">
                    {panel.installer || "Not set"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] p-4 bg-[#F8FAFC]">
                <p className="text-xs text-[#64748B] mb-2">Description</p>
                <p className="text-sm text-[#0F172A]">
                  {panel.description || "Not available"}
                </p>
              </div>

              {canCompleteInstallation && (
                <button
                  onClick={() => setMode("install")}
                  className="inline-flex items-center gap-2 px-5 py-3 bg-[#0EA5E9] text-white rounded-2xl hover:bg-[#0284C7] transition-colors"
                >
                  <Lock size={16} />
                  Complete Installation
                </button>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#E5E7EB] p-5 bg-[#F8FAFC]">
                <p className="text-xs text-[#64748B] mb-2">
                  Enter installer code
                </p>
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  type="password"
                  placeholder="Installer access code"
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-xl bg-white text-[#0F172A]"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#0F172A]">
                    Installer Name
                  </label>
                  <input
                    value={installData.installer}
                    onChange={(e) =>
                      setInstallData((prev) => ({
                        ...prev,
                        installer: e.target.value,
                      }))
                    }
                    placeholder="Installer name"
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-xl bg-white text-[#0F172A]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#0F172A]">
                    Install Date
                  </label>
                  <input
                    value={installData.installationDate}
                    onChange={(e) =>
                      setInstallData((prev) => ({
                        ...prev,
                        installationDate: e.target.value,
                      }))
                    }
                    type="date"
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-xl bg-white text-[#0F172A]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#0F172A]">
                  Installation Location
                </label>
                <input
                  value={installData.installationLocation}
                  onChange={(e) =>
                    setInstallData((prev) => ({
                      ...prev,
                      installationLocation: e.target.value,
                    }))
                  }
                  placeholder="Installation location"
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E7EB] rounded-xl bg-white text-[#0F172A]"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                onClick={handleInstallSubmit}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#0EA5E9] text-white rounded-2xl hover:bg-[#0284C7] transition-colors"
              >
                <ArrowRight size={16} />
                Save installation details
              </button>
            </div>
          )}

          {panel.qrUrl && (
            <div className="rounded-2xl border border-[#E5E7EB] p-4 bg-[#F8FAFC]">
              <p className="text-xs text-[#64748B]">QR URL</p>
              <p className="mt-2 text-sm text-[#0F172A]">{panel.qrUrl}</p>
            </div>
          )}

          {panel.status === "Installed" && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <p className="text-sm text-emerald-700">Installation complete.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

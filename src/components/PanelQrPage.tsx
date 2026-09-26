import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Lock, QrCode } from "lucide-react";
import api from "../lib/api";
import type { Panel } from "../context/AppContext";
import PanelDetails from "./PanelDetails";

interface PanelQrPageProps {
  panelId: string;
  publicAccessCode?: string;
}

export default function PanelQrPage({
  panelId,
  publicAccessCode,
}: PanelQrPageProps) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "install">("view");
  const [code, setCode] = useState("");
  const [installationToken, setInstallationToken] = useState<string | null>(null);
  const [installerVerified, setInstallerVerified] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [requiresUniqueUrl, setRequiresUniqueUrl] = useState(false);
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

  const openPanelDetails = (publicAccessCode: string) => {
    window.location.replace(
      `/${encodeURIComponent(publicAccessCode)}/${encodeURIComponent(panelId)}`,
    );
  };

  const companyDisplayName = panel
    ? panel.companyName ||
      (typeof panel.company === "object"
        ? panel.company?.name
        : panel.company) ||
      "—"
    : "—";

  useEffect(() => {
    const getPanel = async () => {
      try {
        setLoading(true);
        const endpoint = publicAccessCode
          ? `/panels/public/${encodeURIComponent(panelId)}/access/${encodeURIComponent(publicAccessCode)}`
          : `/panels/public/${encodeURIComponent(panelId)}`;
        const res = await api.get(endpoint);
        const nextPanel = res.data.panel as Panel;
        if (res.data.requiresUniqueUrl) {
          setRequiresUniqueUrl(true);
          setPanel(nextPanel);
          return;
        }
        if (nextPanel.status === "Installed" && !publicAccessCode) {
          if (res.data.publicAccessCode) {
            openPanelDetails(res.data.publicAccessCode);
          } else {
            setError("Secure panel details link is not available.");
          }
          return;
        }
        setPanel(nextPanel);
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

  const handleVerifyInstallerCode = async () => {
    try {
      setError(null);
      setVerifyingCode(true);
      const response = await api.post(
        `/panels/public/${encodeURIComponent(panelId)}/verify-installer`,
        {
          code,
          ...(publicAccessCode ? { publicAccessCode } : {}),
        },
      );
      setPanel(response.data.panel as Panel);
      setInstallationToken(response.data.token as string);
      setInstallerVerified(true);
      setCode("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to verify installer code.",
      );
    } finally {
      setVerifyingCode(false);
    }
  };

  const handleInstallSubmit = async () => {
    if (!panel || !installationToken) return;
    try {
      setError(null);
      const response = await api.put(
        `/panels/complete-installation/${panelId}`,
        {
          installer: installData.installer,
          installationDate: installData.installationDate,
          installationLocation: installData.installationLocation,
        },
        {
          headers: { Authorization: `Bearer ${installationToken}` },
        },
      );
      setPanel(response.data.panel);
      if (response.data.panel.status === "Installed" && !publicAccessCode) {
        if (response.data.publicAccessCode) {
          openPanelDetails(response.data.publicAccessCode);
        } else {
          setError("Secure panel details link is not available.");
        }
      } else {
        setMode("view");
      }
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

  if (requiresUniqueUrl) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 text-center shadow-lg sm:p-8">
          <h1 className="text-lg font-bold text-[#0F172A]">Use the panel QR code</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            This new panel uses a secure unique URL. Open it from the QR code attached to the panel.
          </p>
        </div>
      </div>
    );
  }

  if (publicAccessCode && panel.status === "Installed") {
    return <PanelDetails panelId={panelId} publicAccessCode={publicAccessCode} />;
  }

  if (!installerVerified && panel.status !== "Installed") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-lg sm:p-8">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#0284C7]">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-xs text-[#64748B]">Panel {panel.panelId}</p>
              <h1 className="text-lg font-bold text-[#0F172A]">
                Installer verification
              </h1>
            </div>
          </div>
          <p className="mb-4 text-sm text-[#64748B]">
            Enter your company installer access code to view panel details and continue installation.
          </p>
          <label className="mb-2 block text-xs font-semibold text-[#0F172A]">
            Installer access code
          </label>
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !verifyingCode && code.trim()) {
                void handleVerifyInstallerCode();
              }
            }}
            type="password"
            autoComplete="one-time-code"
            placeholder="Enter access code"
            className="mb-3 w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm text-[#0F172A] focus:border-[#0EA5E9] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20"
          />
          {error && (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          <button
            type="button"
            disabled={!code.trim() || verifyingCode}
            onClick={() => void handleVerifyInstallerCode()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0284C7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lock size={15} />
            {verifyingCode ? "Verifying..." : "Verify and continue"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-[#E5E7EB] shadow-xl overflow-hidden">
        <div className="px-4 py-4 sm:px-8 sm:py-6 border-b border-[#E5E7EB] flex items-center gap-3">
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

        <div className="p-4 space-y-4 sm:p-8 sm:space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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

          {mode === "view" ? (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
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
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
                className="inline-flex w-full items-center justify-center gap-2 px-5 py-3 bg-[#0EA5E9] text-white rounded-2xl hover:bg-[#0284C7] transition-colors sm:w-auto"
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

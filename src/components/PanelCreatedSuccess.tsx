import { CheckCircle2 } from "lucide-react";

function readQuery(name: string) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name) || "";
}

export default function PanelCreatedSuccess() {
  const panelId = window.location.pathname.replace("/panels/success/", "");
  const publicUrl = decodeURIComponent(readQuery("public"));
  const panelName = decodeURIComponent(readQuery("name") || "");
  const companyName = decodeURIComponent(readQuery("company") || "");
  const panelType = decodeURIComponent(readQuery("type") || "");

  const qrSrc = publicUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        publicUrl,
      )}`
    : "";

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#E5E7EB] shadow-xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-[#94A3B8]">
              Success
            </p>
            <h1 className="text-xl font-bold text-[#0F172A]">
              ✅ Panel Created Successfully
            </h1>
          </div>
        </div>

        <p className="text-sm text-[#64748B] mb-6">
          Your panel has been successfully created.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-[#E5E7EB] p-4 bg-[#F8FAFC]">
            <p className="text-xs text-[#64748B]">Panel ID</p>
            <p className="mt-2 text-sm font-semibold text-[#0F172A]">
              {panelId}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] p-4 bg-[#F8FAFC]">
            <p className="text-xs text-[#64748B]">Panel Name</p>
            <p className="mt-2 text-sm text-[#0F172A]">{panelName || "-"}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] p-4 bg-[#F8FAFC]">
            <p className="text-xs text-[#64748B]">Company Name</p>
            <p className="mt-2 text-sm text-[#0F172A]">{companyName || "-"}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E7EB] p-4 bg-[#F8FAFC]">
            <p className="text-xs text-[#64748B]">Panel Type</p>
            <p className="mt-2 text-sm text-[#0F172A]">{panelType || "-"}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div>
            {qrSrc ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={qrSrc} alt="QR Code" className="w-48 h-48 rounded-lg" />
            ) : (
              <div className="w-48 h-48 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8]">
                No QR
              </div>
            )}
          </div>
          <div>
            <p className="text-xs text-[#64748B]">Public URL</p>
            <p className="mt-2 text-sm text-[#0EA5E9] break-words">
              {publicUrl || "-"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, "", `/panels/${panelId}`);
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0EA5E9] text-white rounded-2xl"
          >
            View Panel
          </button>

          <button
            type="button"
            onClick={() => {
              window.history.pushState({}, "", "/");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border rounded-2xl"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

import { Lock, Users, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface InstallerCodeSettingsProps {
  installerAccessCode: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => Promise<void> | void;
  saving: boolean;
  notice: { type: "success" | "error"; text: string } | null;
}

export default function InstallerCodeSettings({
  installerAccessCode,
  onChange,
  onSubmit,
  saving,
  notice,
}: InstallerCodeSettingsProps) {
  const [showCode, setShowCode] = useState(false);
  return (
    <div className="space-y-6">
      <div className="bg-[#F8FAFC] rounded-2xl border border-[#E5E7EB] p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center text-[#0EA5E9]">
            <Lock size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">
              Installer Access Code
            </p>
            <p className="text-sm text-[#64748B] mt-1">
              This code is required for installers to complete the QR panel
              installation flow.
            </p>
          </div>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-xs font-semibold text-[#0F172A] block mb-2">
              Current installer access code
            </label>
            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={installerAccessCode}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Enter installer access code"
                className="w-full pr-11 px-4 py-3 text-sm border border-[#E5E7EB] rounded-2xl bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9]"
              />
              <button
                type="button"
                onClick={() => setShowCode((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-[#64748B]"
              >
                {showCode ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {notice ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm ${
                notice.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {notice.text}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0EA5E9] rounded-2xl hover:bg-[#0284C7] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Users size={16} />
            {saving ? "Saving..." : "Save Installer Code"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
            <Users size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-[#0F172A]">Employee Access</p>
            <p className="text-sm text-[#64748B] mt-1">
              You can share this installer code with your installation team.
              Employees will use it when completing panel installation from the
              QR lookup screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

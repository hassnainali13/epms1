import { X, Zap, Check, Lock } from "lucide-react";
import { useApp } from "../context/AppContext";

interface UpgradeModalProps {
  onClose: () => void;
  trigger?: string;
}

const FREE_FEATURES = [
  "Create up to 3 panels",
  "Generate QR codes for your panels",
  "Search unlimited panels",
  "Export QR code PDF",
];

const PREMIUM_FEATURES = [
  "Unlimited panels",
  "Unlimited QR code generation",
  "Upload panel images",
  "Upload wiring diagrams",
  "Upload specification PDFs",
  "Company branding on QR PDFs",
  "Premium analytics & reports",
  "Unlimited storage",
  "All dashboard features",
  "Priority support",
];

export default function UpgradeModal({ onClose, trigger }: UpgradeModalProps) {
  const { currentUser, upgradePlan, subscriptionPrice } = useApp();

  function handleUpgrade() {
    if (!currentUser) return;
    upgradePlan(currentUser.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-[#E5E7EB] overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0EA5E9] to-[#0284C7] px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
                <Zap size={13} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">Upgrade Required</span>
            </div>
            <h2 className="text-lg font-bold text-white">Unlock Premium Access</h2>
            {trigger && (
              <p className="text-sm text-white/70 mt-0.5">{trigger}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">

          {/* Plan comparison */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Free */}
            <div className="rounded-xl border border-[#E5E7EB] p-4 bg-[#F8FAFC]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Free</span>
                <span className="text-xs font-semibold text-[#64748B] bg-[#E5E7EB] px-2 py-0.5 rounded-full">Current</span>
              </div>
              <p className="text-xl font-bold text-[#0F172A] mb-3">$0<span className="text-sm font-normal text-[#64748B]">/mo</span></p>
              <ul className="space-y-1.5">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-[#64748B]">
                    <Check size={12} className="text-[#94A3B8] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Premium */}
            <div className="rounded-xl border-2 border-[#0EA5E9] p-4 bg-[#F0F9FF] relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <span className="text-[10px] font-bold text-white bg-[#0EA5E9] px-2 py-0.5 rounded-full">BEST</span>
              </div>
              <div className="flex items-center gap-1.5 mb-3">
                <Zap size={12} className="text-[#0EA5E9]" />
                <span className="text-xs font-bold text-[#0EA5E9] uppercase tracking-wider">Premium</span>
              </div>
              <p className="text-xl font-bold text-[#0F172A] mb-3">
                ${subscriptionPrice}<span className="text-sm font-normal text-[#64748B]">/mo</span>
              </p>
              <ul className="space-y-1.5">
                {PREMIUM_FEATURES.slice(0, 6).map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-[#0369A1]">
                    <Check size={12} className="text-[#0EA5E9] mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
                <li className="text-xs text-[#0EA5E9] font-medium pl-4">+{PREMIUM_FEATURES.length - 6} more features</li>
              </ul>
            </div>
          </div>

          {/* Locked feature callout */}
          {trigger && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
              <Lock size={14} className="text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                <span className="font-semibold">Feature locked:</span> {trigger} is only available on the Premium plan.
              </p>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <Zap size={15} />
            Upgrade to Premium — ${subscriptionPrice}/month
          </button>
          <button
            onClick={onClose}
            className="w-full mt-2 text-sm text-[#64748B] hover:text-[#0F172A] py-2 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

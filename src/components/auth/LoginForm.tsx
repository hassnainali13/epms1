import { useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string;
  isAdmin?: boolean;
  initialEmail?: string;
}

export function LoginForm({
  onSubmit,
  loading,
  error,
  isAdmin = false,
  initialEmail = "",
}: LoginFormProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    setEmail(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          required
          placeholder={isAdmin ? "admin@epms.io" : "you@company.com"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full px-3.5 py-2.5 text-sm border border-[#E5E7EB] rounded-xl bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-[#0F172A] block mb-1.5">
          Password
        </label>
        <div className="relative">
          <input
            type={showPass ? "text" : "password"}
            required
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full px-3.5 py-2.5 pr-10 text-sm border border-[#E5E7EB] rounded-xl bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/20 focus:border-[#0EA5E9] transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`w-full py-2.5 text-sm font-semibold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm ${
          isAdmin
            ? "bg-[#0F172A] hover:bg-[#1E293B]"
            : "bg-[#0EA5E9] hover:bg-[#0284C7]"
        } disabled:opacity-70`}
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Sign In
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}

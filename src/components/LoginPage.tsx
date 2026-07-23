import { useEffect, useState } from "react";
import { Zap, Shield, Check } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LoginForm } from "./auth/LoginForm";
import { SignupForm } from "./auth/SignupForm";
import { VerifyEmail } from "./auth/VerifyEmail";

type Mode = "login" | "register" | "admin";

interface LoginPageProps {
  initialMode?: Mode;
  showAdminLink?: boolean;
}

const FREE_PERKS = [
  "Create up to 3 panels",
  "Generate QR codes",
  "Search all panels",
  "Export QR PDF",
];

export default function LoginPage({
  initialMode = "login",
  showAdminLink = true,
}: LoginPageProps) {
  const { loginUser, loginAdmin, registerUser } = useApp();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    reset();
  }, [initialMode]);

  function reset() {
    setError("");
    setMessage("");
    setPendingEmail("");
    setShowVerification(false);
  }

  function switchMode(m: Mode) {
    reset();
    setMode(m);
    if (typeof window !== "undefined") {
      if (m === "admin") {
        window.history.pushState({}, "", "/admin-login");
      } else if (m === "login") {
        window.history.pushState({}, "", "/");
      }
    }
  }

  async function handleLogin(email: string, password: string) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      if (!res.ok) {
        if (res.requiresEmailVerification) {
          setPendingEmail(res.email ?? email);
          setShowVerification(true);
          setMessage(
            res.message ?? "Please verify your email before logging in.",
          );
          return;
        }
        setError(res.error ?? "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(email: string, password: string) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await loginAdmin(email, password);
      if (!res.ok) setError(res.error ?? "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(
    nameValue: string,
    email: string,
    password: string,
    companyName: string,
  ) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      if (!nameValue.trim()) {
        setError("Please enter your full name.");
        setLoading(false);
        return;
      }
      if (!companyName.trim()) {
        setError("Please enter your company name.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        setLoading(false);
        return;
      }
      const res = await registerUser(
        nameValue.trim(),
        email,
        password,
        companyName.trim(),
      );
      if (!res.ok) {
        setError(res.error ?? "Registration failed.");
      } else {
        setPendingEmail(email);
        setShowVerification(true);
        setMessage(
          "Verification code sent successfully. Please check your email.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const isAdmin = mode === "admin";
  const isVerificationView =
    showVerification && (mode === "login" || mode === "register");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-[Inter,sans-serif]">
      {/* ── Left panel ── */}
      <div
        className={`hidden lg:flex flex-col justify-between w-[440px] flex-shrink-0 p-10 ${isAdmin ? "bg-[#0F172A]" : "bg-[#0EA5E9]"}`}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${isAdmin ? "bg-white/10" : "bg-white/20"}`}
            >
              {isAdmin ? (
                <Shield size={18} className="text-white" />
              ) : (
                <Zap size={18} className="text-white" />
              )}
            </div>
            <div>
              <p className="text-base font-bold text-white">ElectraPanel</p>
              <p className="text-[11px] text-white/60">Management System</p>
            </div>
          </div>

          {isAdmin ? (
            <>
              <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                Admin
                <br />
                Control Panel
              </h1>
              <p className="text-sm text-white/60 leading-relaxed">
                Secure administrator access. Manage users, subscriptions, and
                system settings from a central dashboard.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Manage all users",
                  "Activate / deactivate Premium",
                  "Block & unblock accounts",
                  "View revenue analytics",
                  "Change subscription pricing",
                ].map((f) => (
                  <div
                    key={f}
                    className="flex items-center gap-2.5 text-sm text-white/70"
                  >
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Check size={11} className="text-white" />
                    </div>
                    {f}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                Manage Electrical
                <br />
                Panels with Ease
              </h1>
              <p className="text-sm text-white/70 leading-relaxed">
                The complete solution for electrical panel manufacturing
                companies — from production to installation and QR tracking.
              </p>
              <div className="mt-8">
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                  Free plan includes
                </p>
                <div className="space-y-2.5">
                  {FREE_PERKS.map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2.5 text-sm text-white/80"
                    >
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-white" />
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-[11px] text-white/40">
          © 2024 ElectraPanel · All rights reserved
        </p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#0EA5E9] flex items-center justify-center">
              <Zap size={15} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[#0F172A]">
              ElectraPanel
            </span>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0F172A]">
              {isVerificationView && "Verify Your Email"}
              {!isVerificationView &&
                mode === "login" &&
                "Sign in to your account"}
              {!isVerificationView &&
                mode === "register" &&
                "Create your account"}
              {mode === "admin" && "Admin sign in"}
            </h2>
            <p className="text-sm text-[#64748B] mt-1">
              {isVerificationView &&
                (mode === "login"
                  ? "Please verify your email before logging in."
                  : "Please verify your email to continue.")}
              {!isVerificationView &&
                mode === "login" &&
                "Enter your credentials to continue"}
              {!isVerificationView &&
                mode === "register" &&
                "Start with a free account — no credit card required"}
              {mode === "admin" &&
                "Restricted to authorized administrators only"}
            </p>
          </div>

          {/* Form */}
          {showVerification && (mode === "login" || mode === "register") ? (
            <VerifyEmail
              email={pendingEmail}
              initialSuccessMessage={
                mode === "register"
                  ? "Verification code sent successfully. Please check your email."
                  : undefined
              }
              initialCountdown={mode === "register" ? 60 : 0}
              onVerified={() => {
                setShowVerification(false);
                setMode("login");
                setMessage("Email verified successfully. Please sign in.");
              }}
              onBackToLogin={() => {
                setShowVerification(false);
                setMode("login");
              }}
            />
          ) : mode === "register" ? (
            <>
              {message && (
                <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
                  {message}
                </div>
              )}
              <SignupForm
                onSubmit={handleSignup}
                loading={loading}
                error={error}
              />
            </>
          ) : (
            <LoginForm
              onSubmit={mode === "admin" ? handleAdminLogin : handleLogin}
              loading={loading}
              error={error}
              isAdmin={isAdmin}
              initialEmail={pendingEmail}
            />
          )}

          {/* Mode switchers */}
          {!isAdmin && !showVerification && (
            <div className="mt-4 text-center">
              {mode === "login" ? (
                <p className="text-sm text-[#64748B]">
                  No account?{" "}
                  <button
                    onClick={() => switchMode("register")}
                    className="text-[#0EA5E9] font-semibold hover:underline"
                  >
                    Create one for free
                  </button>
                </p>
              ) : (
                <p className="text-sm text-[#64748B]">
                  Already have an account?{" "}
                  <button
                    onClick={() => switchMode("login")}
                    className="text-[#0EA5E9] font-semibold hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Demo credentials hint */}
          {mode === "login" && (
            <div className="mt-5 bg-[#F1F5F9] rounded-xl p-3 text-xs text-[#64748B]">
              <p className="font-semibold text-[#0F172A] mb-1">
                Demo credentials
              </p>
              <p>
                Free user: <span className="font-mono">ahmed@example.com</span>{" "}
                / <span className="font-mono">Password123</span>
              </p>
              <p className="mt-0.5">
                Premium user:{" "}
                <span className="font-mono">sara@example.com</span> /{" "}
                <span className="font-mono">Password123</span>
              </p>
            </div>
          )}

          {/* Admin toggle */}
          {showAdminLink && (
            <div className="mt-6 pt-4 border-t border-[#E5E7EB] text-center">
              {isAdmin ? (
                <button
                  onClick={() => switchMode("login")}
                  className="text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
                >
                  ← Back to user login
                </button>
              ) : (
                <button
                  onClick={() => switchMode("admin")}
                  className="text-xs text-[#94A3B8] hover:text-[#64748B] transition-colors flex items-center gap-1.5 mx-auto"
                >
                  <Shield size={11} />
                  Administrator access
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

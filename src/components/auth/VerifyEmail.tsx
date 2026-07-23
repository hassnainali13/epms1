import { useEffect, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, Shield } from "lucide-react";
import api from "../../lib/api";

interface VerifyEmailProps {
  email: string;
  onVerified: () => void;
  onBackToLogin: () => void;
  title?: string;
  subtitle?: string;
  initialSuccessMessage?: string;
  initialCountdown?: number;
  verifyButtonLabel?: string;
}

const OTP_LENGTH = 6;

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const normalized = message.toLowerCase();

  if (normalized.includes("expired")) {
    return "Verification code has expired.";
  }
  if (normalized.includes("invalid") || normalized.includes("otp")) {
    return "Invalid verification code.";
  }
  if (normalized.includes("network") || normalized.includes("request failed")) {
    return "Unable to verify email. Please try again.";
  }
  return "Unable to verify email. Please try again.";
}

export function VerifyEmail({
  email,
  onVerified,
  onBackToLogin,
  title = "Verify Your Email",
  subtitle = "Please verify your email to continue.",
  initialSuccessMessage,
  initialCountdown = 60,
  verifyButtonLabel = "Verify Email",
}: VerifyEmailProps) {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(initialSuccessMessage ?? "");
  const [countdown, setCountdown] = useState(initialCountdown);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    setSuccess(initialSuccessMessage ?? "");
  }, [initialSuccessMessage]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);
    setError("");
    setSuccess("");

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      if (otp[index]) {
        const previousOtp = [...otp];
        previousOtp[index] = "";
        setOtp(previousOtp);
        setError("");
        setSuccess("");
        inputRefs.current[index]?.focus();
        return;
      }

      if (index > 0) {
        const previousOtp = [...otp];
        previousOtp[index - 1] = "";
        setOtp(previousOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    const nextOtp = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, index) => {
      nextOtp[index] = digit;
    });
    setOtp(nextOtp);
    setError("");
    setSuccess("");
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter the full 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/verify-email", { email, otp: code });
      setSuccess("Email verified successfully.");
      window.setTimeout(() => onVerified(), 700);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/auth/resend-otp", { email });
      setSuccess(
        "Verification code sent successfully. Please check your email.",
      );
      setCountdown(60);
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0EA5E9]/10 text-[#0EA5E9]">
          <Shield size={18} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0EA5E9]">
            EPMS Security
          </p>
          <h3 className="text-xl font-semibold text-[#0F172A]">{title}</h3>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9]">
          <Mail size={20} />
        </div>
        <p className="text-sm text-[#64748B]">{subtitle}</p>
        <p className="mt-2 font-semibold text-[#0F172A]">{email}</p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mb-6 flex justify-center gap-2 sm:gap-3">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            className="h-12 w-11 rounded-xl border border-[#CBD5E1] bg-white text-center text-lg font-semibold text-[#0F172A] shadow-sm outline-none transition-all focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 sm:h-14 sm:w-12"
          />
        ))}
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={loading || otp.join("").length < OTP_LENGTH}
        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0EA5E9] px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0284C7] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <>
            {verifyButtonLabel}
            <ArrowRight size={15} />
          </>
        )}
      </button>

      <button
        type="button"
        onClick={handleResend}
        disabled={countdown > 0 || resending}
        className="flex w-full items-center justify-center rounded-xl border border-[#CBD5E1] bg-white px-4 py-3 text-sm font-semibold text-[#0F172A] transition-all hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {resending ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#0EA5E9]/30 border-t-[#0EA5E9]" />
            Sending...
          </div>
        ) : countdown > 0 ? (
          `Resend OTP in ${countdown}s`
        ) : (
          "Resend OTP"
        )}
      </button>

      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-[#64748B]">
        <CheckCircle2 size={16} className="text-[#0EA5E9]" />
        Secure verification for your EPMS account
      </div>

      <button
        type="button"
        onClick={onBackToLogin}
        className="mt-5 text-sm font-medium text-[#64748B] transition-colors hover:text-[#0F172A]"
      >
        Back to sign in
      </button>
    </div>
  );
}

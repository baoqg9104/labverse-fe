import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";

const EmailSent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  // Redirect to login if no email in route state
  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Resend verification email using backend API
  const handleResend = async () => {
    setResendLoading(true);
    setResendError("");
    setResendSuccess(false);
    try {
      const res = await api.post("/users/resend-verification", email);
      setResendSuccess(true);
      setResendError(res.data?.message || "");
      setCooldown(30);
    } catch (err: unknown) {
      // Type guard for axios error
      let code = "";
      if (typeof err === "object" && err && "response" in err) {
        const axiosErr = err as { response?: { data?: { code?: string } } };
        code = axiosErr.response?.data?.code || "";
      }
      if (code === "USER_NOT_FOUND") {
        setResendError("User not found.");
      } else if (code === "EMAIL_ALREADY_VERIFIED") {
        setResendError("Email is already verified.");
      } else if (code === "RESEND_VERIFICATION_ERROR") {
        setResendError("Server error. Please try again later.");
      } else {
        setResendError("Failed to resend. Please try again.");
      }
    } finally {
      setResendLoading(false);
    }
  };

  // Cooldown countdown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  return (
    <div className="mt-5 relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-lime-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_50%)]" />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg -mt-20 rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
          {/* Header icon */}
          <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-blue-400 shadow-xl ring-2 ring-lime-300/40">
            <svg
              viewBox="0 0 24 24"
              width="38"
              height="38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 2px 8px #88cc19)" }}
            >
              <rect
                x="3"
                y="6"
                width="18"
                height="14"
                rx="3"
                fill="url(#mailGradient)"
              />
              <path d="M21 7L12 13 3 7" stroke="#fff" strokeWidth="2" />
              <defs>
                <linearGradient
                  id="mailGradient"
                  x1="3"
                  y1="6"
                  x2="21"
                  y2="20"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#a3e635" />
                  <stop offset="0.5" stopColor="#facc15" />
                  <stop offset="1" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Title & subtitle */}
          <h1 className="text-center text-3xl font-semibold tracking-tight text-white">
            Check your inbox
          </h1>
          <p className="mt-2 text-center text-slate-300">
            We just sent a verification link to
          </p>

          {/* Email pill */}
          <div className="mt-3 flex justify-center">
            <div className="mx-auto inline-flex max-w-full items-center gap-2 truncate rounded-full bg-white/10 px-4 py-2 text-lime-300 ring-1 ring-white/15">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                className="text-lime-300"
              >
                <path
                  fill="currentColor"
                  d="M12 12.713l-11.99-8.46A1 1 0 011 3h22a1 1 0 01.99 1.253L12 12.713z"
                  opacity=".4"
                />
                <path
                  fill="currentColor"
                  d="M23 5.383l-11 7.77-11-7.77V19a2 2 0 002 2h18a2 2 0 002-2V5.383z"
                />
              </svg>
              <span className="truncate">{email || "your email address"}</span>
            </div>
          </div>

          {/* Tips */}
          <div className="flex flex-col items-center text-center">
            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="mt-0.5 inline-block size-1.5 rounded-full bg-lime-400"></span>
                  Open your inbox and look for our email.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="mt-0.5 inline-block size-1.5 rounded-full bg-lime-400"></span>
                  Check the Spam or Promotions folder if you don’t see it.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="mt-0.5 inline-block size-1.5 rounded-full bg-lime-400"></span>
                  Click the link inside to verify your account.
                </div>
              </li>
            </ul>
          </div>

          {/* Resend */}
          <button
            className={`cursor-pointer mt-7 w-full rounded-xl bg-gradient-to-r from-lime-400 via-teal-400 to-blue-400 px-6 py-3 font-semibold text-slate-900 shadow-lg transition duration-200 hover:brightness-130 focus:outline-none focus:ring-2 focus:ring-lime-300 disabled:opacity-60 disabled:cursor-not-allowed`}
            onClick={handleResend}
            disabled={resendLoading || cooldown > 0}
          >
            {resendLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" opacity=".25" />
                  <path d="M4 12a8 8 0 018-8" />
                </svg>
                Sending...
              </span>
            ) : cooldown > 0 ? (
              `Resend available in ${cooldown}s`
            ) : (
              "Resend verification email"
            )}
          </button>

          {/* Result messages */}
          {resendSuccess && (
            <p className="mt-3 text-center text-sm text-emerald-400">
              Verification email resent successfully.
            </p>
          )}
          {resendError && (
            <p className="mt-3 text-center text-sm text-rose-400">
              {resendError}
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmailSent;

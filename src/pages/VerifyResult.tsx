import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

const getQueryParams = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    status: params.get("status"),
    message: params.get("message"),
  };
};

const VerifyResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { status, message } = getQueryParams(location.search);
  //   const fromEmailSent = location.state?.fromEmailSent;

  //   useEffect(() => {
  //     if (!fromEmailSent) {
  //       navigate("/login", { replace: true });
  //     }
  //   }, [fromEmailSent, navigate]);

  const isSuccess = status === "success";
  const { t } = useTranslation();

  return (
    <div className="mt-5 relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-lime-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_50%)]" />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg -mt-20 rounded-3xl border border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)] text-center">
          {/* Header icon */}
          <div className={`mx-auto mb-6 flex size-14 items-center justify-center rounded-2xl shadow-xl ring-2 ${isSuccess ? "bg-gradient-to-br from-lime-400 to-blue-400 ring-lime-300/40" : "bg-gradient-to-br from-red-400 to-pink-400 ring-red-300/40"}`}>
            {isSuccess ? (
              <svg viewBox="0 0 24 24" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 8px #88cc19)" }}>
                <circle cx="12" cy="12" r="10" fill="#d9f99d" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 13l3 3 7-7" stroke="#65a30d" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 2px 8px #e11d48)" }}>
                <circle cx="12" cy="12" r="10" fill="#fee2e2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-6 6M9 9l6 6" stroke="#b91c1c" />
              </svg>
            )}
          </div>

          {/* Title & subtitle */}
          <h1 className={`text-center text-3xl font-semibold tracking-tight ${isSuccess ? "text-lime-300" : "text-rose-300"}`}>
            {isSuccess ? t('verify.successTitle') : t('verify.failureTitle')}
          </h1>
          <p className="mt-2 text-center text-slate-300">
            {message || (isSuccess ? t('verify.successDesc') : t('verify.failureDesc'))}
          </p>

          {/* Tips (only for success) */}
          {isSuccess && (
            <div className="flex flex-col items-center text-center">
              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="mt-0.5 inline-block size-1.5 rounded-full bg-lime-400"></span>
                        {t('verify.success.tipLogin')}
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="mt-0.5 inline-block size-1.5 rounded-full bg-lime-400"></span>
                        {t('verify.success.tipSupport')}
                  </div>
                </li>
              </ul>
            </div>
          )}

          {/* Action button */}
          <button
            className={`mt-7 w-full rounded-xl bg-gradient-to-r from-lime-400 via-teal-400 to-blue-400 px-6 py-3 font-semibold text-slate-900 shadow-lg transition duration-200 hover:brightness-130 focus:outline-none focus:ring-2 focus:ring-lime-300 ${!isSuccess ? "border-2 border-rose-300" : ""}`}
            onClick={() => navigate("/login")}
          >
            {t('verify.goToLogin')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default VerifyResult;

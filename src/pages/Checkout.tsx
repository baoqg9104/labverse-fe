import { useContext, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { toast } from "react-toastify";

const premiumFeatures = [
  "All Free tier content",
  "Unlimited lab access",
  "Downloadable resources",
  "Priority support",
];

export const Checkout = () => {
  const { user, isAuthLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  const isPremiumUser = useMemo(() => {
    const sub = (user?.subscription || "").toLowerCase();
    return sub.includes("premium") || sub === "pro" || sub === "paid";
  }, [user?.subscription]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate("/login", { replace: true, state: { from: "/checkout" } });
    }
  }, [isAuthLoading, user, navigate]);

  const onBackToPricing = () => navigate("/pricing");
  const onConfirm = () => {
    if (isPremiumUser) {
      toast.info("You already have Premium.");
      navigate("/profile");
      return;
    }
    // Placeholder for real payment initiation
    toast.success("Redirecting to payment...");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#f7f8fc] via-[#eef0fb] to-[#e3c6e6]">
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16">
        <button
          onClick={onBackToPricing}
          className="cursor-pointer inline-flex items-center gap-2 text-[#201958] hover:text-[#3b2fa1] font-medium mb-6"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Pricing
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Plan details */}
          <div className="lg:col-span-3 bg-white rounded-3xl shadow-xl p-7 border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-semibold text-[#1a144b]">
                  Premium
                </div>
                <p className="text-[#6b6a7d] mt-1">
                  Unlock all labs, downloads and priority support
                </p>
              </div>
              <span className="inline-flex items-center text-xs font-bold bg-[#3c3476] text-[#b6aaff] px-3 py-1 rounded-full">
                MOST POPULAR
              </span>
            </div>

            <div className="mt-6">
              <div className="text-4xl font-bold text-[#1a144b]">
                100.000đ{" "}
                <span className="text-base font-normal text-gray-500">
                  /month
                </span>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Billed monthly. Cancel anytime.
              </div>
            </div>

            <ul className="mt-6 space-y-3">
              {premiumFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-[#4e4c66]">
                  <span className="bg-[#e9e6f7] rounded-full p-1 flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 12 10" fill="none">
                      <path
                        d="M11.4191 1.83334L5.71498 9.57418C5.57894 9.75467 5.37609 9.87293 5.152 9.90239C4.92791 9.93185 4.70138 9.87004 4.52331 9.73084L0.449982 6.47418C0.0905364 6.18653 0.0323334 5.66195 0.319982 5.30251C0.60763 4.94306 1.1322 4.88486 1.49165 5.17251L4.88832 7.89001L10.0775 0.847509C10.2476 0.592168 10.5444 0.450995 10.8498 0.480041C11.1553 0.509086 11.4201 0.703651 11.5391 0.986486C11.6581 1.26932 11.612 1.59466 11.4191 1.83334Z"
                        fill="#6a5acd"
                      />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl bg-[#f6f7fe] border border-[#eceffd] p-4">
              <div className="text-sm font-semibold text-[#302b63] mb-1">
                What you’ll get
              </div>
              <ul className="text-sm text-[#514f6a] list-disc pl-5 space-y-1">
                <li>Access to all Premium labs</li>
                <li>Faster support response times</li>
                <li>Download and keep lab resources</li>
                <li>Support the platform development</li>
              </ul>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-[#221d4f] text-white rounded-3xl p-7 shadow-xl border-2 border-[#b6aaff]/60">
              <div className="text-lg font-semibold">Order Summary</div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">Premium plan</div>
                  <div className="text-sm text-gray-300">Monthly billing</div>
                </div>
                <div className="text-2xl font-bold">100.000đ</div>
              </div>
              <div className="mt-4 border-t border-white/10 pt-4 text-sm text-gray-300">
                Taxes included where applicable.
              </div>

              {isPremiumUser ? (
                <div className="mt-6 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-200 font-semibold text-center">
                  You already have Premium
                </div>
              ) : (
                <button
                  onClick={onConfirm}
                  className="cursor-pointer w-full mt-6 px-6 py-3 rounded-full bg-[#b6ff3c] text-[#201958] font-bold shadow-lg hover:bg-[#a0e636] transition text-lg"
                >
                  Subscribe now
                </button>
              )}

              <div className="mt-4 text-[11px] text-gray-300">
                By subscribing, you agree to our Terms of Service and Privacy
                Policy.
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              Need help?{" "}
              <a href="/contact" className="underline">
                Contact us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

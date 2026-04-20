"use client";

import { useState, useMemo } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconSparkles, IconCheck } from "@tabler/icons-react";
import { createOrder, verifyPayment, getToken } from "@/lib/api";
import { useRazorpay } from "@/hooks/useRazorpay";

type Props = {
  show: boolean;
  onClose: () => void;
  feature: string;
  limit: string;
  onUpgraded?: () => void;
};

export default function UpgradePrompt({ show, onClose, feature, limit, onUpgraded }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { openCheckout } = useRazorpay();

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ),
    []
  );

  const handleUpgrade = async (tier: "pro" | "unlimited") => {
    setLoading(tier);
    setError("");

    try {
      const token = await getToken();
      if (!token) {
        window.location.href = "/signin";
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const order = await createOrder(token, tier);

      openCheckout({
        keyId: order.key_id,
        orderId: order.order_id,
        amount: order.amount,
        currency: order.currency,
        tier,
        userName: user?.user_metadata?.full_name || "",
        userEmail: user?.email || "",
        onSuccess: async (response) => {
          try {
            const freshToken = await getToken();
            if (!freshToken) throw new Error("Session expired");
            await verifyPayment(freshToken, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              tier,
            });
            onUpgraded?.();
            onClose();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Verification failed");
          }
          setLoading(null);
        },
        onError: () => {
          setLoading(null);
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70]"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed z-[71] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-[16px] p-6"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.15)",
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-1 rounded-[6px] hover:bg-[var(--surface)] transition-colors"
              style={{ color: "var(--muted)" }}
            >
              <IconX size={16} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center"
                style={{ background: "rgba(0,153,153,0.1)", color: "var(--teal)" }}
              >
                <IconSparkles size={16} />
              </div>
              <h3
                className="text-base font-semibold text-[var(--text)]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                Upgrade your plan
              </h3>
            </div>

            <p
              className="text-sm text-[var(--muted2)] mb-1"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              You&apos;ve reached your free {feature} limit.
            </p>
            <p
              className="text-xs text-[var(--muted)] mb-5"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              Free plan: {limit}. Choose a plan below to continue.
            </p>

            {error && (
              <p className="text-xs text-red-500 mb-3" style={{ fontFamily: "var(--font-dm-sans)" }}>
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Pro */}
              <button
                onClick={() => handleUpgrade("pro")}
                disabled={!!loading}
                className="p-4 rounded-[12px] text-left transition-all hover:brightness-105 disabled:opacity-60"
                style={{
                  background: "var(--surface)",
                  border: "2px solid var(--teal)",
                }}
              >
                <p className="text-sm font-semibold text-[var(--text)] mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
                  Pro
                </p>
                <p className="text-lg font-bold text-[var(--teal)]" style={{ fontFamily: "var(--font-display)" }}>
                  ₹299<span className="text-xs font-normal text-[var(--muted)]">/mo</span>
                </p>
                <div className="mt-2 space-y-1">
                  {["100 tailors/mo", "100 covers/mo", "100 applies/mo", "Priority matching"].map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[0.65rem] text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      <IconCheck size={10} style={{ color: "#009999" }} />
                      {f}
                    </div>
                  ))}
                </div>
                <div
                  className="mt-3 w-full py-1.5 rounded-[8px] text-xs font-medium text-white text-center"
                  style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
                >
                  {loading === "pro" ? "Processing..." : "Choose Pro"}
                </div>
              </button>

              {/* Unlimited */}
              <button
                onClick={() => handleUpgrade("unlimited")}
                disabled={!!loading}
                className="p-4 rounded-[12px] text-left transition-all hover:brightness-105 disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, rgba(0,153,153,0.06), rgba(0,153,153,0.02))",
                  border: "2px solid rgba(0,153,153,0.3)",
                }}
              >
                <p className="text-sm font-semibold text-[var(--text)] mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
                  Unlimited
                </p>
                <p className="text-lg font-bold text-[var(--teal)]" style={{ fontFamily: "var(--font-display)" }}>
                  ₹499<span className="text-xs font-normal text-[var(--muted)]">/mo</span>
                </p>
                <div className="mt-2 space-y-1">
                  {["Unlimited everything", "AI customisation", "Priority support", "Interview prep"].map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-[0.65rem] text-[var(--muted2)]" style={{ fontFamily: "var(--font-dm-sans)" }}>
                      <IconCheck size={10} style={{ color: "#009999" }} />
                      {f}
                    </div>
                  ))}
                </div>
                <div
                  className="mt-3 w-full py-1.5 rounded-[8px] text-xs font-medium text-white text-center"
                  style={{ background: "linear-gradient(135deg, #009999, #33b3b3)", fontFamily: "var(--font-dm-sans)" }}
                >
                  {loading === "unlimited" ? "Processing..." : "Choose Unlimited"}
                </div>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full text-center py-2 text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
              style={{ fontFamily: "var(--font-dm-sans)" }}
            >
              Maybe later
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

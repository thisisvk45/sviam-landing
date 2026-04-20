"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { IconX, IconSparkles } from "@tabler/icons-react";

type Props = {
  show: boolean;
  onClose: () => void;
  feature: string;
  limit: string;
};

export default function UpgradePrompt({ show, onClose, feature, limit }: Props) {
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
            className="fixed z-[71] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-[16px] p-6"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
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
                style={{ background: "rgba(99,102,241,0.1)", color: "var(--teal)" }}
              >
                <IconSparkles size={16} />
              </div>
              <h3
                className="text-base font-semibold text-[var(--text)]"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
              >
                Upgrade to Pro
              </h3>
            </div>

            <p
              className="text-sm text-[var(--muted2)] mb-1"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              You have reached your free {feature} limit.
            </p>
            <p
              className="text-xs text-[var(--muted)] mb-5"
              style={{ fontFamily: "var(--font-dm-sans)", fontWeight: 300 }}
            >
              Free plan: {limit}. Upgrade for unlimited access.
            </p>

            <div className="space-y-2">
              <Link
                href="/pricing"
                className="block w-full text-center py-2.5 rounded-[10px] text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ background: "var(--teal)", fontFamily: "var(--font-dm-sans)" }}
              >
                View Plans — from ₹499/mo
              </Link>
              <button
                onClick={onClose}
                className="w-full text-center py-2 text-xs text-[var(--muted2)] hover:text-[var(--text)] transition-colors"
                style={{ fontFamily: "var(--font-dm-sans)" }}
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

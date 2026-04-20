"use client";

import { useCallback, useEffect, useRef } from "react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: Record<string, string>) => void) => void;
    };
  }
}

export function useRazorpay() {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current || typeof window === "undefined") return;
    if (document.querySelector('script[src*="checkout.razorpay.com"]')) {
      loaded.current = true;
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => { loaded.current = true; };
    document.body.appendChild(script);
  }, []);

  const openCheckout = useCallback(
    ({
      keyId,
      orderId,
      amount,
      currency,
      tier,
      userName,
      userEmail,
      onSuccess,
      onError,
    }: {
      keyId: string;
      orderId: string;
      amount: number;
      currency: string;
      tier: string;
      userName?: string;
      userEmail?: string;
      onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
      onError?: (error: { code: string; description: string }) => void;
    }) => {
      if (!window.Razorpay) {
        onError?.({ code: "SCRIPT_NOT_LOADED", description: "Payment gateway is loading. Please try again." });
        return;
      }

      const tierLabel = tier === "pro" ? "Pro" : "Unlimited";

      const options = {
        key: keyId,
        amount,
        currency,
        name: "SViam",
        description: `SViam ${tierLabel} — Monthly`,
        order_id: orderId,
        handler: onSuccess,
        prefill: {
          name: userName || "",
          email: userEmail || "",
        },
        theme: {
          color: "#009999",
        },
        modal: {
          ondismiss: () => {
            onError?.({ code: "MODAL_CLOSED", description: "Payment cancelled" });
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    []
  );

  return { openCheckout };
}

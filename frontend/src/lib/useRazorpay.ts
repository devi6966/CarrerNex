"use client";

import { useState } from "react";
import { upgradeUserToPro } from "./userStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://carrernex.onrender.com";

interface CheckoutOptions {
  userEmail?: string | null;
  userName?: string | null;
  amount?: number;
  planName?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (err: string) => void;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn("Razorpay SDK failed to load, sandbox fallback will be used.");
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

export function useRazorpay() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPayment = async ({
    userEmail = "student@careernex.ai",
    userName = "Candidate",
    amount = 99,
    planName = "CareerNex Pro Accelerator",
    onSuccess,
    onError,
  }: CheckoutOptions) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create order from backend
      const res = await fetch(`${API_URL}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "pro",
          amount: amount,
          currency: "INR",
          user_email: userEmail,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to initialize payment order.");
      }

      const orderData = await res.json();
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && window.Razorpay) {
        // 2. Open standard Razorpay Checkout Modal
        const options = {
          key: orderData.key_id,
          amount: orderData.amount, // in paise (9900)
          currency: orderData.currency || "INR",
          name: "CareerNex",
          description: planName,
          image: "/logo.jpg",
          order_id: orderData.order_id,
          prefill: {
            name: userName || "Candidate",
            email: userEmail || "student@careernex.ai",
            contact: "9999999999",
          },
          notes: {
            plan: "pro_accelerator_lifetime",
          },
          theme: {
            color: "#2563eb",
          },
          handler: async function (response: any) {
            try {
              // 3. Verify payment with backend
              const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id || orderData.order_id,
                  razorpay_signature: response.razorpay_signature || "sandbox_simulated_signature",
                  user_email: userEmail,
                }),
              });

              if (!verifyRes.ok) {
                throw new Error("Payment signature verification failed.");
              }

              const verifyData = await verifyRes.json();
              upgradeUserToPro(userEmail, verifyData.payment_id);

              if (onSuccess) {
                onSuccess(verifyData.payment_id);
              }
            } catch (err: any) {
              console.error("Verification error:", err);
              if (onError) onError(err.message || "Payment verification failed.");
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response: any) {
          setLoading(false);
          const failMsg = response.error?.description || "Payment failed. Please try again.";
          setError(failMsg);
          if (onError) onError(failMsg);
        });
        rzp.open();
      } else {
        // Instant Sandbox Simulator (if Razorpay script is blocked by ad-blocker or in offline dev)
        const mockPaymentId = `pay_test_${Date.now()}`;
        const verifyRes = await fetch(`${API_URL}/api/payment/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: mockPaymentId,
            razorpay_order_id: orderData.order_id,
            razorpay_signature: "sandbox_simulated_signature",
            user_email: userEmail,
          }),
        });

        if (verifyRes.ok) {
          upgradeUserToPro(userEmail, mockPaymentId);
          if (onSuccess) onSuccess(mockPaymentId);
        } else {
          throw new Error("Sandbox payment verification failed.");
        }
        setLoading(false);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      const msg = err.message || "Unable to initiate payment.";
      setError(msg);
      if (onError) onError(msg);
      setLoading(false);
    }
  };

  return {
    startPayment,
    loading,
    error,
  };
}

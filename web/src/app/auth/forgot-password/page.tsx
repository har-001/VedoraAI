"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Forgot Password — VedoraAI";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await api.forgotPassword(email);
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-up" style={{ animationFillMode: "forwards" }}>
      {/* Logo — visible only on mobile/tablet */}
      <Link href="/" className="flex lg:hidden items-center gap-2 justify-center mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}
        >
          V
        </div>
        <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
          Vedora<span style={{ color: "var(--primary-light)" }}>AI</span>
        </span>
      </Link>

      {/* Card */}
      <div className="glass-card p-8 sm:p-10 shadow-2xl relative overflow-hidden" style={{ background: "#13173d", borderColor: "rgba(255, 255, 255, 0.08)" }}>
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-[#6C5CE7] rounded-full filter blur-[80px] opacity-15 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-[#00D2FF] rounded-full filter blur-[80px] opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                Check Your Email
              </h1>
              <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
                If an account exists with <strong>{email}</strong>, we&apos;ve sent a reset code.
              </p>
              <Link href="/auth/login" className="btn btn-primary btn-full">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                  Reset Password
                </h1>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Enter your email and we&apos;ll send you a reset code
                </p>
              </div>

              {error && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{ background: "var(--bearish-bg)", color: "var(--bearish)" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="cut-input-group">
                  <input
                    id="forgot-email"
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <label htmlFor="forgot-email" className="input-label">Email</label>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full mt-2"
                  disabled={loading}
                  id="forgot-submit"
                >
                  {loading ? "Sending..." : "Send Reset Code"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
        Remember your password?{" "}
        <Link href="/auth/login" className="font-semibold" style={{ color: "var(--primary-light)" }}>
          Sign In
        </Link>
      </p>
    </div>
  );
}

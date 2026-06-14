"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Login — VedoraAI";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await api.login(email, password);
      if (result.ok) {
        api.setToken(result.data.access_token);
        localStorage.setItem("vedora_refresh_token", result.data.refresh_token);
        localStorage.setItem("vedora_user", JSON.stringify(result.data.user));
        router.push("/dashboard");
      } else {
        setError(result.error || "Invalid email or password");
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
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              Welcome Back
            </h1>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Sign in to access your AI intelligence dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              className="p-3 rounded-lg text-sm"
              style={{ background: "var(--bearish-bg)", color: "var(--bearish)", border: "1px solid rgba(255, 82, 82, 0.2)" }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4.5">
            <div className="cut-input-group">
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <label htmlFor="login-email" className="input-label">Email</label>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="cut-input-group relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  style={{ paddingRight: 56 }}
                />
                <label htmlFor="login-password" className="input-label">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary-light hover:text-secondary transition-colors"
                  style={{ background: "transparent", border: "none", outline: "none" }}
                  tabIndex={-1}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-medium hover:underline transition-all"
                  style={{ color: "var(--primary-light)" }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full mt-2"
              disabled={loading}
              id="login-submit"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">or continue with</div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-3">
            <button className="btn btn-secondary btn-sm" id="login-google">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button className="btn btn-secondary btn-sm" id="login-apple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Apple
            </button>
          </div>

          {/* Phone OTP */}
          <button className="btn btn-ghost btn-full text-sm" id="login-phone-otp">
            📱 Sign in with Phone OTP
          </button>
        </div>
      </div>

      {/* Register Link */}
      <p className="text-center mt-6 text-sm" style={{ color: "var(--text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="font-semibold" style={{ color: "var(--primary-light)" }}>
          Create Account
        </Link>
      </p>
    </div>
  );
}

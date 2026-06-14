import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — VedoraAI",
  description: "Sign in to VedoraAI to access AI-powered market intelligence, predictions, and insights.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="h-screen flex relative overflow-hidden"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Left Panel — Branding ────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between relative overflow-hidden"
        style={{
          width: "45%",
          background: "linear-gradient(135deg, rgba(108, 92, 231, 0.12) 0%, rgba(0, 210, 255, 0.08) 100%)",
          borderRight: "1px solid var(--border)",
          padding: "48px 40px",
        }}
      >
        {/* Background orbs */}
        <div className="bg-orb bg-orb-primary" style={{ width: 400, height: 400, top: -100, left: -100 }} />
        <div className="bg-orb bg-orb-secondary" style={{ width: 300, height: 300, bottom: -50, right: -80 }} />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}
            >
              V
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Vedora<span style={{ color: "var(--primary-light)" }}>AI</span>
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h2
            className="text-3xl font-bold mb-3 leading-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Intelligence Behind
            <br />
            <span className="gradient-text">Every Decision</span>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            AI-powered market predictions, risk analysis, and research to help you make smarter decisions.
          </p>

          {/* Mini stats */}
          <div className="flex gap-6 mt-6">
            {[
              { value: "82%", label: "AI Accuracy" },
              { value: "500+", label: "Assets" },
              { value: "50+", label: "Indicators" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-lg font-bold gradient-text" style={{ fontFamily: "var(--font-heading)" }}>
                  {s.value}
                </div>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs" style={{ color: "var(--text-muted)" }}>
          © 2025 VedoraAI · Not financial advice
        </div>
      </div>

      {/* ── Right Panel — Form ───────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="min-h-full w-full flex flex-col justify-center items-center py-8 px-4">
          <div className="w-full max-w-[460px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

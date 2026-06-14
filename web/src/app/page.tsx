"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/* ─── Animated Counter ────────────────────────────── */
function AnimatedNumber({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
}

/* ─── Feature Card ────────────────────────────────── */
function FeatureCard({ icon, title, description, delay }: { icon: string; title: string; description: string; delay: number }) {
  return (
    <div
      className="glass-card p-6 opacity-0 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {description}
      </p>
    </div>
  );
}

/* ─── Prediction Preview Card ─────────────────────── */
function PredictionPreview() {
  return (
    <div className="glass-card p-6 max-w-md mx-auto opacity-0 animate-fade-in-up" style={{ animationDelay: "600ms", animationFillMode: "forwards" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>AI PREDICTION</div>
          <div className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Reliance Industries</div>
        </div>
        <span className="badge badge-bullish">Bullish</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 rounded-lg" style={{ background: "var(--surface)" }}>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Confidence</div>
          <div className="text-lg font-bold" style={{ color: "var(--bullish)" }}>82%</div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "var(--surface)" }}>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Risk</div>
          <div className="text-lg font-bold" style={{ color: "var(--neutral-color)" }}>Moderate</div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "var(--surface)" }}>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Target Range</div>
          <div className="text-lg font-bold">₹1,550 - ₹1,620</div>
        </div>
        <div className="p-3 rounded-lg" style={{ background: "var(--surface)" }}>
          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>Upside</div>
          <div className="text-lg font-bold" style={{ color: "var(--bullish)" }}>+3% to +8%</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["Strong Momentum", "Volume Expansion", "Positive Sentiment"].map((tag) => (
          <span key={tag} className="badge badge-primary text-xs">{tag}</span>
        ))}
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          ⚠️ This is an AI-generated probabilistic estimate, not financial advice.
        </div>
      </div>
    </div>
  );
}

/* ─── Navbar ──────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10, 14, 39, 0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        padding: scrolled ? "12px 0" : "20px 0",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}
          >
            V
          </div>
          <span className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Vedora<span style={{ color: "var(--primary-light)" }}>AI</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {["Features", "Predictions", "Learning", "Pricing"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium hover:text-white transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              {item}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn btn-ghost btn-sm">
            Login
          </Link>
          <Link href="/auth/register" className="btn btn-primary btn-sm">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Main Page ───────────────────────────────────── */
export default function HomePage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <Navbar />

      {/* ── Hero Section ───────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background orbs */}
        <div className="bg-orb bg-orb-primary" style={{ width: 600, height: 600, top: -200, right: -200 }} />
        <div className="bg-orb bg-orb-secondary" style={{ width: 400, height: 400, bottom: -100, left: -100 }} />
        <div className="bg-orb bg-orb-accent" style={{ width: 300, height: 300, top: "40%", left: "50%" }} />

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto pt-24">
          <div className="opacity-0 animate-fade-in-up" style={{ animationFillMode: "forwards" }}>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
              style={{
                background: "rgba(108, 92, 231, 0.15)",
                border: "1px solid rgba(108, 92, 231, 0.3)",
                color: "var(--primary-light)",
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--bullish)" }} />
              AI-Powered Market Intelligence
            </div>
          </div>

          <h1
            className="text-5xl md:text-7xl font-bold mb-6 opacity-0 animate-fade-in-up"
            style={{ fontFamily: "var(--font-heading)", animationDelay: "150ms", animationFillMode: "forwards" }}
          >
            Intelligence Behind
            <br />
            <span className="gradient-text">Every Decision</span>
          </h1>

          <p
            className="text-lg md:text-xl max-w-2xl mx-auto mb-10 opacity-0 animate-fade-in-up"
            style={{ color: "var(--text-secondary)", animationDelay: "300ms", animationFillMode: "forwards" }}
          >
            AI predictions, risk analysis, market research, and decision support —
            all powered by cutting-edge machine learning to help you understand
            markets like never before.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16 opacity-0 animate-fade-in-up"
            style={{ animationDelay: "450ms", animationFillMode: "forwards" }}
          >
            <Link href="/auth/register" className="btn btn-primary btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Start For Free
            </Link>
            <a href="#features" className="btn btn-secondary btn-lg">
              Explore Features
            </a>
          </div>

          {/* Live Preview Card */}
          <PredictionPreview />
        </div>
      </section>

      {/* ── Stats Section ──────────────────────── */}
      <section className="py-16 px-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: 500, suffix: "+", label: "Assets Analyzed" },
            { value: 82, suffix: "%", label: "Prediction Accuracy" },
            { value: 10000, suffix: "+", label: "AI Predictions Daily" },
            { value: 50, suffix: "+", label: "Technical Indicators" },
          ].map((stat) => (
            <div key={stat.label} className="stat-card text-center">
              <div className="text-3xl md:text-4xl font-bold gradient-text mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ───────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              Powerful <span className="gradient-text">AI Features</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              Everything you need to understand markets, manage risk, and make informed decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="🤖"
              title="AI Predictions"
              description="Multi-model ensemble predictions with confidence scores, risk ratings, and detailed explanations for every asset."
              delay={100}
            />
            <FeatureCard
              icon="📊"
              title="Market Scanner"
              description="Real-time scanning for breakouts, reversals, momentum shifts, and AI-detected opportunities across all markets."
              delay={200}
            />
            <FeatureCard
              icon="🧠"
              title="AI Market Coach"
              description="Your personal AI mentor that explains markets, indicators, and predictions in beginner-friendly language."
              delay={300}
            />
            <FeatureCard
              icon="⚡"
              title="Strategy Builder"
              description="Build custom strategies with our no-code drag-and-drop builder or advanced Python editor."
              delay={400}
            />
            <FeatureCard
              icon="📰"
              title="News Intelligence"
              description="AI-powered news analysis with sentiment scoring, impact ratings, and opportunity detection."
              delay={500}
            />
            <FeatureCard
              icon="🎯"
              title="Risk Analysis"
              description="Comprehensive risk scoring, probability distributions, and scenario analysis for every prediction."
              delay={600}
            />
            <FeatureCard
              icon="📈"
              title="Backtesting Lab"
              description="Test strategies against historical data with Monte Carlo simulation, slippage modeling, and walk-forward analysis."
              delay={700}
            />
            <FeatureCard
              icon="🎓"
              title="Learning Hub"
              description="Interactive courses, quizzes, certifications, and AI-guided learning paths from beginner to advanced."
              delay={800}
            />
            <FeatureCard
              icon="🌐"
              title="Community"
              description="Share strategies, discuss markets, participate in challenges, and learn from the VedoraAI community."
              delay={900}
            />
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────── */}
      <section className="py-20 px-6" style={{ background: "var(--surface)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-heading)" }}>
              How <span className="gradient-text">VedoraAI</span> Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Data Collection",
                description: "We analyze price action, volume, news, sentiment, economic events, and 50+ technical indicators in real-time.",
                color: "var(--primary)",
              },
              {
                step: "02",
                title: "AI Analysis",
                description: "Our ensemble of LSTM, Transformer, and XGBoost models process the data to generate predictions with confidence scores.",
                color: "var(--secondary)",
              },
              {
                step: "03",
                title: "Actionable Insights",
                description: "You receive clear predictions with risk scores, explanations, alternative scenarios, and profitability estimates.",
                color: "var(--accent)",
              },
            ].map((item) => (
              <div key={item.step} className="text-center p-8">
                <div
                  className="text-6xl font-bold mb-4"
                  style={{ fontFamily: "var(--font-heading)", color: item.color, opacity: 0.3 }}
                >
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="bg-orb bg-orb-primary" style={{ width: 400, height: 400, top: -100, right: -100 }} />
        <div className="bg-orb bg-orb-secondary" style={{ width: 300, height: 300, bottom: -50, left: "30%" }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6" style={{ fontFamily: "var(--font-heading)" }}>
            Ready to Make <span className="gradient-text">Smarter Decisions</span>?
          </h2>
          <p className="text-lg mb-10" style={{ color: "var(--text-secondary)" }}>
            Join thousands of users who trust VedoraAI for market intelligence,
            AI predictions, and research. Start for free — no credit card required.
          </p>
          <Link href="/auth/register" className="btn btn-primary btn-lg">
            Get Started For Free
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="py-12 px-6" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}
                >
                  V
                </div>
                <span className="font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                  VedoraAI
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                Intelligence Behind Every Decision
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Platform</h4>
              <div className="flex flex-col gap-2">
                {["Features", "Predictions", "Scanner", "Strategies"].map((item) => (
                  <a key={item} href="#" className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Learn</h4>
              <div className="flex flex-col gap-2">
                {["Courses", "Blog", "Glossary", "Documentation"].map((item) => (
                  <a key={item} href="#" className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <div className="flex flex-col gap-2">
                {["About", "Privacy", "Terms", "Contact"].map((item) => (
                  <a key={item} href="#" className="text-sm" style={{ color: "var(--text-tertiary)" }}>
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              © 2025 VedoraAI. All rights reserved. Not a financial advisor. All predictions are probabilistic estimates.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Made with 🤖 AI
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

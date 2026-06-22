"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useLanguage } from "../languageContext";

export default function UpgradePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [progressMsg, setProgressMsg] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = "Upgrade to Pro — VedoraAI";
  }, []);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    // Format card number with spaces every 4 digits
    const formatted = val.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 3) {
      setCardExpiry(`${val.slice(0, 2)}/${val.slice(2)}`);
    } else {
      setCardExpiry(val);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      alert("Please fill in all card credentials.");
      return;
    }

    try {
      setLoading(true);
      
      // Step-by-step progress simulation for premium UX
      setProgressMsg("Connecting to payment gateway...");
      await new Promise((r) => setTimeout(r, 800));
      setProgressMsg("Authorizing secure 3D Secure credentials...");
      await new Promise((r) => setTimeout(r, 1000));
      setProgressMsg("Updating account privileges...");

      // Hit API to perform upgrade in database
      const res = await api.post<any>("/users/me/upgrade");
      
      if (res.ok && res.data) {
        // Update stored local user settings
        const stored = localStorage.getItem("vedora_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.subscription_tier = "pro";
            localStorage.setItem("vedora_user", JSON.stringify(parsed));
          } catch (e) {
            console.error(e);
          }
        }
        
        setSuccess(true);
        await new Promise((r) => setTimeout(r, 1200));
        router.push("/dashboard");
      } else {
        alert(res.error || "Payment failed. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Billing server error. Is backend active?");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 64,
          animation: "scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          marginBottom: 16
        }}>
          🎉
        </div>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: 24, fontWeight: 800, color: "var(--bullish)", marginBottom: 8 }}>
          Welcome to Pro Tier!
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 400, margin: "0 auto 0 auto" }}>
          Your payment authorized successfully. All premium features, unlimited alerts, and strategy lab extensions are now unlocked. Redirecting...
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      <div className="dash-welcome" style={{ marginBottom: 30, textAlign: "center" }}>
        <h1 className="dash-welcome-title">⚡ Unlock VedoraAI Pro</h1>
        <p className="dash-welcome-sub">Power up your market analysis with professional predictive models and scanner signals</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 24 }}>
        
        {/* Features list & Pricing plan selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Features Comparison */}
          <div className="dash-panel">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Premium Benefits</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { title: "Unlimited Active Alerts", desc: "Set as many price target and scanner triggers as you need (Free is capped at 3)." },
                { title: "Advanced Backtester Periods", desc: "Simulate trading strategies over 1-year and 2-year ranges to gauge long-term performance." },
                { title: "Exclusive Scanner Signals", desc: "Unlock scanners for Golden Cross and Death Cross breakouts to capture major macro shifts." },
                { title: "Data Export Capabilities", desc: "Download backtest transactions log and equity curves directly for offline charting." },
                { title: "Priority AI Support & Prompts", desc: "Ask AI Coach complex multi-stage financial calculations with faster response limits." }
              ].map((feat, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, color: "var(--primary-light)", lineHeight: "1" }}>✓</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{feat.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Toggle */}
          <div className="dash-panel">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Billing Plan</h3>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setBillingCycle("monthly")}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: `2px solid ${billingCycle === "monthly" ? "var(--primary)" : "var(--border)"}`,
                  background: billingCycle === "monthly" ? "rgba(108,92,231,0.06)" : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Monthly</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>₹999 / mo</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>Cancel anytime</div>
              </button>

              <button
                onClick={() => setBillingCycle("annual")}
                style={{
                  flex: 1,
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: `2px solid ${billingCycle === "annual" ? "var(--primary)" : "var(--border)"}`,
                  background: billingCycle === "annual" ? "rgba(108,92,231,0.06)" : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  position: "relative"
                }}
              >
                <span style={{
                  position: "absolute",
                  top: -10,
                  right: 12,
                  background: "var(--primary)",
                  color: "white",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                  textTransform: "uppercase"
                }}>
                  Save 30%
                </span>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Annual</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", marginTop: 4 }}>₹8,399 / yr</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>Equivalent to ₹699/mo</div>
              </button>
            </div>
          </div>
        </div>

        {/* Stripe Credit Card Simulated Checkout Panel */}
        <div>
          <div className="dash-panel" style={{ position: "sticky", top: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18 }}>Checkout Summary</h3>

            {loading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ animation: "pulse-glow 1.5s ease-in-out infinite", fontSize: 36, marginBottom: 12 }}>💳</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{progressMsg}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 6 }}>Please do not close this page</div>
              </div>
            ) : (
              <form onSubmit={handleUpgrade} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  marginBottom: 6
                }}>
                  <span style={{ color: "var(--text-secondary)" }}>Plan Selected</span>
                  <strong style={{ color: "var(--text-primary)" }}>
                    Pro {billingCycle === "monthly" ? "Monthly" : "Annual"}
                  </strong>
                </div>

                <div className="cut-input-group">
                  <input
                    type="text"
                    className="input"
                    id="card-name"
                    placeholder=" "
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                  <label htmlFor="card-name" className="input-label">Cardholder Name</label>
                </div>

                <div className="cut-input-group">
                  <input
                    type="text"
                    className="input"
                    id="card-number"
                    placeholder=" "
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    required
                  />
                  <label htmlFor="card-number" className="input-label">Card Number</label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
                  <div className="cut-input-group">
                    <input
                      type="text"
                      className="input"
                      id="card-expiry"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      required
                    />
                    <label htmlFor="card-expiry" className="input-label">Expiry Date</label>
                  </div>
                  <div className="cut-input-group">
                    <input
                      type="password"
                      className="input"
                      id="card-cvc"
                      placeholder=" "
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      required
                    />
                    <label htmlFor="card-cvc" className="input-label">CVC</label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 700, marginTop: 12 }}
                >
                  Pay ₹{billingCycle === "monthly" ? "999" : "8,399"} & Upgrade
                </button>

                <div style={{ textAlign: "center", fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
                  🔒 Secure transaction encrypted with AES-256 standard protocols.
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

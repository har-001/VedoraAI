import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VedoraAI — Intelligence Behind Every Decision",
  description:
    "AI-Powered Market Intelligence Platform. Get AI predictions, risk analysis, market insights, and decision support for smarter investing.",
  keywords: [
    "AI trading",
    "market intelligence",
    "stock predictions",
    "risk analysis",
    "market research",
    "VedoraAI",
  ],
  authors: [{ name: "VedoraAI" }],
  openGraph: {
    title: "VedoraAI — Intelligence Behind Every Decision",
    description:
      "AI-Powered Market Intelligence, Prediction & Research Platform",
    type: "website",
    locale: "en_IN",
    siteName: "VedoraAI",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

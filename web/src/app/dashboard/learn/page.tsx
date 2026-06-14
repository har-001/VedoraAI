"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Lesson {
  id: number;
  title: string;
  duration: string;
  content: string[];
  quiz: QuizQuestion;
}

interface Course {
  id: number;
  title: string;
  emoji: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  lessons: Lesson[];
}

const COURSES_DATA: Course[] = [
  {
    id: 1,
    title: "Stock Market Basics",
    emoji: "📈",
    level: "Beginner",
    description: "Learn the fundamentals of stock markets, how exchanges work, and basic terminology.",
    lessons: [
      {
        id: 1,
        title: "Understanding Stock Exchanges",
        duration: "10 mins",
        content: [
          "A stock exchange is a centralized marketplace where buyers and sellers meet to trade shares of publicly held companies. In India, the two primary exchanges are the National Stock Exchange (NSE) and the Bombay Stock Exchange (BSE).",
          "Every stock has two primary prices at any given moment: the Bid (the highest price a buyer is willing to pay) and the Ask (the lowest price a seller is willing to accept).",
          "The difference between these two prices is called the Bid-Ask Spread. A smaller spread indicates high liquidity, meaning the asset can be bought or sold quickly without significant price movement.",
        ],
        quiz: {
          question: "Which of the following represents the price a buyer is willing to pay?",
          options: ["Ask Price", "Bid Price", "Spread Price", "Market Margin"],
          correctAnswer: 1,
          explanation: "The 'Bid' represents the buyer's bid (what they are willing to pay), whereas the 'Ask' is the seller's asking price.",
        },
      },
      {
        id: 2,
        title: "What is a Candlestick?",
        duration: "15 mins",
        content: [
          "Candlestick charts are the foundation of technical analysis. Each candlestick represents price action over a specific period (e.g., 1 minute, 1 hour, or 1 day).",
          "A candle consists of a Body (the rectangular part showing Open and Close prices) and Shadows/Wicks (the thin lines showing High and Low prices reached during the period).",
          "If the closing price is higher than the opening price, the candle is typically colored Green (Bullish). If the closing price is lower, the candle is Red (Bearish).",
        ],
        quiz: {
          question: "If a daily candlestick has a close price below its open price, what color is it typically?",
          options: ["Green", "Blue", "Red", "Yellow"],
          correctAnswer: 2,
          explanation: "A candle closing lower than it opened represents a net price drop, represented in red (bearish).",
        },
      },
    ],
  },
  {
    id: 2,
    title: "Technical Analysis 101",
    emoji: "📊",
    level: "Intermediate",
    description: "Master candlestick charts, support/resistance, trend lines, and common patterns.",
    lessons: [
      {
        id: 1,
        title: "Support & Resistance",
        duration: "15 mins",
        content: [
          "Support and Resistance represent key price levels where buying or selling interest historically increases, acting as psychological barriers.",
          "Support is a 'floor' where buying pressure overcomes selling pressure, causing price declines to pause and rebound.",
          "Resistance is a 'ceiling' where selling pressure overcomes buying pressure, stopping price advances. When a resistance level is broken, it historically becomes a new support level.",
        ],
        quiz: {
          question: "What typically happens when the price breaks decisively above a major resistance level?",
          options: [
            "It immediately drops to zero",
            "The old resistance becomes a new support level",
            "Support becomes resistance",
            "Volume drops to absolute minimum",
          ],
          correctAnswer: 1,
          explanation: "Once a resistance ceiling is broken, it commonly acts as a new support floor due to change in trader psychology.",
        },
      },
      {
        id: 2,
        title: "RSI Momentum Indicator",
        duration: "12 mins",
        content: [
          "The Relative Strength Index (RSI) is a momentum oscillator that measures the speed and change of price movements on a scale of 0 to 100.",
          "Typically, an RSI reading above 70 indicates that a stock is Overbought (potentially overvalued and due for a pullback or consolidation).",
          "Conversely, an RSI reading below 30 suggests the stock is Oversold (potentially undervalued and due for a bullish rebound).",
        ],
        quiz: {
          question: "An RSI reading of 22 typically indicates that the asset is:",
          options: ["Overbought", "Neutral", "Oversold", "Highly Volatile"],
          correctAnswer: 2,
          explanation: "RSI values below 30 are standard thresholds for 'Oversold' conditions.",
        },
      },
    ],
  },
  {
    id: 3,
    title: "Risk Management Strategies",
    emoji: "🛡️",
    level: "Intermediate",
    description: "Learn position sizing, stop-loss strategies, and portfolio risk management.",
    lessons: [
      {
        id: 1,
        title: "Stop-Loss Orders",
        duration: "10 mins",
        content: [
          "A stop-loss order is a pre-calculated instructions sent to a broker to sell an asset if its price falls to a specific threshold, limiting potential losses.",
          "Professional risk managers advocate the 1% Rule: never risk more than 1% of your total trading capital on any single trade.",
          "Stop-losses preserve capital during unexpected adverse market events, ensuring no single bad trade wipes out your portfolio.",
        ],
        quiz: {
          question: "What is the primary objective of placing a stop-loss order?",
          options: [
            "To guarantee a trade will make a profit",
            "To limit the maximum loss on a trade",
            "To execute trades faster",
            "To buy shares at a lower price",
          ],
          correctAnswer: 1,
          explanation: "A stop-loss exists solely to cap risk and limit the maximum drawdown on a specific position.",
        },
      },
    ],
  },
];

export default function LearnPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    document.title = "Learning Hub — VedoraAI";
  }, []);

  const handleStartCourse = (course: Course) => {
    setSelectedCourse(course);
    setSelectedLesson(null);
    resetQuiz();
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    resetQuiz();
  };

  const resetQuiz = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
    setIsCorrect(false);
  };

  const handleQuizSubmit = () => {
    if (selectedOption === null || !selectedLesson) return;
    const correct = selectedOption === selectedLesson.quiz.correctAnswer;
    setIsCorrect(correct);
    setQuizSubmitted(true);
  };

  const levelColor = (level: string) => {
    if (level === "Beginner") return "var(--bullish)";
    if (level === "Intermediate") return "var(--neutral-color)";
    return "var(--bearish)";
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {/* Breadcrumbs */}
      {(selectedCourse || selectedLesson) && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 16, color: "var(--text-muted)" }}>
          <span style={{ cursor: "pointer", color: "var(--primary-light)" }} onClick={() => { setSelectedCourse(null); setSelectedLesson(null); }}>
            🎓 Learning Hub
          </span>
          {selectedCourse && (
            <>
              <span>/</span>
              <span
                style={{ cursor: selectedLesson ? "pointer" : "default", color: selectedLesson ? "var(--primary-light)" : "var(--text-secondary)" }}
                onClick={() => { if (selectedLesson) { setSelectedLesson(null); resetQuiz(); } }}
              >
                {selectedCourse.title}
              </span>
            </>
          )}
          {selectedLesson && (
            <>
              <span>/</span>
              <span style={{ color: "var(--text-secondary)" }}>{selectedLesson.title}</span>
            </>
          )}
        </div>
      )}

      {/* ── 1. Main Course Grid View ── */}
      {!selectedCourse && (
        <>
          <h1 className="dash-welcome-title" style={{ marginBottom: 8 }}>🎓 Learning Hub</h1>
          <p className="dash-welcome-sub" style={{ marginBottom: 24 }}>
            Master financial analysis and quantitative concepts with structured lessons and quizzes.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {COURSES_DATA.map((course) => (
              <div
                key={course.id}
                className="dash-panel"
                style={{ cursor: "pointer", transition: "all 0.25s", display: "flex", flexDirection: "column" }}
                onClick={() => handleStartCourse(course)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "var(--glow-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{course.emoji}</div>
                <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{course.title}</h3>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12, flex: 1, lineHeight: 1.5 }}>{course.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-muted)", marginTop: "auto" }}>
                  <span>{course.lessons.length} lessons</span>
                  <span>·</span>
                  <span style={{ color: levelColor(course.level), fontWeight: 700 }}>{course.level}</span>
                </div>
                <button className="btn btn-primary btn-sm" style={{ marginTop: 14, width: "100%" }}>
                  Start Course
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 2. Course Syllabus View ── */}
      {selectedCourse && !selectedLesson && (
        <div className="dash-panel" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <span style={{ fontSize: 40 }}>{selectedCourse.emoji}</span>
            <div>
              <h1 className="dash-welcome-title" style={{ fontSize: 22, margin: 0 }}>{selectedCourse.title}</h1>
              <span style={{ fontSize: 12, color: levelColor(selectedCourse.level), fontWeight: 700 }}>{selectedCourse.level} Course</span>
            </div>
          </div>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24, lineHeight: 1.6 }}>{selectedCourse.description}</p>

          <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: 8, marginBottom: 16 }}>
            Syllabus Content ({selectedCourse.lessons.length} Lessons)
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {selectedCourse.lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                onClick={() => handleSelectLesson(lesson)}
                className="dash-panel"
                style={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 16,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--primary-light)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>LESSON {index + 1}</div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{lesson.title}</div>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>⏱️ {lesson.duration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Lesson Viewer & Interactive Quiz ── */}
      {selectedCourse && selectedLesson && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
          {/* Main Reading / Quiz panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Lesson Reading Container */}
            <div className="dash-panel" style={{ padding: 24 }}>
              <h1 className="dash-welcome-title" style={{ fontSize: 20, marginBottom: 16 }}>{selectedLesson.title}</h1>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, lineHeight: 1.6, color: "var(--text-secondary)", fontSize: 14 }}>
                {selectedLesson.content.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* Interactive Multiple-Choice Quiz */}
            <div className="dash-panel" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 15, fontWeight: 700, marginBottom: 16, marginTop: 0 }}>
                💡 Check Your Knowledge
              </h3>
              <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{selectedLesson.quiz.question}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {selectedLesson.quiz.options.map((option, idx) => {
                  let borderStyle = "1px solid var(--border)";
                  let bgStyle = "var(--card)";
                  let colorStyle = "var(--text-primary)";

                  if (selectedOption === idx) {
                    borderStyle = "1px solid var(--primary-light)";
                    bgStyle = "rgba(108,92,231,0.05)";
                  }

                  if (quizSubmitted) {
                    if (idx === selectedLesson.quiz.correctAnswer) {
                      borderStyle = "1px solid var(--bullish)";
                      bgStyle = "rgba(0, 230, 118, 0.05)";
                      colorStyle = "var(--bullish)";
                    } else if (selectedOption === idx) {
                      borderStyle = "1px solid var(--bearish)";
                      bgStyle = "rgba(255, 82, 82, 0.05)";
                      colorStyle = "var(--bearish)";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={quizSubmitted}
                      onClick={() => setSelectedOption(idx)}
                      style={{
                        textAlign: "left",
                        padding: 14,
                        borderRadius: 8,
                        border: borderStyle,
                        background: bgStyle,
                        color: colorStyle,
                        cursor: quizSubmitted ? "default" : "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                        transition: "all 0.15s"
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={handleQuizSubmit}
                  disabled={selectedOption === null}
                  className="btn btn-primary"
                  style={{ marginTop: 20, padding: "10px 20px" }}
                >
                  Submit Answer
                </button>
              ) : (
                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    borderRadius: 8,
                    background: isCorrect ? "rgba(0, 230, 118, 0.05)" : "rgba(255, 82, 82, 0.05)",
                    border: `1px solid ${isCorrect ? "var(--bullish)" : "var(--bearish)"}`
                  }}
                >
                  <div style={{ fontWeight: 700, color: isCorrect ? "var(--bullish)" : "var(--bearish)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    {isCorrect ? "✅ Correct Answer!" : "❌ Incorrect Answer"}
                  </div>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                    {selectedLesson.quiz.explanation}
                  </p>
                  <button
                    onClick={resetQuiz}
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 12 }}
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Panel: Ask AI Coach Shortcut */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="dash-panel" style={{ height: "fit-content", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 28 }}>🧠</div>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 14, fontWeight: 700, margin: 0 }}>
                Doubt about this lesson?
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                Ask our AI Coach to clarify terms, explain formulas, or provide more real-world examples.
              </p>
              <Link
                href={`/dashboard/coach?q=In the lesson "${selectedLesson.title}", please explain more about: `}
                className="btn btn-secondary btn-sm"
                style={{ textAlign: "center", textDecoration: "none", fontSize: 12 }}
              >
                💬 Ask AI Coach
              </Link>
            </div>

            {/* Syllabus Navigation Panel */}
            <div className="dash-panel" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontFamily: "var(--font-heading)", fontSize: 13, fontWeight: 700, margin: 0, borderBottom: "1px solid var(--border)", paddingBottom: 6 }}>
                Course Syllabus
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selectedCourse.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    style={{
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      padding: "6px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: selectedLesson.id === lesson.id ? 700 : 500,
                      color: selectedLesson.id === lesson.id ? "var(--primary-light)" : "var(--text-secondary)",
                      cursor: "pointer",
                      transition: "color 0.15s"
                    }}
                  >
                    {lesson.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

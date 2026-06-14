"""
VedoraAI — AI Coach Engine
Integrates Google Gemini API for intelligent market education.
Provides a financial-expert chatbot that explains concepts,
analyzes scenarios, and educates users about markets.
"""

import logging
from typing import Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# ── System Prompt ──────────────────────────────
SYSTEM_PROMPT = """You are VedoraAI Coach, an expert AI market intelligence assistant built into the VedoraAI platform.

Your role is to EDUCATE users about financial markets, investment concepts, and trading strategies.

IMPORTANT RULES:
1. You are NOT a financial advisor. Never give specific buy/sell recommendations.
2. Always include a brief disclaimer when discussing specific stocks.
3. Explain concepts clearly using simple language, examples, and analogies.
4. Use bullet points and structured formatting for readability.
5. When explaining technical indicators (RSI, MACD, etc.), include:
   - What it measures
   - How to read it
   - Common signals
   - Limitations
6. Be encouraging and supportive — users are learning.
7. If asked about VedoraAI features, explain them helpfully.
8. Use INR (Indian Rupees) examples when relevant — VedoraAI focuses on Indian markets.
9. Keep responses concise but thorough (200-400 words typically).
10. Use emojis sparingly for warmth (1-3 per response).

You can discuss:
- Stock market fundamentals (P/E, EPS, market cap)
- Technical analysis (candlesticks, chart patterns, indicators)
- Risk management (stop-loss, position sizing, diversification)
- Market psychology and behavioral finance
- Macroeconomics (inflation, interest rates, GDP)
- Investment strategies (value, growth, momentum, index)
- Indian market specifics (NSE, BSE, SEBI, FII/DII flows)
- Crypto & commodities concepts (educational only)

Your personality: Knowledgeable, patient, encouraging, and clear."""


class CoachEngine:
    """AI Coach powered by Google Gemini."""

    def __init__(self):
        self._model = None
        self._initialized = False

    def _init_model(self):
        """Lazy-initialize the Gemini model."""
        if self._initialized:
            return

        settings = get_settings()
        api_key = settings.gemini_api_key

        if not api_key or api_key in ("dummy-key", ""):
            logger.warning("Gemini API key not configured — coach will use fallback mode")
            self._initialized = True
            return

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self._model = genai.GenerativeModel(
                model_name="gemini-2.0-flash",
                system_instruction=SYSTEM_PROMPT,
            )
            self._initialized = True
            logger.info("Gemini AI Coach initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")
            self._initialized = True

    async def chat(self, message: str, history: list[dict] = None) -> dict:
        """
        Process a chat message and return AI response.

        Args:
            message: User's message
            history: List of previous messages [{role: 'user'|'model', parts: [text]}]

        Returns:
            Dict with response text and metadata
        """
        self._init_model()

        if self._model is None:
            return self._fallback_response(message)

        try:
            # Build conversation history for Gemini
            gemini_history = []
            if history:
                for msg in history[-10:]:  # Keep last 10 messages for context
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    if role == "assistant":
                        role = "model"
                    gemini_history.append({
                        "role": role,
                        "parts": [content],
                    })

            # Start chat with history
            chat = self._model.start_chat(history=gemini_history)
            response = chat.send_message(message)

            return {
                "response": response.text,
                "source": "gemini",
                "model": "gemini-2.0-flash",
                "tokens_used": response.usage_metadata.total_token_count if hasattr(response, 'usage_metadata') and response.usage_metadata else None,
            }

        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return self._fallback_response(message)

    def _fallback_response(self, message: str) -> dict:
        """Provide intelligent fallback responses when Gemini is unavailable."""
        msg = message.lower().strip()

        responses = {
            "rsi": (
                "**RSI (Relative Strength Index)** is a momentum oscillator that measures "
                "the speed and change of price movements on a scale of 0-100.\n\n"
                "**How to read it:**\n"
                "- **Above 70** = Overbought (price may be due for a pullback)\n"
                "- **Below 30** = Oversold (price may be due for a bounce)\n"
                "- **50 line** = Trend direction indicator\n\n"
                "**Common signals:**\n"
                "- RSI crossing above 30 from below = potential buy signal\n"
                "- RSI crossing below 70 from above = potential sell signal\n"
                "- Divergence between price and RSI = potential trend reversal\n\n"
                "**Limitation:** RSI can stay overbought/oversold for extended periods in strong trends.\n\n"
                "*This is educational information, not financial advice.*"
            ),
            "macd": (
                "**MACD (Moving Average Convergence Divergence)** is a trend-following "
                "momentum indicator.\n\n"
                "**Components:**\n"
                "- **MACD Line** = 12-day EMA minus 26-day EMA\n"
                "- **Signal Line** = 9-day EMA of the MACD line\n"
                "- **Histogram** = Difference between MACD and Signal\n\n"
                "**Key signals:**\n"
                "- MACD crossing above signal = bullish crossover\n"
                "- MACD crossing below signal = bearish crossover\n"
                "- Histogram expanding = increasing momentum\n\n"
                "*This is educational information, not financial advice.*"
            ),
            "pe": (
                "**P/E Ratio (Price-to-Earnings)** tells you how much investors are paying "
                "for each rupee of earnings.\n\n"
                "**Formula:** Stock Price / Earnings Per Share\n\n"
                "**How to interpret:**\n"
                "- **High P/E (>25)** = Investors expect high growth (or stock is overvalued)\n"
                "- **Low P/E (<15)** = Could be undervalued or facing challenges\n"
                "- **Industry comparison** is more meaningful than absolute numbers\n\n"
                "**Example:** If RELIANCE trades at Rs.2,500 with EPS of Rs.100, P/E = 25x\n\n"
                "*This is educational information, not financial advice.*"
            ),
            "candlestick": (
                "**Candlestick Charts** are the most popular way to visualize stock prices.\n\n"
                "**Each candle shows:**\n"
                "- **Body** = Opening and Closing price\n"
                "- **Wicks/Shadows** = High and Low of the period\n"
                "- **Green/White** = Close > Open (bullish)\n"
                "- **Red/Black** = Close < Open (bearish)\n\n"
                "**Key patterns:**\n"
                "- **Doji** = Open = Close (indecision)\n"
                "- **Hammer** = Small body, long lower wick (potential reversal)\n"
                "- **Engulfing** = Current candle engulfs previous (strong signal)\n\n"
                "*This is educational information, not financial advice.*"
            ),
        }

        # Match keywords
        for keyword, response in responses.items():
            if keyword in msg:
                return {"response": response, "source": "fallback", "model": "built-in"}

        # Generic response
        return {
            "response": (
                f"Great question about \"{message}\"!\n\n"
                "I'd love to give you a detailed answer, but the AI Coach needs a "
                "**Gemini API key** to be fully functional.\n\n"
                "**To enable the AI Coach:**\n"
                "1. Get a free API key from [Google AI Studio](https://aistudio.google.com/apikey)\n"
                "2. Add it to your `backend/.env` file as `GEMINI_API_KEY=your-key`\n"
                "3. Restart the backend server\n\n"
                "In the meantime, try asking about specific topics like:\n"
                "- \"What is RSI?\"\n"
                "- \"Explain P/E ratio\"\n"
                "- \"How to read candlestick charts?\"\n"
                "- \"What is MACD?\"\n\n"
                "I have built-in explanations for these common topics!"
            ),
            "source": "fallback",
            "model": "built-in",
        }


# Singleton
coach_engine = CoachEngine()

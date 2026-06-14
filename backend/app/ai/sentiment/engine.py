"""
VedoraAI — Sentiment Analysis Engine
Fetches financial news from RSS feeds and Yahoo Finance,
scores sentiment using a financial lexicon approach.
"""

import asyncio
import logging
import re
from datetime import datetime, timezone, timedelta
from typing import Optional
from html import unescape

import httpx

logger = logging.getLogger(__name__)

# ── Financial Sentiment Lexicon (Loughran-McDonald inspired) ──
BULLISH_WORDS = {
    "surge", "surges", "surging", "soar", "soars", "soaring", "rally", "rallies",
    "gain", "gains", "gained", "profit", "profits", "profitable", "growth", "growing",
    "upgrade", "upgraded", "beat", "beats", "beating", "outperform", "outperforms",
    "strong", "stronger", "strongest", "bullish", "boom", "booming", "record",
    "positive", "optimistic", "recovery", "recovering", "upbeat", "high", "higher",
    "rise", "rises", "rising", "jumped", "jump", "jumps", "breakout", "momentum",
    "buy", "accumulate", "target", "expansion", "expanding", "revenue",
    "dividend", "bonus", "approve", "approved", "launch", "launches", "innovation",
    "success", "successful", "exceed", "exceeds", "exceeded", "beat", "robust",
    "stellar", "impressive", "accelerate", "accelerates", "accelerating",
}

BEARISH_WORDS = {
    "fall", "falls", "falling", "drop", "drops", "dropped", "decline", "declines",
    "declining", "loss", "losses", "crash", "crashes", "crashing", "plunge",
    "plunges", "plunging", "sell", "selloff", "downgrade", "downgraded",
    "miss", "misses", "missed", "weak", "weaker", "weakest", "bearish",
    "slump", "slumps", "slumping", "negative", "pessimistic", "concern",
    "concerns", "worried", "worry", "risk", "risks", "risky", "debt",
    "default", "bankruptcy", "layoff", "layoffs", "cut", "cuts", "cutting",
    "fine", "fined", "penalty", "fraud", "scandal", "recession", "inflation",
    "volatile", "volatility", "uncertain", "uncertainty", "tumble", "tumbles",
    "warning", "warns", "warned", "pressure", "pressured", "struggle",
    "struggling", "disappointing", "disappoint", "disappoints",
}

# ── News RSS feeds ──
RSS_FEEDS = [
    {
        "url": "https://feeds.feedburner.com/ndtvprofit-latest",
        "source": "NDTV Profit",
    },
    {
        "url": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
        "source": "Economic Times",
    },
    {
        "url": "https://www.moneycontrol.com/rss/marketreports.xml",
        "source": "Moneycontrol",
    },
]

# ── Cache ──
_news_cache: dict = {}
CACHE_TTL = 600  # 10 minutes


class SentimentEngine:
    """News sentiment analysis using financial lexicon."""

    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=15.0,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
                follow_redirects=True,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    # ── Sentiment Scoring ──────────────────────────
    def _score_text(self, text: str) -> dict:
        """Score text sentiment using financial lexicon."""
        words = set(re.findall(r'\b[a-z]+\b', text.lower()))

        bullish_hits = words & BULLISH_WORDS
        bearish_hits = words & BEARISH_WORDS

        bull_count = len(bullish_hits)
        bear_count = len(bearish_hits)
        total = bull_count + bear_count

        if total == 0:
            return {"score": 0.0, "label": "neutral", "bull_count": 0, "bear_count": 0}

        # Normalized score: -1 (very bearish) to +1 (very bullish)
        score = (bull_count - bear_count) / total

        if score > 0.2:
            label = "bullish"
        elif score < -0.2:
            label = "bearish"
        else:
            label = "neutral"

        return {
            "score": round(score, 3),
            "label": label,
            "bull_count": bull_count,
            "bear_count": bear_count,
        }

    # ── Fetch RSS News ────────────────────────────
    async def _fetch_rss_news(self, feed_url: str, source: str) -> list[dict]:
        """Fetch and parse RSS feed."""
        client = await self._get_client()
        try:
            resp = await client.get(feed_url)
            if resp.status_code != 200:
                return []

            # Parse XML manually (lightweight, no feedparser dependency at runtime)
            content = resp.text
            articles = []

            # Simple XML parsing for RSS items
            items = re.findall(r'<item>(.*?)</item>', content, re.DOTALL)
            for item_xml in items[:15]:  # Limit to 15 per feed
                title_match = re.search(r'<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>', item_xml, re.DOTALL)
                desc_match = re.search(r'<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</description>', item_xml, re.DOTALL)
                date_match = re.search(r'<pubDate>(.*?)</pubDate>', item_xml)
                link_match = re.search(r'<link>(.*?)</link>', item_xml)

                title = unescape(title_match.group(1).strip()) if title_match else ""
                description = unescape(desc_match.group(1).strip()) if desc_match else ""
                # Strip HTML tags from description
                description = re.sub(r'<[^>]+>', '', description).strip()
                pub_date = date_match.group(1).strip() if date_match else ""
                link = link_match.group(1).strip() if link_match else ""

                if not title:
                    continue

                # Score sentiment
                full_text = f"{title} {description}"
                sentiment = self._score_text(full_text)

                # Parse date
                time_ago = self._parse_time_ago(pub_date)

                articles.append({
                    "title": title[:200],
                    "summary": description[:300] if description else title,
                    "source": source,
                    "link": link,
                    "published": pub_date,
                    "time_ago": time_ago,
                    "sentiment": sentiment,
                    "impact": sentiment["label"],
                    "category": self._detect_category(title),
                })

            return articles
        except Exception as e:
            logger.error(f"RSS fetch error for {source}: {e}")
            return []

    # ── Yahoo Finance News ─────────────────────────
    async def _fetch_yahoo_news(self, symbol: str) -> list[dict]:
        """Fetch symbol-specific news from Yahoo Finance search API."""
        client = await self._get_client()
        try:
            resp = await client.get(
                "https://query2.finance.yahoo.com/v1/finance/search",
                params={"q": symbol, "newsCount": 10, "quotesCount": 0},
            )
            data = resp.json()
            articles = []
            for item in data.get("news", []):
                title = item.get("title", "")
                publisher = item.get("publisher", "Yahoo Finance")
                pub_time = item.get("providerPublishTime", 0)
                link = item.get("link", "")

                sentiment = self._score_text(title)

                # Calculate time ago
                if pub_time:
                    dt = datetime.fromtimestamp(pub_time, tz=timezone.utc)
                    delta = datetime.now(timezone.utc) - dt
                    time_ago = self._delta_to_str(delta)
                else:
                    time_ago = "recently"

                articles.append({
                    "title": title,
                    "summary": title,
                    "source": publisher,
                    "link": link,
                    "published": datetime.fromtimestamp(pub_time, tz=timezone.utc).isoformat() if pub_time else "",
                    "time_ago": time_ago,
                    "sentiment": sentiment,
                    "impact": sentiment["label"],
                    "category": self._detect_category(title),
                })

            return articles
        except Exception as e:
            logger.error(f"Yahoo news error for {symbol}: {e}")
            return []

    # ── Helpers ─────────────────────────────────────
    def _detect_category(self, title: str) -> str:
        """Detect news category from title keywords."""
        t = title.lower()
        if any(w in t for w in ["rbi", "fed", "rate", "policy", "government", "budget", "tax"]):
            return "Policy"
        if any(w in t for w in ["profit", "revenue", "earnings", "quarter", "q1", "q2", "q3", "q4", "result"]):
            return "Earnings"
        if any(w in t for w in ["ipo", "listing", "share", "stock", "market", "nifty", "sensex", "fii", "dii"]):
            return "Markets"
        if any(w in t for w in ["auto", "car", "vehicle", "ev", "electric"]):
            return "Auto"
        if any(w in t for w in ["bank", "loan", "credit", "npa"]):
            return "Banking"
        if any(w in t for w in ["it", "tech", "software", "digital", "ai"]):
            return "Tech"
        if any(w in t for w in ["pharma", "drug", "health", "medical", "hospital"]):
            return "Pharma"
        if any(w in t for w in ["oil", "gas", "crude", "gold", "metal", "commodity"]):
            return "Commodities"
        return "General"

    def _parse_time_ago(self, date_str: str) -> str:
        """Parse RSS date string to 'X hours ago' format."""
        try:
            from email.utils import parsedate_to_datetime
            dt = parsedate_to_datetime(date_str)
            delta = datetime.now(timezone.utc) - dt.astimezone(timezone.utc)
            return self._delta_to_str(delta)
        except Exception:
            return "recently"

    def _delta_to_str(self, delta: timedelta) -> str:
        """Convert timedelta to human-readable string."""
        seconds = int(delta.total_seconds())
        if seconds < 60:
            return "just now"
        if seconds < 3600:
            m = seconds // 60
            return f"{m} min{'s' if m > 1 else ''} ago"
        if seconds < 86400:
            h = seconds // 3600
            return f"{h} hour{'s' if h > 1 else ''} ago"
        d = seconds // 86400
        return f"{d} day{'s' if d > 1 else ''} ago"

    # ── Public API ─────────────────────────────────
    async def get_market_news(self, limit: int = 20) -> dict:
        """Get general market news with sentiment scores."""
        cache_key = "market_news"
        if cache_key in _news_cache:
            cached_time, cached_data = _news_cache[cache_key]
            if (datetime.now(timezone.utc) - cached_time).total_seconds() < CACHE_TTL:
                return cached_data

        # Fetch from all RSS feeds concurrently
        tasks = [self._fetch_rss_news(f["url"], f["source"]) for f in RSS_FEEDS]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_articles = []
        for r in results:
            if isinstance(r, list):
                all_articles.extend(r)

        # Deduplicate by title similarity
        seen_titles = set()
        unique = []
        for a in all_articles:
            key = a["title"][:50].lower()
            if key not in seen_titles:
                seen_titles.add(key)
                unique.append(a)

        # Sort by recency (simple heuristic)
        unique = unique[:limit]

        # Overall sentiment
        scores = [a["sentiment"]["score"] for a in unique if a["sentiment"]["score"] != 0]
        avg_score = sum(scores) / len(scores) if scores else 0

        if avg_score > 0.15:
            overall = "bullish"
        elif avg_score < -0.15:
            overall = "bearish"
        else:
            overall = "neutral"

        result = {
            "articles": unique,
            "total": len(unique),
            "overall_sentiment": overall,
            "sentiment_score": round(avg_score, 3),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        _news_cache[cache_key] = (datetime.now(timezone.utc), result)
        return result

    async def get_symbol_news(self, symbol: str, limit: int = 10) -> dict:
        """Get news for a specific symbol."""
        cache_key = f"news_{symbol}"
        if cache_key in _news_cache:
            cached_time, cached_data = _news_cache[cache_key]
            if (datetime.now(timezone.utc) - cached_time).total_seconds() < CACHE_TTL:
                return cached_data

        articles = await self._fetch_yahoo_news(symbol)
        articles = articles[:limit]

        scores = [a["sentiment"]["score"] for a in articles if a["sentiment"]["score"] != 0]
        avg_score = sum(scores) / len(scores) if scores else 0

        result = {
            "symbol": symbol,
            "articles": articles,
            "total": len(articles),
            "overall_sentiment": "bullish" if avg_score > 0.15 else "bearish" if avg_score < -0.15 else "neutral",
            "sentiment_score": round(avg_score, 3),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        _news_cache[cache_key] = (datetime.now(timezone.utc), result)
        return result


# Singleton
sentiment_engine = SentimentEngine()

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const KALSHI_BASE = "https://api.elections.kalshi.com/trade-api/v2";
const SERIES = "KXBTC15M";

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/btc", async (req, res) => {
  try {
    const evRes = await fetch(
      `${KALSHI_BASE}/events?series_ticker=${SERIES}&status=open&with_nested_markets=true`
    );
    if (!evRes.ok) {
      return res.status(502).json({ error: `Kalshi returned ${evRes.status}` });
    }
    const evData = await evRes.json();
    const events = evData.events || [];

    if (events.length === 0) {
      return res.json({ open: false });
    }

    const ev = events.sort(
      (a, b) =>
        new Date(a.markets?.[0]?.close_time || 0) -
        new Date(b.markets?.[0]?.close_time || 0)
    )[0];
    const m = (ev.markets || [])[0] || {};

    res.json({
      open: true,
      title: ev.title || "BTC 15 min",
      ticker: m.ticker || "",
      close_time: m.close_time || null,
      yes_bid: m.yes_bid ?? null,
      yes_ask: m.yes_ask ?? null,
      no_bid: m.no_bid ?? null,
      no_ask: m.no_ask ?? null,
      volume: m.volume ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/debug", async (req, res) => {
  try {
    const evRes = await fetch(
      `${KALSHI_BASE}/events?series_ticker=${SERIES}&status=open&with_nested_markets=true`
    );
    const evData = await evRes.json();
    res.json(evData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Pulse BTC live server running on port ${PORT}`);
});

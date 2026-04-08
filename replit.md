# Nomics — Web3 Marketing Platform

## Overview
Full-stack Web3 marketing and crypto-asset tracking platform with live data, token listing/discovery, 12-service marketplace, admin approval flow, Discord webhook notifications, and Telegram bot (@Cariz_bot).

## Architecture

### Backend (api.py) — Port 8000
- **Flask** REST API with CORS + **gunicorn** for Render production
- Uses `PORT` env var for Render compatibility
- **CoinGecko**: global market, coin list, trending, gainers, coin detail, ticker, crypto-prices (SOL/ETH/BNB)
- **DexScreener**: full token lookup — name, symbol, image, description, links, socials, price, volume, liquidity
- **Crypto Prices**: `/api/crypto-prices` → real-time SOL/ETH/BNB in USD (fallback: 140/2500/600)
- **Premium Listing**: 0.3 SOL | 0.05 ETH | 0.15 BNB — sends Discord embed + Telegram admin alert
- **Free Listing**: under review — saves to pending queue, notifies admin
- **Service Orders**: `/api/service/order` — sends Discord embed with token, tier, price, wallet, contact info
- **Boost**: 3 packages (Basic $50, Pro $150, Elite $400) — notifies Discord + Telegram
- **Support**: `/api/support` — forwards message to Discord embed + Telegram admin
- **Bot thread**: Telegram bot runs in background thread when BOT_TOKEN set
- All notifications → `DISCORD_WEBHOOK_URL` env var

### Bot (bot.py) — Render Worker
- **Telegram bot** @Cariz_bot using pyTelegramBotAPI
- Clean inline keyboard layout with 8 service categories
- Currency selection (SOL/ETH/BNB) for each service
- All orders forwarded to Discord + Telegram admin
- Health check Flask server on PORT for Render

### Frontend (Vite + React) — Port 5000 (dev)
- **Home.jsx**: Market stats, promoted tokens, services grid preview, alpha banner, trending, coin table
- **Services.jsx**: 12 service cards — prices HIDDEN on cards; full modal flow:
  1. Enter CA → fetch all token info (image, name, description, links, socials, price, volume, market cap)
  2. Token card displayed (like Listed page) + tier selection with prices shown
  3. Telegram username required before payment step
  4. Currency selection (SOL/ETH/BNB) with real-time crypto amounts
  5. 30-minute countdown payment window
  6. Submit → "Pending Admin Approval" state
- **SubmitCoin.jsx**: 3-step listing wizard — CA lookup, project info, listing type + payment
  - 0.3 SOL listing with real-time USD display (e.g. 0.3 × $84 = $25)
  - 30-minute countdown on payment step
  - Telegram required before submission
  - Sends Discord + Telegram notification on submit
- **Listed.jsx**: Token directory with boost
- **TokenDetail.jsx**: Full token stats + boost modal
- **Trending.jsx**: DexScreener trending tokens
- **Support.jsx**: FAQ + contact form → @Cariz_bot link (https://t.me/Cariz_bot)

## Key Env Vars
- `BOT_TOKEN` — Telegram bot token
- `ADMIN_ID` — Telegram admin user ID (default: 8235324142)
- `DISCORD_WEBHOOK_URL` — all order/alert notifications go here
- `SOL_WALLET`, `ETH_WALLET`, `BNB_WALLET` — payment receiving addresses
- `SITE_URL` — public URL for bot buttons
- `GITHUB_PERSONAL_ACCESS_TOKEN` — for GitHub push to daviddan-241/Crypto-

## Deployment

### Render (API + Bot)
- **API service**: `gunicorn api:app --bind=0.0.0.0:$PORT --workers=2 --timeout=120 --preload`
- **Bot worker**: `python bot.py` (worker type — no port binding needed)
- `render.yaml` is fully configured

### Vercel (Frontend)
- Build command: `cd frontend && npm install && npm run build`
- Output directory: `frontend/dist`
- API proxy in `vercel.json` → https://nomics-api.onrender.com
- `vercel.json` configured with rewrites

### GitHub
- Remote: https://github.com/daviddan-241/Crypto-
- Push: `git push origin main`

## Pricing
- Premium Listing: **0.3 SOL** | 0.05 ETH | 0.15 BNB
- Boost: $50 Basic (+150 pts) | $150 Pro (+500 pts) | $400 Elite (+1500 pts)
- DEX Trending: $99 | $299 | $799
- Volume Bot: $199 | $599 | $1,499
- KOL Outreach: $299 | $799 | $1,999
- Alpha Access: $99/mo | $249/quarter | $599 lifetime
- Alpha Group: https://t.me/+QJVQUQIhP-82ZDk8
- Bot: @Cariz_bot → https://t.me/Cariz_bot

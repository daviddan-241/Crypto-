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

BNB_WALLET = os.environ.get("BNB_WALLET", "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A")
ETH_WALLET = os.environ.get("ETH_WALLET", "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A")
SOL_WALLET = os.environ.get("SOL_WALLET", "46ZKRuURaASKEcKBafnPZgMaTqBL8RK8TssZgZzFCBzn")

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex"
HEADERS = {"accept": "application/json", "User-Agent": "Nomics/1.0"}

LISTINGS_FILE = "listings.json"
LISTINGS_LOCK = FileLock("listings.lock")

PREMIUM_PRICES = {
    "BNB": {"amount": 0.05, "label": "0.05 BNB"},
    "ETH": {"amount": 0.02, "label": "0.02 ETH"},
    "SOL": {"amount": 0.2, "label": "0.2 SOL"}
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


def notify_discord(message):
    if not DISCORD_WEBHOOK:
        return
    try:
        requests.post(DISCORD_WEBHOOK, json={"content": message}, timeout=5)
    except Exception:
        pass


def notify_telegram(message):
    if bot:
        try:
            bot.send_message(ADMIN_ID, message, parse_mode="Markdown")
        except Exception:
            pass


@app.route("/")
def home():
    return {"status": "Nomics API running", "time": time.strftime("%Y-%m-%d %H:%M:%S UTC")}


@app.route("/health")
def health():
    return {"status": "ok"}, 200


@app.route("/api/wallets")
def get_wallets():
    return jsonify({
        "BNB": BNB_WALLET,
        "ETH": ETH_WALLET,
        "SOL": SOL_WALLET
    })


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
        per_page = request.args.get("per_page", 100)
        vs_currency = request.args.get("vs_currency", "usd")
        r = requests.get(
            f"{COINGECKO_BASE}/coins/markets",
            params={
                "vs_currency": vs_currency,
                "order": "market_cap_desc",
                "per_page": per_page,
                "page": page,
                "sparkline": "true",
                "price_change_percentage": "1h,24h,7d"
            },
            headers=HEADERS,
            timeout=15
        )
        return jsonify(r.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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
                "per_page": 250,
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
        r = requests.get(
            f"{DEXSCREENER_BASE}/tokens/{address}",
            headers=HEADERS,
            timeout=10
        )
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
            "txns_24h": {
                "buys": txns.get("buys", 0),
                "sells": txns.get("sells", 0)
            },
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
            "image": token_data.get("image", ""),
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
            "boost": 150,
            "featured": False,
            "listed_at": int(time.time()),
            "contact": contact
        }

        db = load_listings()
        db["listings"].append(listing_entry)
        save_listings(db)

        msg = (
            f"*NEW PREMIUM LISTING - Nomics*\n"
            f"{'='*35}\n"
            f"Token: {name} (${symbol})\n"
            f"Chain: {chain.upper()}\n"
            f"Address: `{address}`\n"
            f"Price: {price_info['label']} {currency}\n"
            f"Pay to: `{payment_address}`\n"
            f"Contact: {contact.get('telegram', 'N/A')}\n"
            f"{'='*35}"
        )
        notify_telegram(msg)
        notify_discord(msg.replace("*", "**").replace("`", "`"))

        return jsonify({
            "success": True,
            "listing_type": "premium",
            "status": "listed",
            "message": f"Your token is now listed! Please send {price_info['label']} to complete payment.",
            "payment": {
                "currency": currency,
                "amount": price_info["amount"],
                "address": payment_address
            }
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
            "status": "under_review"
        }
        db = load_listings()
        db["pending"].append(pending_entry)
        save_listings(db)

        msg = (
            f"*FREE LISTING REQUEST - Nomics*\n"
            f"Token: {name} (${symbol})\n"
            f"Chain: {chain.upper()}\n"
            f"Address: `{address}`\n"
            f"Status: Under Review"
        )
        notify_telegram(msg)

        return jsonify({
            "success": True,
            "listing_type": "free",
            "status": "under_review",
            "message": "Your token has been submitted for review. This may take 7-14 days."
        })


@app.route("/api/token/<listing_id>/boost", methods=["POST"])
def boost_token(listing_id):
    data = request.json or {}
    currency = data.get("currency", "SOL")
    boost_amount = int(data.get("boost_amount", 150))

    wallets = {"BNB": BNB_WALLET, "ETH": ETH_WALLET, "SOL": SOL_WALLET}
    payment_address = wallets.get(currency, SOL_WALLET)

    boost_prices = {"BNB": 0.01, "ETH": 0.005, "SOL": 0.05}
    price = boost_prices.get(currency, 0.05)

    msg = (
        f"*BOOST REQUEST - Nomics*\n"
        f"Listing ID: {listing_id}\n"
        f"Boost: +{boost_amount}\n"
        f"Currency: {currency}\n"
        f"Amount: {price} {currency}\n"
        f"Pay to: `{payment_address}`"
    )
    notify_telegram(msg)

    return jsonify({
        "success": True,
        "payment": {
            "currency": currency,
            "amount": price,
            "address": payment_address
        }
    })


@app.route("/api/ticker")
def ticker():
    try:
        r = requests.get(
            f"{COINGECKO_BASE}/coins/markets",
            params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": 20,
                "page": 1,
                "price_change_percentage": "1h"
            },
            headers=HEADERS,
            timeout=10
        )
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

    if bot:
        msg = (
            f"*SUPPORT - Nomics*\n"
            f"From: {name}\n"
            f"Email: {email}\n"
            f"ID: {user_id}\n"
            f"Message: {message}"
        )
        try:
            bot.send_message(ADMIN_ID, msg, parse_mode="Markdown")
        except Exception:
            pass

    notify_discord(f"**Support Message**\nFrom: {name} ({email})\n{message}")
    return jsonify({"success": True, "message": "Message received. Our team will respond within a few hours."})


def build_main_menu():
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.add(
        types.InlineKeyboardButton("🔥 List My Token", callback_data="menu_list"),
        types.InlineKeyboardButton("⚡ Boost Token", callback_data="menu_boost"),
        types.InlineKeyboardButton("📈 Trending Push", callback_data="menu_trend"),
        types.InlineKeyboardButton("🤖 Volume Bot", callback_data="menu_volume"),
        types.InlineKeyboardButton("📣 KOL / Calls", callback_data="menu_kol"),
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
                f"The #1 Web3 Marketing Platform.\n\n"
                f"• Premium Token Listings\n"
                f"• Trending Push & Volume\n"
                f"• KOL & Influencer Calls\n"
                f"• DEX Trending Campaigns\n\n"
                f"Select an option below or visit {SITE_URL}",
                parse_mode="Markdown",
                reply_markup=build_main_menu()
            )

        @bot.message_handler(commands=["list"])
        def list_cmd(m):
            wallets_text = (
                f"*Premium Listing Prices:*\n\n"
                f"🟡 BNB Chain: 0.05 BNB\n`{BNB_WALLET}`\n\n"
                f"🔵 Ethereum: 0.02 ETH\n`{ETH_WALLET}`\n\n"
                f"🟣 Solana: 0.2 SOL\n`{SOL_WALLET}`\n\n"
                f"After payment, send your token contract address to this bot and we will list it instantly.\n\n"
                f"Or use our website for automatic listing:\n{SITE_URL}/submit"
            )
            bot.send_message(m.chat.id, wallets_text, parse_mode="Markdown", reply_markup=build_currency_menu("list"))

        @bot.message_handler(commands=["boost"])
        def boost_cmd(m):
            text = (
                f"*Boost Your Token* ⚡\n\n"
                f"Boost prices (per 150 points):\n\n"
                f"🟡 BNB: 0.01 BNB\n`{BNB_WALLET}`\n\n"
                f"🔵 ETH: 0.005 ETH\n`{ETH_WALLET}`\n\n"
                f"🟣 SOL: 0.05 SOL\n`{SOL_WALLET}`\n\n"
                f"After payment, send your token contract address to confirm."
            )
            bot.send_message(m.chat.id, text, parse_mode="Markdown", reply_markup=build_currency_menu("boost"))

        @bot.message_handler(commands=["trending"])
        def trending_cmd(m):
            text = (
                f"*Trending Push Package* 📈\n\n"
                f"Get your token trending across DEX platforms!\n\n"
                f"*Packages:*\n"
                f"• Basic: 0.1 SOL / 0.01 ETH / 0.02 BNB — 24h push\n"
                f"• Pro: 0.3 SOL / 0.03 ETH / 0.06 BNB — 72h multi-DEX\n"
                f"• Elite: 1 SOL / 0.1 ETH / 0.2 BNB — 7-day sustained\n\n"
                f"Choose your currency to pay:"
            )
            bot.send_message(m.chat.id, text, parse_mode="Markdown", reply_markup=build_currency_menu("trend"))

        @bot.message_handler(commands=["volume"])
        def volume_cmd(m):
            text = (
                f"*Volume Bot Infrastructure* 🤖\n\n"
                f"Managed volume generation to create market momentum.\n\n"
                f"*Packages:*\n"
                f"• Starter: 0.15 SOL / 0.015 ETH / 0.03 BNB — 24h basic\n"
                f"• Growth: 0.5 SOL / 0.05 ETH / 0.1 BNB — 72h managed\n"
                f"• Premium: 2 SOL / 0.2 ETH / 0.4 BNB — 7-day advanced\n\n"
                f"Choose currency to continue:"
            )
            bot.send_message(m.chat.id, text, parse_mode="Markdown", reply_markup=build_currency_menu("volume"))

        @bot.message_handler(commands=["kol"])
        def kol_cmd(m):
            text = (
                f"*KOL / Influencer Package* 📣\n\n"
                f"Access our network of crypto callers and influencers.\n\n"
                f"*Packages:*\n"
                f"• Micro (3-5 callers): 0.2 SOL / 0.02 ETH / 0.04 BNB\n"
                f"• Mid-tier (8-12 callers): 0.6 SOL / 0.06 ETH / 0.12 BNB\n"
                f"• Premium (20+ KOLs): 2.5 SOL / 0.25 ETH / 0.5 BNB\n\n"
                f"Choose currency:"
            )
            bot.send_message(m.chat.id, text, parse_mode="Markdown", reply_markup=build_currency_menu("kol"))

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
                f"/help — This help message\n\n"
                f"Platform: {SITE_URL}"
            )
            bot.send_message(m.chat.id, text, parse_mode="Markdown")

        @bot.callback_query_handler(func=lambda call: True)
        def handle_callback(call):
            data = call.data
            cid = call.message.chat.id
            bot.answer_callback_query(call.id)

            if data == "menu_list":
                wallets_text = (
                    f"*Premium Token Listing* 🔥\n\n"
                    f"Get your token listed instantly on Nomics!\n\n"
                    f"*Prices:*\n"
                    f"🟡 BNB Chain: 0.05 BNB\n`{BNB_WALLET}`\n\n"
                    f"🔵 Ethereum: 0.02 ETH\n`{ETH_WALLET}`\n\n"
                    f"🟣 Solana: 0.2 SOL\n`{SOL_WALLET}`\n\n"
                    f"*Includes:*\n"
                    f"✅ Instant listing\n"
                    f"✅ 150 Boost points\n"
                    f"✅ 24h Promoted highlight\n"
                    f"✅ Signal on Nomics channel\n\n"
                    f"Choose payment currency:"
                )
                bot.send_message(cid, wallets_text, parse_mode="Markdown", reply_markup=build_currency_menu("list"))

            elif data == "menu_boost":
                text = (
                    f"*Boost Your Token* ⚡\n\n"
                    f"Boost gets your token to the top of listings!\n\n"
                    f"*Boost Prices (per 150 pts):*\n"
                    f"🟡 BNB: 0.01 BNB\n`{BNB_WALLET}`\n\n"
                    f"🔵 ETH: 0.005 ETH\n`{ETH_WALLET}`\n\n"
                    f"🟣 SOL: 0.05 SOL\n`{SOL_WALLET}`\n\n"
                    f"Choose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("boost"))

            elif data == "menu_trend":
                text = (
                    f"*Trending Push* 📈\n\n"
                    f"*Packages:*\n"
                    f"• Basic (24h): 0.1 SOL / 0.01 ETH / 0.02 BNB\n"
                    f"• Pro (72h multi-DEX): 0.3 SOL / 0.03 ETH / 0.06 BNB\n"
                    f"• Elite (7-day): 1 SOL / 0.1 ETH / 0.2 BNB\n\n"
                    f"Choose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("trend"))

            elif data == "menu_volume":
                text = (
                    f"*Volume Bot* 🤖\n\n"
                    f"*Packages:*\n"
                    f"• Starter (24h): 0.15 SOL / 0.015 ETH / 0.03 BNB\n"
                    f"• Growth (72h): 0.5 SOL / 0.05 ETH / 0.1 BNB\n"
                    f"• Premium (7-day): 2 SOL / 0.2 ETH / 0.4 BNB\n\n"
                    f"Choose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("volume"))

            elif data == "menu_kol":
                text = (
                    f"*KOL / Influencer Package* 📣\n\n"
                    f"*Packages:*\n"
                    f"• Micro (3-5 callers): 0.2 SOL / 0.02 ETH / 0.04 BNB\n"
                    f"• Mid-tier (8-12): 0.6 SOL / 0.06 ETH / 0.12 BNB\n"
                    f"• Premium (20+ KOLs): 2.5 SOL / 0.25 ETH / 0.5 BNB\n\n"
                    f"Choose currency:"
                )
                bot.send_message(cid, text, parse_mode="Markdown", reply_markup=build_currency_menu("kol"))

            elif data == "menu_back":
                bot.send_message(
                    cid,
                    f"*Nomics Main Menu* 🚀\n\nSelect a service:",
                    parse_mode="Markdown",
                    reply_markup=build_main_menu()
                )

            elif data.startswith("pay_"):
                parts = data.split("_")
                action = parts[1]
                currency = parts[2] if len(parts) > 2 else "SOL"
                wallets = {"BNB": BNB_WALLET, "ETH": ETH_WALLET, "SOL": SOL_WALLET}
                addr = wallets.get(currency, SOL_WALLET)
                user = call.from_user
                text = (
                    f"*Payment Details* 💳\n\n"
                    f"Service: {action.upper()}\n"
                    f"Currency: {currency}\n"
                    f"Send payment to:\n`{addr}`\n\n"
                    f"After payment, reply with your *token contract address* and our team will confirm within 1 hour.\n\n"
                    f"Or complete on our platform:\n{SITE_URL}/submit"
                )
                bot.send_message(cid, text, parse_mode="Markdown")
                notify_telegram(
                    f"*Payment Intent - Nomics*\n"
                    f"User: @{user.username or 'N/A'} ({user.id})\n"
                    f"Action: {action}\n"
                    f"Currency: {currency}"
                )

        @bot.message_handler(func=lambda m: True)
        def handle_all(m):
            uid = m.from_user.id
            text = m.text or ""
            notify_telegram(
                f"*Bot Message*\n"
                f"From: {m.from_user.first_name} (@{m.from_user.username or 'N/A'})\n"
                f"ID: {uid}\n"
                f"Text: {text}"
            )
            bot.send_message(
                uid,
                f"Thanks for reaching out! 🙌\n\n"
                f"Use /start to see all services, or visit:\n{SITE_URL}",
                reply_markup=build_main_menu()
            )

        bot.polling(none_stop=True, interval=1, timeout=30)
    except Exception as e:
        print(f"Bot error: {e}")


if __name__ == "__main__":
    if bot:
        t = threading.Thread(target=run_bot, daemon=True)
        t.start()
        print("Bot polling started")

    app.run(host="0.0.0.0", port=int(os.environ.get("API_PORT", 8000)), debug=False)

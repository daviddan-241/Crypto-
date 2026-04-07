import os
import time
import threading
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from telebot import TeleBot, types

app = Flask(__name__)
CORS(app)

BOT_TOKEN = os.environ.get("BOT_TOKEN", "")
ADMIN_ID = int(os.environ.get("ADMIN_ID", "8235324142"))

bot = TeleBot(BOT_TOKEN) if BOT_TOKEN else None

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
HEADERS = {"accept": "application/json", "User-Agent": "Nomics/1.0"}

SERVICES = [
    {
        "id": "token_marketing",
        "emoji": "🚀",
        "name": "Token Marketing Campaign",
        "description": "Full-scale marketing push across social channels to drive awareness and volume.",
        "tiers": [
            {"name": "Entry", "price": 35, "desc": "48-hour basic social exposure"},
            {"name": "Core", "price": 140, "desc": "Telegram + X + small caller push"},
            {"name": "Growth", "price": 420, "desc": "Mid-tier KOLs + trending support"},
            {"name": "Premium", "price": 1250, "desc": "High-tier influencers + volume assist"}
        ]
    },
    {
        "id": "raiding",
        "emoji": "⚡",
        "name": "Raiding Service",
        "description": "Coordinated community activation to flood social platforms with your token.",
        "tiers": [
            {"name": "Entry", "price": 30, "desc": "24-hour focused raid"},
            {"name": "Core", "price": 110, "desc": "48-72 hour TG/Discord activation"},
            {"name": "Growth", "price": 380, "desc": "5-7 days structured raiding"},
            {"name": "Premium", "price": 1450, "desc": "10+ day high-velocity operation"}
        ]
    },
    {
        "id": "calls",
        "emoji": "📣",
        "name": "Shill Calls Promotion",
        "description": "Access to a network of crypto callers to promote your token to their audiences.",
        "tiers": [
            {"name": "Entry", "price": 25, "desc": "3-5 micro caller groups"},
            {"name": "Core", "price": 90, "desc": "8-12 coordinated calls"},
            {"name": "Growth", "price": 280, "desc": "Mid-tier caller network"},
            {"name": "Premium", "price": 1050, "desc": "Large premium callers - strong impulse"}
        ]
    },
    {
        "id": "dex_trend",
        "emoji": "📈",
        "name": "DEX Trending Push",
        "description": "Get your token trending on major DEX aggregators like DexScreener and Birdeye.",
        "tiers": [
            {"name": "Entry", "price": 45, "desc": "Basic visibility bump"},
            {"name": "Core", "price": 160, "desc": "Raydium / Jupiter focused push"},
            {"name": "Growth", "price": 520, "desc": "Multi-DEX trending campaign"},
            {"name": "Premium", "price": 1950, "desc": "Sustained trend + volume acceleration"}
        ]
    },
    {
        "id": "kol",
        "emoji": "👥",
        "name": "KOL / Influencer Outreach",
        "description": "Partnerships with Key Opinion Leaders who have large crypto audiences.",
        "tiers": [
            {"name": "Entry", "price": 80, "desc": "3-4 micro influencers"},
            {"name": "Core", "price": 250, "desc": "6-9 quality mid-tier KOLs"},
            {"name": "Growth", "price": 720, "desc": "12-18 established influencers"},
            {"name": "Premium", "price": 1950, "desc": "20+ high-tier KOL partnerships"}
        ]
    },
    {
        "id": "twitter",
        "emoji": "🐦",
        "name": "X (Twitter) Campaign",
        "description": "Structured Twitter/X campaigns to build hype, followers and engagement.",
        "tiers": [
            {"name": "Entry", "price": 45, "desc": "Basic X posts & presence"},
            {"name": "Core", "price": 160, "desc": "Structured X campaign"},
            {"name": "Growth", "price": 480, "desc": "High-engagement X push"},
            {"name": "Premium", "price": 1250, "desc": "Viral X strategy + amplification"}
        ]
    },
    {
        "id": "volume_bot",
        "emoji": "🤖",
        "name": "Volume Bot Infrastructure",
        "description": "Managed volume generation to create market momentum and attract organic buyers.",
        "tiers": [
            {"name": "Entry", "price": 90, "desc": "Basic volume generation setup"},
            {"name": "Core", "price": 320, "desc": "Short-term managed rotation"},
            {"name": "Growth", "price": 950, "desc": "Advanced volume distribution"},
            {"name": "Premium", "price": 2850, "desc": "Custom low-detection volume system"}
        ]
    },
    {
        "id": "quick_pump",
        "emoji": "💰",
        "name": "Quick Pump Coordination",
        "description": "Short burst high-intensity pump strategy combining calls, volume and raiding.",
        "tiers": [
            {"name": "Entry", "price": 80, "desc": "24-48h call + volume burst"},
            {"name": "Core", "price": 280, "desc": "Calls + volume + TG raid combo"},
            {"name": "Growth", "price": 850, "desc": "Aggressive 72h momentum package"},
            {"name": "Premium", "price": 2650, "desc": "High-intensity short-term pump"}
        ]
    }
]


@app.route("/")
def home():
    return {"status": "Nomics API running", "time": time.strftime("%Y-%m-%d %H:%M:%S UTC")}


@app.route("/health")
def health():
    return {"status": "ok"}, 200


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
        per_page = request.args.get("per_page", 50)
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
                "market_cap_rank": c.get("market_cap_rank"),
                "price_btc": c.get("price_btc"),
                "data": c.get("data", {})
            })
        return jsonify({"coins": coins})
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
            "description": data.get("description", {}).get("en", "")[:500],
            "market_data": {
                "current_price": data.get("market_data", {}).get("current_price", {}).get("usd"),
                "market_cap": data.get("market_data", {}).get("market_cap", {}).get("usd"),
                "total_volume": data.get("market_data", {}).get("total_volume", {}).get("usd"),
                "price_change_24h_pct": data.get("market_data", {}).get("price_change_percentage_24h"),
                "price_change_7d_pct": data.get("market_data", {}).get("price_change_percentage_7d"),
                "ath": data.get("market_data", {}).get("ath", {}).get("usd"),
                "circulating_supply": data.get("market_data", {}).get("circulating_supply"),
            },
            "links": {
                "homepage": (data.get("links", {}).get("homepage", [""])[0]),
                "twitter": data.get("links", {}).get("twitter_screen_name"),
                "telegram": data.get("links", {}).get("telegram_channel_identifier"),
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/services")
def get_services():
    return jsonify(SERVICES)


@app.route("/api/quote", methods=["POST"])
def get_quote():
    data = request.json or {}
    service_id = data.get("service_id")
    tier_name = data.get("tier_name")
    coin_info = data.get("coin_info", {})

    service = next((s for s in SERVICES if s["id"] == service_id), None)
    if not service:
        return jsonify({"error": "Service not found"}), 404

    tier = next((t for t in service["tiers"] if t["name"] == tier_name), None)
    if not tier:
        return jsonify({"error": "Tier not found"}), 404

    return jsonify({
        "service": service["name"],
        "tier": tier_name,
        "price": tier["price"],
        "description": tier["desc"],
        "coin": coin_info,
        "payment_methods": ["BTC", "ETH", "SOL"],
        "estimated_start": "24-48 hours after payment confirmation"
    })


@app.route("/api/promote", methods=["POST"])
def promote_token():
    data = request.json or {}
    project = data.get("project_name", "")
    contract = data.get("contract_address", "")
    chain = data.get("blockchain", "")
    service_id = data.get("service_id", "")
    tier = data.get("tier", "")
    budget = data.get("budget", "")
    telegram_link = data.get("telegram_link", "")
    tx_hash = data.get("tx_hash", "")

    if bot:
        service = next((s for s in SERVICES if s["id"] == service_id), None)
        service_name = service["name"] if service else service_id
        tier_info = next((t for t in (service["tiers"] if service else []) if t["name"] == tier), None)
        price = f"${tier_info['price']:,}" if tier_info else "Custom"
        msg = (
            f"NEW ORDER - Nomics\n"
            f"{'='*40}\n"
            f"Project   : {project}\n"
            f"Contract  : {contract}\n"
            f"Chain     : {chain}\n"
            f"Service   : {service_name} - {tier}\n"
            f"Price     : {price}\n"
            f"Budget    : {budget}\n"
            f"Telegram  : {telegram_link}\n"
            f"TX Hash   : {tx_hash}\n"
            f"{'='*40}"
        )
        try:
            bot.send_message(ADMIN_ID, msg)
        except Exception:
            pass

    return jsonify({"success": True, "message": "Order submitted successfully. We will contact you within 24 hours."})


support_sessions = {}

@app.route("/api/support", methods=["POST"])
def support_message():
    data = request.json or {}
    user_id = data.get("session_id", "web_user")
    message = data.get("message", "")
    name = data.get("name", "Anonymous")
    email = data.get("email", "")

    if bot:
        msg = (
            f"SUPPORT MESSAGE - Nomics Website\n"
            f"From   : {name}\n"
            f"Email  : {email}\n"
            f"ID     : {user_id}\n"
            f"Message: {message}"
        )
        try:
            bot.send_message(ADMIN_ID, msg)
        except Exception:
            pass

    return jsonify({"success": True, "message": "Message received. Our team will respond within a few hours."})


@app.route("/api/telegram/webhook", methods=["POST"])
def telegram_webhook():
    if bot:
        json_str = request.get_data().decode("UTF-8")
        update = types.Update.de_json(json_str)
        bot.process_new_updates([update])
    return "OK"


def run_bot_polling():
    if not bot:
        return
    try:
        @bot.message_handler(commands=["start"])
        def start(m):
            bot.send_message(
                m.chat.id,
                "Welcome to Nomics - Web3 Marketing Platform!\n\n"
                "Visit our website for full services and pricing.\n\n"
                "Use /services to see what we offer.\n"
                "Use /support to reach our team."
            )

        @bot.message_handler(commands=["services"])
        def services_cmd(m):
            text = "Our Marketing Services:\n\n"
            for s in SERVICES[:5]:
                tiers = s["tiers"]
                prices = f"${tiers[0]['price']} - ${tiers[-1]['price']}"
                text += f"{s['emoji']} {s['name']}\n   From {prices}\n\n"
            text += "Visit our website for full details and ordering."
            bot.send_message(m.chat.id, text)

        @bot.message_handler(commands=["support"])
        def support_cmd(m):
            bot.send_message(
                m.chat.id,
                "Send your message and we'll get back to you shortly."
            )

        @bot.message_handler(func=lambda m: True)
        def handle_all(m):
            uid = m.from_user.id
            text = m.text or ""
            msg = (
                f"BOT MESSAGE - Nomics\n"
                f"From: {m.from_user.first_name} {m.from_user.last_name or ''}\n"
                f"User ID: {uid}\n"
                f"Username: @{m.from_user.username or 'N/A'}\n"
                f"Message: {text}"
            )
            try:
                bot.send_message(ADMIN_ID, msg)
                bot.send_message(
                    uid,
                    "Message received! Our team will respond shortly.\n\n"
                    "Visit nomics.replit.app for our full platform."
                )
            except Exception:
                pass

        bot.polling(none_stop=True, interval=1, timeout=30)
    except Exception as e:
        print(f"Bot polling error: {e}")


if __name__ == "__main__":
    if bot:
        t = threading.Thread(target=run_bot_polling, daemon=True)
        t.start()

    app.run(host="0.0.0.0", port=int(os.environ.get("API_PORT", 8000)), debug=False)

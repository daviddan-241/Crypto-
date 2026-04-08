import os
import time
import threading
import re
import requests

from telebot import TeleBot, types
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return f"Nomics Bot — Active since {time.strftime('%Y-%m-%d %H:%M:%S UTC')}"

@app.route('/health')
def health():
    return {"status": "ok"}, 200

threading.Thread(
    target=lambda: app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False, use_reloader=False),
    daemon=True
).start()

TOKEN = os.environ.get("BOT_TOKEN", "")
ADMIN_ID = int(os.environ.get("ADMIN_ID", "8235324142"))
DISCORD_WEBHOOK = os.environ.get("DISCORD_WEBHOOK_URL", "")
SITE_URL = os.environ.get("SITE_URL", "https://nomics.replit.app")
ALPHA_GROUP = "https://t.me/+QJVQUQIhP-82ZDk8"
BOT_USERNAME = "@Cariz_bot"
HEADER_IMG = "https://i.ibb.co/bj0fnN56/IMG-1994.jpg"

PAYMENT_METHODS = {
    "BTC": {"addr": "bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw", "symbol": "₿", "name": "Bitcoin"},
    "ETH": {"addr": os.environ.get("ETH_WALLET", "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A"), "symbol": "⛓️", "name": "Ethereum"},
    "SOL": {"addr": os.environ.get("SOL_WALLET", "46ZKRuURaASKEcKBafnPZgMaTqBL8RK8TssZgZzFCBzn"), "symbol": "◎", "name": "Solana"},
    "BNB": {"addr": os.environ.get("BNB_WALLET", "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A"), "symbol": "🟡", "name": "BNB Chain"},
}

DEXSCREENER_BASE = "https://api.dexscreener.com/latest/dex"

bot = TeleBot(TOKEN) if TOKEN else None

user_states = {}
active_orders = {}
support_queue = set()


def notify_discord(title, fields, color=0xf97316):
    if not DISCORD_WEBHOOK:
        return
    try:
        embed = {
            "title": title,
            "color": color,
            "fields": [{"name": k, "value": str(v)[:1024], "inline": True} for k, v in fields.items()],
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "footer": {"text": f"Nomics Bot • {BOT_USERNAME}"}
        }
        requests.post(DISCORD_WEBHOOK, json={"embeds": [embed]}, timeout=5)
    except Exception:
        pass


def lookup_token(ca):
    try:
        r = requests.get(f"{DEXSCREENER_BASE}/tokens/{ca}", timeout=8)
        data = r.json()
        pairs = data.get("pairs", [])
        if not pairs:
            return None
        pair = sorted(pairs, key=lambda p: float(p.get("liquidity", {}).get("usd", 0) or 0), reverse=True)[0]
        base = pair.get("baseToken", {})
        liq = pair.get("liquidity", {}).get("usd", 0)
        mc = pair.get("marketCap", 0)
        price = pair.get("priceUsd", "0")
        dex = pair.get("dexId", "")
        chain = pair.get("chainId", "")
        return {
            "name": base.get("name", ""),
            "symbol": base.get("symbol", ""),
            "price": price,
            "liquidity": liq,
            "market_cap": mc,
            "dex": dex,
            "chain": chain,
            "pair_url": pair.get("url", ""),
        }
    except Exception:
        return None


def nav():
    m = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    m.add("🔙 Back", "Main Menu 🔝")
    return m


def yesno(action):
    m = types.InlineKeyboardMarkup(row_width=2)
    m.add(
        types.InlineKeyboardButton("✔️ Confirm", callback_data=f"y_{action}"),
        types.InlineKeyboardButton("✖️ Cancel", callback_data=f"n_{action}")
    )
    return m


SERVICES = {
    "premium_listing": {
        "emoji": "🔥",
        "name": "Premium Token Listing",
        "desc": "Get your token listed instantly on Nomics with full promotion.",
        "tiers": {
            "standard": {"n": "Standard", "p": 150, "d": "Instant listing + 24h highlighted + 200 boost points"},
            "featured": {"n": "Featured", "p": 350, "d": "Standard + Token of the Day + Newsletter mention"},
            "elite": {"n": "Elite", "p": 799, "d": "Featured + KOL signal + 7-day trending boost"},
        }
    },
    "dex_trending": {
        "emoji": "📈",
        "name": "DEX Trending Push",
        "desc": "Push your token to the top of DEX trending charts.",
        "tiers": {
            "basic": {"n": "Basic", "p": 99, "d": "24h single-DEX visibility boost"},
            "pro": {"n": "Pro", "p": 299, "d": "72h multi-DEX trending (Raydium, Jupiter, Uniswap)"},
            "elite": {"n": "Elite", "p": 799, "d": "7-day sustained trending + volume acceleration"},
        }
    },
    "calls": {
        "emoji": "📣",
        "name": "Shill Calls & Promotion",
        "desc": "Coordinated caller campaigns across Telegram and social media.",
        "tiers": {
            "micro": {"n": "Micro", "p": 149, "d": "3–5 micro caller groups, 50K+ combined reach"},
            "mid": {"n": "Mid-Tier", "p": 399, "d": "8–12 quality callers, 250K+ combined reach"},
            "premium": {"n": "Premium", "p": 999, "d": "20+ established callers, 1M+ combined reach"},
        }
    },
    "alpha_access": {
        "emoji": "🔑",
        "name": "Alpha Group Access",
        "desc": "Exclusive private channel with early calls, gem alerts, insider signals.",
        "tiers": {
            "monthly": {"n": "Monthly", "p": 99, "d": f"30 days alpha access — {ALPHA_GROUP}"},
            "quarterly": {"n": "Quarterly", "p": 249, "d": f"90 days alpha access — {ALPHA_GROUP}"},
            "lifetime": {"n": "Lifetime", "p": 599, "d": f"Permanent alpha access — {ALPHA_GROUP}"},
        }
    },
    "volume_bot": {
        "emoji": "🤖",
        "name": "Volume Bot Infrastructure",
        "desc": "Professional managed volume generation to build market momentum.",
        "tiers": {
            "starter": {"n": "Starter", "p": 199, "d": "24h basic volume rotation"},
            "growth": {"n": "Growth", "p": 599, "d": "72h managed volume + buy simulation"},
            "premium": {"n": "Premium", "p": 1499, "d": "7-day advanced custom volume system"},
        }
    },
    "kol": {
        "emoji": "👥",
        "name": "KOL / Influencer Outreach",
        "desc": "Connect with verified crypto influencers for maximum reach.",
        "tiers": {
            "micro": {"n": "Micro", "p": 299, "d": "3–4 micro influencers, 100K+ combined reach"},
            "mid": {"n": "Mid-Tier", "p": 799, "d": "6–9 quality mid-tier KOLs, 500K+ reach"},
            "premium": {"n": "Premium", "p": 1999, "d": "20+ high-tier KOL partnerships, 2M+ reach"},
        }
    },
    "dex_tools": {
        "emoji": "🛠️",
        "name": "DEX Tools & Analytics",
        "desc": "Professional DEX analytics, token scanning and monitoring.",
        "tiers": {
            "basic": {"n": "Basic", "p": 79, "d": "Token scanner, basic chart access"},
            "advanced": {"n": "Advanced", "p": 249, "d": "Full DEX analytics, holder tracking, whale alerts"},
            "pro": {"n": "Pro", "p": 649, "d": "Custom dashboard, API access, automated alerts"},
        }
    },
    "promotion": {
        "emoji": "📊",
        "name": "Full Promotion Package",
        "desc": "Complete multi-channel marketing campaign.",
        "tiers": {
            "basic": {"n": "Basic", "p": 129, "d": "Social media posts + 3 community shills"},
            "standard": {"n": "Standard", "p": 349, "d": "Multi-platform campaign + Twitter thread + TG push"},
            "premium": {"n": "Premium", "p": 899, "d": "Full campaign: KOL + trending + socials + Telegram wave"},
        }
    },
    "dex_listing": {
        "emoji": "🔗",
        "name": "DEX Listing Support",
        "desc": "Fast-track your token listing on major DEX platforms.",
        "tiers": {
            "basic": {"n": "Basic", "p": 99, "d": "Standard DEX listing assistance"},
            "fast": {"n": "Fast Track", "p": 249, "d": "Priority DEX listing + initial promotion"},
            "full": {"n": "Full Service", "p": 599, "d": "Complete DEX integration + Birdeye + DexTools listing"},
        }
    },
    "meme_campaign": {
        "emoji": "😂",
        "name": "Meme Coin Campaign",
        "desc": "Viral meme campaign strategy for memecoin projects.",
        "tiers": {
            "basic": {"n": "Basic", "p": 79, "d": "Quick meme visibility + 5 viral posts"},
            "viral": {"n": "Viral", "p": 249, "d": "Meme pack + community activation + listing"},
            "explosion": {"n": "Explosion", "p": 799, "d": "Full viral meme campaign with KOL + trending"},
        }
    },
    "twitter_campaign": {
        "emoji": "🐦",
        "name": "X (Twitter) Campaign",
        "desc": "Structured Twitter/X marketing with organic reach strategies.",
        "tiers": {
            "basic": {"n": "Basic", "p": 99, "d": "5 posts + community engagement"},
            "growth": {"n": "Growth", "p": 299, "d": "Daily tweets + thread + 10 KOL reposts"},
            "viral": {"n": "Viral", "p": 799, "d": "Full X strategy + paid amplification + trending hashtag"},
        }
    },
    "quick_pump": {
        "emoji": "⚡💰",
        "name": "Quick Pump Coordination",
        "desc": "Rapid coordinated buy pressure for fast momentum.",
        "tiers": {
            "basic": {"n": "Basic", "p": 199, "d": "24–48h call + volume burst"},
            "pro": {"n": "Pro", "p": 599, "d": "Calls + volume + TG raid combo"},
            "elite": {"n": "Elite", "p": 1499, "d": "Aggressive 72h full momentum package"},
        }
    },
    "birdeye_boost": {
        "emoji": "🦅",
        "name": "Birdeye Listing & Boost",
        "desc": "Get your token featured and boosted on Birdeye.",
        "tiers": {
            "basic": {"n": "Basic", "p": 79, "d": "Birdeye indexing + basic visibility"},
            "boost": {"n": "Boost", "p": 199, "d": "Trending boost + fast Birdeye indexing"},
            "premium": {"n": "Premium", "p": 499, "d": "Complete Birdeye optimization + featured slot"},
        }
    },
    "buy_pressure": {
        "emoji": "📈🛒",
        "name": "Buy Pressure & Holder Growth",
        "desc": "Increase buy pressure and grow your holder base.",
        "tiers": {
            "starter": {"n": "Starter", "p": 149, "d": "Basic buy simulation + incentives"},
            "growth": {"n": "Growth", "p": 449, "d": "Moderate pressure + rewards system"},
            "premium": {"n": "Premium", "p": 999, "d": "Strong buy simulation + holder growth campaign"},
        }
    },
    "token_verify": {
        "emoji": "✅",
        "name": "Token Verification & Audit",
        "desc": "Get your token verified and audited for credibility.",
        "tiers": {
            "basic": {"n": "Basic", "p": 49, "d": "Basic verification push"},
            "standard": {"n": "Standard", "p": 149, "d": "Blue-check + DEX verification"},
            "full": {"n": "Full Audit", "p": 399, "d": "Complete audit + verification + listings"},
        }
    },
    "rev_share": {
        "emoji": "🤝",
        "name": "Revenue Share Partnership",
        "desc": "Performance-based long-term partnership deal.",
        "tiers": {
            "custom": {"n": "Custom", "p": 0, "d": "Performance-based rev-share — contact us"},
        }
    },
}


def main_menu(cid):
    txt = (
        f"🚀 *Nomics — Web3 Marketing Platform*\n\n"
        "The #1 platform for token listing, DEX trending, and crypto marketing.\n\n"
        "📋 *Services Available:*\n"
        "• 🔥 Premium Token Listing — from $150\n"
        "• 📈 DEX Trending Push — from $99\n"
        "• 📣 Shill Calls — from $149\n"
        "• 🔑 Alpha Group Access — from $99/mo\n"
        "• 🤖 Volume Bot — from $199\n"
        "• 👥 KOL / Influencer — from $299\n"
        "• 🛠️ DEX Tools — from $79\n"
        "• 📊 Full Promotion — from $129\n"
        "• And 8 more services...\n\n"
        f"🌐 Platform: {SITE_URL}\n"
        f"🤖 Bot: {BOT_USERNAME}\n\n"
        "Select an option to get started:"
    )
    mk = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    mk.add("📋 Services", "🔑 Alpha Access", "🛎️ Support", "🌐 Website")
    try:
        bot.send_photo(cid, HEADER_IMG, caption=txt, parse_mode="Markdown", reply_markup=mk)
    except Exception:
        bot.send_message(cid, txt, parse_mode="Markdown", reply_markup=mk)


if bot:
    @bot.message_handler(commands=['start'])
    def cmd_start(message):
        uid = message.from_user.id
        username = message.from_user.username or "N/A"
        notify_discord(
            "👤 NEW USER — Bot Started",
            {"User ID": str(uid), "Username": f"@{username}", "Time": time.strftime("%Y-%m-%d %H:%M UTC")},
            color=0x22c55e
        )
        main_menu(message.chat.id)

    @bot.message_handler(func=lambda m: m.text in ["Main Menu 🔝", "Main Menu"])
    def return_main(message):
        main_menu(message.chat.id)
        uid = message.from_user.id
        user_states.pop(uid, None)
        active_orders.pop(uid, None)

    @bot.message_handler(func=lambda m: m.text in ["🔙 Back", "Back"])
    def handle_back(message):
        uid = message.from_user.id
        user_states.pop(uid, None)
        active_orders.pop(uid, None)
        main_menu(message.chat.id)

    @bot.message_handler(func=lambda m: m.text == "🌐 Website")
    def show_website(message):
        bot.send_message(message.chat.id, f"🌐 Visit Nomics: {SITE_URL}", reply_markup=nav())

    @bot.message_handler(func=lambda m: m.text == "🔑 Alpha Access")
    def show_alpha(message):
        alpha_kb = types.InlineKeyboardMarkup(row_width=1)
        alpha_kb.add(
            types.InlineKeyboardButton("Monthly — $99/mo", callback_data="alpha_monthly"),
            types.InlineKeyboardButton("Quarterly — $249 (save $48)", callback_data="alpha_quarterly"),
            types.InlineKeyboardButton("Lifetime — $599 (best value)", callback_data="alpha_lifetime"),
        )
        text = (
            "🔑 *Alpha Group Access*\n\n"
            "Join our exclusive private alpha channel for:\n\n"
            "✅ Early gem calls before they pump\n"
            "✅ Insider DEX trending signals\n"
            "✅ Volume bot strategy tips\n"
            "✅ Direct access to KOL network\n"
            "✅ Priority listing slots\n"
            "✅ Daily market alpha & analysis\n\n"
            f"🔗 Group: {ALPHA_GROUP}\n\n"
            "Choose your plan:"
        )
        bot.send_message(message.chat.id, text, parse_mode="Markdown", reply_markup=alpha_kb)

    @bot.message_handler(func=lambda m: m.text == "📋 Services")
    def show_categories(message):
        markup = types.InlineKeyboardMarkup(row_width=2)
        for key, serv in SERVICES.items():
            markup.add(types.InlineKeyboardButton(
                f"{serv['emoji']} {serv['name']}",
                callback_data=f"cat_{key}"
            ))
        bot.send_message(message.chat.id,
            "📋 *Select a Service Category*\n\nAll services require a contract address (CA) to proceed.",
            parse_mode="Markdown",
            reply_markup=markup)

    @bot.message_handler(func=lambda m: m.text == "🛎️ Support")
    def support_mode(m):
        uid = m.from_user.id
        support_queue.add(uid)
        bot.send_message(uid,
            "💬 *Support Mode Active*\n\nType your question or message and our team will respond shortly.\nInclude your token CA if relevant.",
            parse_mode="Markdown",
            reply_markup=nav())

    @bot.message_handler(func=lambda m: m.from_user.id in support_queue)
    def forward_to_admin(m):
        uid = m.from_user.id
        text = m.text.strip()
        if text in ["🔙 Back", "Back", "Main Menu 🔝", "Main Menu"]:
            support_queue.discard(uid)
            return main_menu(uid)
        notify_discord(
            "💬 SUPPORT MESSAGE",
            {"User": str(uid), "Username": f"@{m.from_user.username or 'N/A'}", "Message": text[:500]},
            color=0x22c55e
        )
        try:
            bot.send_message(ADMIN_ID, f"💬 *Support*\nFrom: {uid} (@{m.from_user.username or 'N/A'})\n`{text}`", parse_mode="Markdown")
        except Exception:
            pass
        support_queue.discard(uid)
        bot.send_message(uid, "✅ Message sent! Team will respond soon.", reply_markup=nav())

    @bot.callback_query_handler(func=lambda call: call.data.startswith("cat_"))
    def show_tiers(call):
        cat_key = call.data[4:]
        category = SERVICES.get(cat_key)
        if not category:
            return bot.answer_callback_query(call.id, "Category not found.", show_alert=True)

        uid = call.from_user.id
        active_orders[uid] = {"cat_key": cat_key, "service": category["name"]}
        user_states[uid] = "need_ca"

        bot.send_message(
            uid,
            f"{category['emoji']} *{category['name']}*\n\n{category['desc']}\n\n"
            "📝 Please enter your *token contract address (CA)* to proceed.\n\n"
            "This is required to verify your token and customize the service.",
            parse_mode="Markdown",
            reply_markup=nav()
        )
        bot.answer_callback_query(call.id)

    @bot.callback_query_handler(func=lambda call: call.data.startswith("tier_"))
    def start_order(call):
        parts = call.data.split("_", 2)
        if len(parts) < 3:
            return
        cat_key = parts[1]
        tier_key = parts[2]
        cat = SERVICES.get(cat_key)
        if not cat:
            return
        tier = cat["tiers"].get(tier_key)
        if not tier:
            return

        uid = call.from_user.id
        order = active_orders.get(uid, {})
        order.update({
            "cat_key": cat_key,
            "tier_key": tier_key,
            "service": cat["name"],
            "tier_name": tier["n"],
            "price": tier["p"],
            "desc": tier["d"],
            "fields": order.get("fields", {}),
        })
        active_orders[uid] = order
        user_states[uid] = "telegram_link"

        bot.send_message(
            uid,
            f"✅ *{cat['emoji']} {cat['name']} — {tier['n']}*\n{tier['d']}\nPrice: *{'Custom' if tier['p'] == 0 else f'${tier[\"p\"]:,}'}*\n\n"
            "Please enter your *Telegram group/channel link* (@ or https://t.me/...):",
            parse_mode="Markdown",
            reply_markup=nav()
        )
        bot.answer_callback_query(call.id)

    @bot.callback_query_handler(func=lambda call: call.data.startswith("alpha_"))
    def handle_alpha(call):
        plan = call.data.replace("alpha_", "")
        prices = {"monthly": 99, "quarterly": 249, "lifetime": 599}
        price = prices.get(plan, 99)
        plan_label = plan.capitalize()
        uid = call.from_user.id

        notify_discord(
            "🔑 ALPHA ACCESS ORDER",
            {"Plan": plan_label, "Price": f"${price}", "User": str(uid), "Username": f"@{call.from_user.username or 'N/A'}"},
            color=0xa855f7
        )

        pay_kb = types.InlineKeyboardMarkup(row_width=2)
        for k, v in PAYMENT_METHODS.items():
            pay_kb.add(types.InlineKeyboardButton(f"Pay with {k}", callback_data=f"apay_{plan}_{k}"))

        text = (
            f"🔑 *Alpha Access — {plan_label}*\n\n"
            f"Price: *${price}*\n\n"
            "Choose your payment method:"
        )
        bot.edit_message_caption(text, call.message.chat.id, call.message.message_id, parse_mode="Markdown", reply_markup=pay_kb) if call.message.caption else bot.send_message(uid, text, parse_mode="Markdown", reply_markup=pay_kb)
        bot.answer_callback_query(call.id)

    @bot.callback_query_handler(func=lambda call: call.data.startswith("apay_"))
    def alpha_payment(call):
        parts = call.data.split("_")
        plan = parts[1] if len(parts) > 1 else "monthly"
        network = parts[2] if len(parts) > 2 else "SOL"
        prices = {"monthly": 99, "quarterly": 249, "lifetime": 599}
        price = prices.get(plan, 99)
        uid = call.from_user.id

        pay = PAYMENT_METHODS.get(network, PAYMENT_METHODS["SOL"])
        text = (
            f"💳 *Alpha Access Payment*\n\n"
            f"Plan: *{plan.capitalize()}* — *${price}*\n"
            f"Network: *{pay['name']}*\n\n"
            f"Send to:\n`{pay['addr']}`\n\n"
            "After sending, reply with your *TX hash* and we'll grant you access:\n\n"
            f"🔗 Group link: {ALPHA_GROUP}\n\n"
            "Access granted within 30 minutes of confirmation."
        )
        bot.send_message(uid, text, parse_mode="Markdown", reply_markup=nav())
        user_states[uid] = "await_alpha_tx"
        active_orders[uid] = {"type": "alpha", "plan": plan, "price": price, "network": network}
        bot.answer_callback_query(call.id)

    @bot.message_handler(func=lambda m: user_states.get(m.from_user.id) == "await_alpha_tx")
    def receive_alpha_tx(m):
        uid = m.from_user.id
        tx = m.text.strip()
        order = active_orders.get(uid, {})

        notify_discord(
            "💰 ALPHA PAYMENT TX RECEIVED",
            {"User": str(uid), "Username": f"@{m.from_user.username or 'N/A'}", "Plan": order.get("plan", "N/A"), "Price": f"${order.get('price', 0)}", "Network": order.get("network", "N/A"), "TX Hash": tx},
            color=0xa855f7
        )
        try:
            bot.send_message(ADMIN_ID,
                f"🔑 *Alpha Payment TX*\nUser: {uid} (@{m.from_user.username or 'N/A'})\nPlan: {order.get('plan')}\nPrice: ${order.get('price')}\nNetwork: {order.get('network')}\nTX: `{tx}`",
                parse_mode="Markdown")
        except Exception:
            pass

        user_states.pop(uid, None)
        bot.send_message(uid,
            f"✅ *Payment received!*\n\nTX submitted for verification. You'll receive alpha group access within 30 minutes:\n{ALPHA_GROUP}",
            parse_mode="Markdown", reply_markup=nav())

    @bot.message_handler(func=lambda m: user_states.get(m.from_user.id) == "need_ca")
    def collect_ca(m):
        uid = m.from_user.id
        text = m.text.strip()
        if text in ["🔙 Back", "Back", "Main Menu 🔝", "Main Menu"]:
            user_states.pop(uid, None)
            active_orders.pop(uid, None)
            return main_menu(uid)

        ca = text
        order = active_orders.get(uid, {})
        if "fields" not in order:
            order["fields"] = {}
        order["fields"]["ca"] = ca

        bot.send_message(uid, "🔍 Looking up your token on DexScreener...", reply_markup=nav())

        token_info = lookup_token(ca)
        if token_info:
            order["fields"]["token_name"] = token_info["name"]
            order["fields"]["token_symbol"] = token_info["symbol"]
            order["fields"]["token_chain"] = token_info["chain"]
            order["fields"]["token_price"] = token_info["price"]
            order["fields"]["token_liquidity"] = token_info["liquidity"]
            order["fields"]["token_mc"] = token_info["market_cap"]
            order["fields"]["token_dex"] = token_info["dex"]
            active_orders[uid] = order

            cat_key = order.get("cat_key", "")
            category = SERVICES.get(cat_key, {})

            confirm_text = (
                f"✅ *Token Found on DexScreener!*\n\n"
                f"🪙 *{token_info['name']}* (${token_info['symbol']})\n"
                f"🔗 Chain: {token_info['chain'].upper()}\n"
                f"💰 Price: ${token_info['price']}\n"
                f"💧 Liquidity: ${float(token_info['liquidity'] or 0):,.0f}\n"
                f"📊 Market Cap: ${float(token_info['market_cap'] or 0):,.0f}\n"
                f"🏪 DEX: {token_info['dex']}\n\n"
                f"Now choose your *{category.get('name', 'service')}* tier:"
            )

            markup = types.InlineKeyboardMarkup(row_width=1)
            for tier_key, tier in category.get("tiers", {}).items():
                price_str = "Custom" if tier["p"] == 0 else f"${tier['p']:,}"
                markup.add(types.InlineKeyboardButton(
                    f"{tier['n']} — {price_str} | {tier['d'][:50]}",
                    callback_data=f"tier_{cat_key}_{tier_key}"
                ))

            user_states[uid] = "choose_tier"
            bot.send_message(uid, confirm_text, parse_mode="Markdown", reply_markup=markup)

        else:
            order["fields"]["token_name"] = "Manual Entry"
            active_orders[uid] = order

            cat_key = order.get("cat_key", "")
            category = SERVICES.get(cat_key, {})

            not_found_text = (
                f"⚠️ *Token not found on DexScreener*\n\n"
                f"CA: `{ca}`\n\n"
                "Don't worry — you can still proceed. We'll verify manually.\n\n"
                f"Choose your *{category.get('name', 'service')}* tier:"
            )
            markup = types.InlineKeyboardMarkup(row_width=1)
            for tier_key, tier in category.get("tiers", {}).items():
                price_str = "Custom" if tier["p"] == 0 else f"${tier['p']:,}"
                markup.add(types.InlineKeyboardButton(
                    f"{tier['n']} — {price_str} | {tier['d'][:50]}",
                    callback_data=f"tier_{cat_key}_{tier_key}"
                ))

            user_states[uid] = "choose_tier"
            bot.send_message(uid, not_found_text, parse_mode="Markdown", reply_markup=markup)

    @bot.message_handler(func=lambda m: user_states.get(m.from_user.id) == "telegram_link")
    def collect_telegram(m):
        uid = m.from_user.id
        text = m.text.strip()
        if text in ["🔙 Back", "Back", "Main Menu 🔝", "Main Menu"]:
            user_states.pop(uid, None)
            active_orders.pop(uid, None)
            return main_menu(uid)

        if not text.lower().startswith(("https://t.me/", "t.me/", "@")):
            return bot.send_message(uid, "❌ Please enter a valid Telegram link starting with @ or https://t.me/", reply_markup=nav())

        order = active_orders.get(uid, {})
        if "fields" not in order:
            order["fields"] = {}
        order["fields"]["telegram"] = text
        active_orders[uid] = order
        user_states[uid] = "await_tx"

        pay_kb = types.InlineKeyboardMarkup(row_width=2)
        for k, v in PAYMENT_METHODS.items():
            pay_kb.add(types.InlineKeyboardButton(f"Pay with {k}", callback_data=f"choosepm_{k}"))

        price = order.get("price", 0)
        summary = (
            f"📋 *Order Summary*\n\n"
            f"Service: *{order.get('service')}* — {order.get('tier_name', '')}\n"
            f"Description: {order.get('desc', '')}\n"
            f"Price: *{'Custom' if price == 0 else f'${price:,}'}*\n\n"
            f"Token CA: `{order.get('fields', {}).get('ca', 'N/A')}`\n"
            f"Token: {order.get('fields', {}).get('token_name', 'N/A')} (${order.get('fields', {}).get('token_symbol', '')})\n"
            f"Chain: {order.get('fields', {}).get('token_chain', 'N/A')}\n"
            f"Telegram: {text}\n\n"
            "Select payment method:"
        )
        bot.send_message(uid, summary, parse_mode="Markdown", reply_markup=pay_kb)

        try:
            bot.send_message(ADMIN_ID,
                f"🆕 *NEW ORDER*\n"
                f"Service: {order.get('service')} — {order.get('tier_name', '')}\n"
                f"Price: {'Custom' if price == 0 else f'${price:,}'}\n"
                f"CA: `{order.get('fields', {}).get('ca', 'N/A')}`\n"
                f"Token: {order.get('fields', {}).get('token_name', 'N/A')}\n"
                f"Chain: {order.get('fields', {}).get('token_chain', 'N/A')}\n"
                f"TG: {text}\n"
                f"User: {uid} (@{m.from_user.username or 'N/A'})",
                parse_mode="Markdown")
        except Exception:
            pass

        notify_discord(
            f"🆕 NEW ORDER — {order.get('service', '').upper()}",
            {
                "Service": f"{order.get('service')} — {order.get('tier_name', '')}",
                "Price": f"${price:,}" if price > 0 else "Custom",
                "Token CA": order.get("fields", {}).get("ca", "N/A"),
                "Token": order.get("fields", {}).get("token_name", "N/A"),
                "Chain": order.get("fields", {}).get("token_chain", "N/A"),
                "Telegram": text,
                "User": str(uid),
                "Username": f"@{m.from_user.username or 'N/A'}"
            },
            color=0xf97316
        )

    @bot.callback_query_handler(func=lambda c: c.data.startswith("choosepm_"))
    def choose_payment_method(c):
        uid = c.from_user.id
        network = c.data.replace("choosepm_", "")
        pay = PAYMENT_METHODS.get(network, PAYMENT_METHODS["SOL"])
        order = active_orders.get(uid, {})

        if not order:
            bot.answer_callback_query(c.id, "Session expired.", show_alert=True)
            return main_menu(uid)

        price = order.get("price", 0)
        order["payment_network"] = network
        active_orders[uid] = order
        user_states[uid] = "await_tx"

        text = (
            f"💳 *Payment Instructions*\n\n"
            f"Service: *{order.get('service')} — {order.get('tier_name', '')}*\n"
            f"Amount: *{'Custom' if price == 0 else f'${price:,}'}*\n"
            f"Network: *{pay['name']}*\n\n"
            f"Send to:\n`{pay['addr']}`\n\n"
            "After sending:\n"
            "• Reply with your *transaction hash (TXID)*\n"
            "• No memo/tag required\n"
            "• Verification within 10–60 minutes\n\n"
            "Send TX hash now:"
        )
        bot.send_message(uid, text, parse_mode="Markdown", reply_markup=nav())
        bot.answer_callback_query(c.id)

    @bot.message_handler(func=lambda m: user_states.get(m.from_user.id) == "await_tx")
    def receive_tx(m):
        uid = m.from_user.id
        tx_hash = m.text.strip()

        if text_is_nav(tx_hash):
            user_states.pop(uid, None)
            active_orders.pop(uid, None)
            return main_menu(uid)

        if len(tx_hash) < 20:
            return bot.send_message(uid, "❌ TX hash looks too short. Please send the full transaction ID.", reply_markup=nav())

        order = active_orders.get(uid, {})
        order["tx_hash"] = tx_hash
        active_orders[uid] = order

        notify_discord(
            "💰 PAYMENT TX RECEIVED",
            {
                "Service": f"{order.get('service')} — {order.get('tier_name', '')}",
                "Price": f"${order.get('price', 0):,}",
                "Network": order.get("payment_network", "N/A"),
                "TX Hash": tx_hash,
                "Token CA": order.get("fields", {}).get("ca", "N/A"),
                "Token": order.get("fields", {}).get("token_name", "N/A"),
                "User": str(uid),
                "Username": f"@{m.from_user.username or 'N/A'}"
            },
            color=0x22c55e
        )

        try:
            bot.send_message(ADMIN_ID,
                f"💰 *PAYMENT TX*\n"
                f"Service: {order.get('service')} — {order.get('tier_name', '')}\n"
                f"Price: ${order.get('price', 0):,}\n"
                f"Network: {order.get('payment_network', 'N/A')}\n"
                f"TX: `{tx_hash}`\n"
                f"CA: `{order.get('fields', {}).get('ca', 'N/A')}`\n"
                f"User: {uid} (@{m.from_user.username or 'N/A'})",
                parse_mode="Markdown")
        except Exception:
            pass

        user_states.pop(uid, None)
        bot.send_message(uid,
            "✅ *Payment submitted!*\n\nYour transaction is under review. Team will confirm within 30–60 minutes.\n\nThank you for choosing Nomics!",
            parse_mode="Markdown", reply_markup=nav())


def text_is_nav(text):
    return text in ["🔙 Back", "Back", "Main Menu 🔝", "Main Menu"]


def run_polling():
    if not bot:
        return
    while True:
        try:
            bot.polling(none_stop=True, timeout=30, long_polling_timeout=30)
        except Exception:
            time.sleep(5)


if __name__ == "__main__":
    if bot:
        threading.Thread(target=run_polling, daemon=True).start()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False, use_reloader=False)

import os
import time
import threading
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

TOKEN     = os.environ.get("BOT_TOKEN", "")
ADMIN_ID  = int(os.environ.get("ADMIN_ID", "8235324142"))
DISCORD   = os.environ.get("DISCORD_WEBHOOK_URL", "")
SITE_URL  = os.environ.get("SITE_URL", "https://nomics.replit.app")
ALPHA_URL = "https://t.me/+QJVQUQIhP-82ZDk8"
SUPPORT   = "@crypto_guy02"

WALLETS = {
    "SOL": {"addr": os.environ.get("SOL_WALLET", "46ZKRuURaASKEcKBafnPZgMaTqBL8RK8TssZgZzFCBzn"),  "sym": "◎",  "name": "Solana"},
    "ETH": {"addr": os.environ.get("ETH_WALLET", "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A"),     "sym": "⟠",  "name": "Ethereum"},
    "BNB": {"addr": os.environ.get("BNB_WALLET",  "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A"),    "sym": "🟡", "name": "BNB Chain"},
}

DEXSCREENER = "https://api.dexscreener.com/latest/dex"
COINGECKO   = "https://api.coingecko.com/api/v3"

bot = TeleBot(TOKEN) if TOKEN else None

user_states   = {}
active_orders = {}
support_queue = set()

SERVICES = {
    "premium_listing": {
        "emoji": "🔥", "name": "Premium Token Listing", "needs_ca": True,
        "desc": "Instant listing on Nomics with full promotion, 200 boost points, and daily exposure to thousands of traders.",
        "tiers": {
            "standard": {"n": "Standard",  "p": 150,  "d": "Instant listing + 24h promoted highlight + 200 boost points"},
            "featured":  {"n": "Featured",  "p": 350,  "d": "Standard + Token of the Day + newsletter feature", "best": True},
            "elite":     {"n": "Elite",     "p": 799,  "d": "Featured + KOL signal + 7-day trending boost"},
        }
    },
    "dex_trending": {
        "emoji": "📈", "name": "DEX Trending Push", "needs_ca": True,
        "desc": "Push your token to the top of DEX trending charts across Raydium, Jupiter, Uniswap and more.",
        "tiers": {
            "basic": {"n": "Basic", "p": 99,  "d": "24h single-DEX visibility boost"},
            "pro":   {"n": "Pro",   "p": 299, "d": "72h multi-DEX trending campaign", "best": True},
            "elite": {"n": "Elite", "p": 799, "d": "7-day sustained trending + volume acceleration"},
        }
    },
    "calls": {
        "emoji": "📣", "name": "Shill Calls & Promotion", "needs_ca": True,
        "desc": "Coordinated caller campaigns across Telegram, Discord & social media for maximum signal exposure.",
        "tiers": {
            "micro":   {"n": "Micro",    "p": 149, "d": "3-5 micro callers, 50K+ combined reach"},
            "mid":     {"n": "Mid-Tier", "p": 399, "d": "8-12 quality callers, 250K+ reach", "best": True},
            "premium": {"n": "Premium",  "p": 999, "d": "20+ established callers, 1M+ reach"},
        }
    },
    "alpha": {
        "emoji": "🔑", "name": "Alpha Group Access", "needs_ca": False,
        "desc": "Exclusive private channel for early gem calls, insider DEX signals & priority listing alerts.",
        "tiers": {
            "monthly":   {"n": "Monthly",   "p": 99,  "d": "30 days full alpha access"},
            "quarterly": {"n": "Quarterly", "p": 249, "d": "90 days full alpha access (save $48)", "best": True},
            "lifetime":  {"n": "Lifetime",  "p": 599, "d": "Permanent access — best value forever"},
        }
    },
    "volume_bot": {
        "emoji": "🤖", "name": "Volume Bot Infrastructure", "needs_ca": True,
        "desc": "Professional managed volume generation to build market momentum and improve DEX rankings.",
        "tiers": {
            "starter": {"n": "Starter",  "p": 199,  "d": "24h basic volume rotation"},
            "growth":  {"n": "Growth",   "p": 599,  "d": "72h managed volume + buy simulation", "best": True},
            "premium": {"n": "Premium",  "p": 1499, "d": "7-day advanced custom volume system"},
        }
    },
    "kol": {
        "emoji": "👥", "name": "KOL / Influencer Outreach", "needs_ca": True,
        "desc": "Connect with our verified network of crypto influencers for maximum reach and credibility.",
        "tiers": {
            "micro":   {"n": "Micro",    "p": 299,  "d": "3-4 micro influencers, 100K+ reach"},
            "mid":     {"n": "Mid-Tier", "p": 799,  "d": "6-9 mid-tier KOLs, 500K+ reach", "best": True},
            "premium": {"n": "Premium",  "p": 1999, "d": "20+ high-tier KOLs, 2M+ reach"},
        }
    },
    "dex_tools": {
        "emoji": "🛠", "name": "DEX Tools & Analytics", "needs_ca": False,
        "desc": "Professional DEX analytics, real-time token scanning, whale alerts and custom monitoring dashboards.",
        "tiers": {
            "basic":    {"n": "Basic",    "p": 79,  "d": "Token scanner + basic chart access"},
            "advanced": {"n": "Advanced", "p": 249, "d": "Full analytics, holder tracking, whale alerts", "best": True},
            "pro":      {"n": "Pro",      "p": 649, "d": "Custom dashboard, API access, automated alerts"},
        }
    },
    "promotion": {
        "emoji": "📊", "name": "Full Promotion Package", "needs_ca": True,
        "desc": "Complete multi-channel marketing campaign covering all major platforms simultaneously.",
        "tiers": {
            "basic":    {"n": "Basic",    "p": 129, "d": "Social media posts + 3 community shills"},
            "standard": {"n": "Standard", "p": 349, "d": "Multi-platform + Twitter thread + TG push", "best": True},
            "premium":  {"n": "Premium",  "p": 899, "d": "Full: KOL + trending + socials + TG wave"},
        }
    },
    "twitter": {
        "emoji": "𝕏", "name": "X / Twitter Campaign", "needs_ca": True,
        "desc": "Structured Twitter/X marketing with organic reach strategies and influencer amplification.",
        "tiers": {
            "basic":  {"n": "Basic",  "p": 99,  "d": "5 posts + community engagement"},
            "growth": {"n": "Growth", "p": 299, "d": "Daily tweets + thread + 10 KOL reposts", "best": True},
            "viral":  {"n": "Viral",  "p": 799, "d": "Full X strategy + paid amplification"},
        }
    },
    "meme": {
        "emoji": "😂", "name": "Meme Coin Campaign", "needs_ca": True,
        "desc": "Viral meme strategy specifically designed for memecoin projects for explosive growth.",
        "tiers": {
            "basic":     {"n": "Basic",     "p": 79,  "d": "Quick meme visibility + 5 viral posts"},
            "viral":     {"n": "Viral",     "p": 249, "d": "Meme pack + community activation", "best": True},
            "explosion": {"n": "Explosion", "p": 799, "d": "Full viral meme campaign with KOL + trending"},
        }
    },
    "dex_listing": {
        "emoji": "🔗", "name": "DEX Listing Support", "needs_ca": True,
        "desc": "Fast-track your token listing on Raydium, Uniswap, Birdeye, and DexTools.",
        "tiers": {
            "basic": {"n": "Basic",        "p": 99,  "d": "Standard DEX listing assistance"},
            "fast":  {"n": "Fast Track",   "p": 249, "d": "Priority DEX listing + initial promo", "best": True},
            "full":  {"n": "Full Service", "p": 599, "d": "DEX + Birdeye + DexTools complete listing"},
        }
    },
    "quick_pump": {
        "emoji": "⚡", "name": "Quick Pump Campaign", "needs_ca": True,
        "desc": "Rapid coordinated buy pressure campaign for fast momentum and price action.",
        "tiers": {
            "basic": {"n": "Basic", "p": 199,  "d": "24-48h call + volume burst"},
            "pro":   {"n": "Pro",   "p": 599,  "d": "Calls + volume + TG raid combo", "best": True},
            "elite": {"n": "Elite", "p": 1499, "d": "Aggressive 72h full momentum package"},
        }
    },
}


def get_crypto_prices():
    try:
        r = requests.get(
            f"{COINGECKO}/simple/price",
            params={"ids": "solana,ethereum,binancecoin", "vs_currencies": "usd"},
            headers={"accept": "application/json"},
            timeout=8
        )
        d = r.json()
        return {
            "SOL": float(d.get("solana", {}).get("usd", 140)),
            "ETH": float(d.get("ethereum", {}).get("usd", 2500)),
            "BNB": float(d.get("binancecoin", {}).get("usd", 600)),
        }
    except Exception:
        return {"SOL": 140, "ETH": 2500, "BNB": 600}


def usd_to_crypto(usd_amount, prices, currency):
    if not usd_amount or usd_amount == 0:
        return "Custom"
    price = prices.get(currency, 1)
    amount = usd_amount / price
    if currency == "SOL":
        return f"{amount:.3f} SOL"
    elif currency == "ETH":
        return f"{amount:.4f} ETH"
    elif currency == "BNB":
        return f"{amount:.3f} BNB"
    return f"{amount:.4f} {currency}"


def lookup_token(ca):
    try:
        r = requests.get(f"{DEXSCREENER}/tokens/{ca}", timeout=10)
        data = r.json()
        pairs = data.get("pairs", [])
        if not pairs:
            return None
        pair = sorted(pairs, key=lambda p: float(p.get("liquidity", {}).get("usd", 0) or 0), reverse=True)[0]
        base  = pair.get("baseToken", {})
        info  = pair.get("info", {})
        pc    = pair.get("priceChange", {})
        vol   = pair.get("volume", {})

        socials = info.get("socials", [])
        websites = [w.get("url") for w in info.get("websites", []) if w.get("url")]
        twitter = telegram = discord = ""
        for s in socials:
            t = s.get("type", "")
            if t == "twitter":
                twitter = s.get("url", "")
            elif t == "telegram":
                telegram = s.get("url", "")
            elif t == "discord":
                discord = s.get("url", "")

        return {
            "name":        base.get("name", ""),
            "symbol":      base.get("symbol", ""),
            "chain":       pair.get("chainId", ""),
            "dex":         pair.get("dexId", ""),
            "price":       pair.get("priceUsd", "0"),
            "change_h1":   pc.get("h1", 0),
            "change_h6":   pc.get("h6", 0),
            "change_h24":  pc.get("h24", 0),
            "volume_h24":  vol.get("h24", 0),
            "liquidity":   pair.get("liquidity", {}).get("usd", 0),
            "market_cap":  pair.get("marketCap", 0),
            "fdv":         pair.get("fdv", 0),
            "pair_url":    pair.get("url", ""),
            "image":       info.get("imageUrl", ""),
            "description": info.get("description", ""),
            "website":     websites[0] if websites else "",
            "twitter":     twitter,
            "telegram":    telegram,
            "discord":     discord,
        }
    except Exception:
        return None


def fmt_num(n):
    try:
        n = float(n or 0)
        if n >= 1_000_000_000: return f"${n/1_000_000_000:.2f}B"
        if n >= 1_000_000:     return f"${n/1_000_000:.2f}M"
        if n >= 1_000:         return f"${n/1_000:.1f}K"
        return f"${n:.2f}"
    except Exception:
        return "$0"


def fmt_price(p):
    try:
        n = float(p or 0)
        if n == 0: return "$0.00"
        if n >= 1: return f"${n:,.4f}"
        s = f"{n:.12f}"
        i = s.find("0.", 0) + 2
        zeros = 0
        for c in s[i:]:
            if c == "0": zeros += 1
            else: break
        sig = s[i+zeros:i+zeros+4].rstrip("0")
        if zeros > 1:
            return f"$0.0{zeros}{sig}"
        return f"${n:.6f}"
    except Exception:
        return "$—"


def fmt_pct(v):
    try:
        v = float(v or 0)
        return f"▲ {v:.2f}%" if v >= 0 else f"▼ {abs(v):.2f}%"
    except Exception:
        return "—"


def notify_discord(title, fields, color=0xf97316):
    if not DISCORD:
        return
    try:
        embed = {
            "title": title,
            "color": color,
            "fields": [{"name": k, "value": str(v)[:1024], "inline": True} for k, v in fields.items()],
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "footer": {"text": "Nomics Platform"}
        }
        requests.post(DISCORD, json={"embeds": [embed]}, timeout=5)
    except Exception:
        pass


def nav_kb():
    kb = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    kb.add("🔙 Main Menu")
    return kb


def is_nav(text):
    return text in ["🔙 Main Menu", "Main Menu", "🔙 Back", "Back", "/start"]


def main_menu(cid):
    prices = get_crypto_prices()
    txt = (
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "⚡ *NOMICS — Web3 Marketing*\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n\n"
        "_Professional token marketing, listing & growth services._\n\n"
        "📌 *Live Crypto Prices*\n"
        f"◎ SOL  `${prices['SOL']:,.2f}`\n"
        f"⟠ ETH  `${prices['ETH']:,.2f}`\n"
        f"🟡 BNB  `${prices['BNB']:,.2f}`\n\n"
        "📋 *Our Services*\n"
        "🔥 Premium Listing — from $150\n"
        "📈 DEX Trending — from $99\n"
        "📣 Shill Calls — from $149\n"
        "🔑 Alpha Access — from $99/mo\n"
        "🤖 Volume Bot — from $199\n"
        "👥 KOL Outreach — from $299\n"
        "🛠 DEX Tools — from $79\n"
        "⚡ Quick Pump — from $199\n"
        "_...and 4 more services_\n\n"
        f"🌐 {SITE_URL}"
    )
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.add(
        types.InlineKeyboardButton("📋 Browse Services",  callback_data="menu_services"),
        types.InlineKeyboardButton("🔑 Alpha Access",     callback_data="menu_alpha"),
    )
    kb.add(
        types.InlineKeyboardButton("📊 Live Prices",      callback_data="menu_prices"),
        types.InlineKeyboardButton("💬 Support",          callback_data="menu_support"),
    )
    kb.add(
        types.InlineKeyboardButton("🌐 Visit Platform", url=SITE_URL),
    )
    try:
        bot.send_message(cid, txt, parse_mode="Markdown", reply_markup=kb)
    except Exception:
        pass


if bot:

    @bot.message_handler(commands=["start"])
    def cmd_start(msg):
        uid = msg.from_user.id
        username = msg.from_user.username or "N/A"
        notify_discord(
            "👤 NEW USER",
            {"User": str(uid), "Username": f"@{username}", "Time": time.strftime("%Y-%m-%d %H:%M UTC")},
            color=0x22c55e
        )
        main_menu(msg.chat.id)

    @bot.callback_query_handler(func=lambda c: c.data == "menu_services")
    def cb_services(c):
        kb = types.InlineKeyboardMarkup(row_width=2)
        for key, s in SERVICES.items():
            kb.add(types.InlineKeyboardButton(f"{s['emoji']}  {s['name']}", callback_data=f"svc_{key}"))
        kb.add(types.InlineKeyboardButton("🔙 Back", callback_data="menu_home"))
        bot.edit_message_text(
            "📋 *Select a Service*\n\n_Tap any service to see packages and pricing._",
            c.message.chat.id, c.message.message_id,
            parse_mode="Markdown", reply_markup=kb
        )
        bot.answer_callback_query(c.id)

    @bot.callback_query_handler(func=lambda c: c.data == "menu_home")
    def cb_home(c):
        bot.delete_message(c.message.chat.id, c.message.message_id)
        main_menu(c.message.chat.id)
        bot.answer_callback_query(c.id)

    @bot.callback_query_handler(func=lambda c: c.data == "menu_prices")
    def cb_prices(c):
        prices = get_crypto_prices()
        txt = (
            "📊 *Live Crypto Prices*\n\n"
            f"◎ *SOL* — `${prices['SOL']:,.2f}`\n"
            f"⟠ *ETH* — `${prices['ETH']:,.2f}`\n"
            f"🟡 *BNB* — `${prices['BNB']:,.2f}`\n\n"
            "_Prices refresh each time you open this._"
        )
        kb = types.InlineKeyboardMarkup()
        kb.add(types.InlineKeyboardButton("🔙 Back", callback_data="menu_home"))
        bot.edit_message_text(txt, c.message.chat.id, c.message.message_id, parse_mode="Markdown", reply_markup=kb)
        bot.answer_callback_query(c.id)

    @bot.callback_query_handler(func=lambda c: c.data == "menu_support")
    def cb_support(c):
        txt = (
            "💬 *Support*\n\n"
            "For help with orders, listings, or any questions:\n\n"
            f"📩 Message us directly: {SUPPORT}\n\n"
            "_Our team typically responds within a few hours._"
        )
        kb = types.InlineKeyboardMarkup()
        kb.add(types.InlineKeyboardButton(f"📩 Message {SUPPORT}", url=f"https://t.me/crypto_guy02"))
        kb.add(types.InlineKeyboardButton("🔙 Back", callback_data="menu_home"))
        bot.edit_message_text(txt, c.message.chat.id, c.message.message_id, parse_mode="Markdown", reply_markup=kb)
        bot.answer_callback_query(c.id)

    @bot.callback_query_handler(func=lambda c: c.data == "menu_alpha")
    def cb_alpha(c):
        prices = get_crypto_prices()
        tiers = SERVICES["alpha"]["tiers"]
        kb = types.InlineKeyboardMarkup(row_width=1)
        for tk, tier in tiers.items():
            sol = usd_to_crypto(tier["p"], prices, "SOL")
            eth = usd_to_crypto(tier["p"], prices, "ETH")
            best = " ⭐" if tier.get("best") else ""
            kb.add(types.InlineKeyboardButton(
                f"{tier['n']}{best} — ${tier['p']:,}  |  {sol}  ·  {eth}",
                callback_data=f"alphapay_{tk}"
            ))
        kb.add(types.InlineKeyboardButton("🔙 Back", callback_data="menu_home"))
        txt = (
            "🔑 *Alpha Group Access*\n\n"
            "_Exclusive private channel — early gem calls, insider DEX signals, priority listing slots._\n\n"
            "✅ Early gem calls before they pump\n"
            "✅ Insider DEX trending signals\n"
            "✅ Direct KOL network access\n"
            "✅ Volume bot strategy tips\n"
            "✅ Priority listing slots\n"
            "✅ Daily market alpha & analysis\n\n"
            "Choose your plan:"
        )
        bot.edit_message_text(txt, c.message.chat.id, c.message.message_id, parse_mode="Markdown", reply_markup=kb)
        bot.answer_callback_query(c.id)

    @bot.callback_query_handler(func=lambda c: c.data.startswith("alphapay_"))
    def cb_alphapay(c):
        plan = c.data.replace("alphapay_", "")
        tier = SERVICES["alpha"]["tiers"].get(plan)
        if not tier:
            return bot.answer_callback_query(c.id, "Not found.", show_alert=True)
        prices = get_crypto_prices()
        uid = c.from_user.id
        active_orders[uid] = {"type": "alpha", "plan": plan, "tier": tier["n"], "price": tier["p"]}

        kb = types.InlineKeyboardMarkup(row_width=1)
        for cur, w in WALLETS.items():
            amt = usd_to_crypto(tier["p"], prices, cur)
            kb.add(types.InlineKeyboardButton(f"{w['sym']} Pay {amt} ({cur})", callback_data=f"alphacur_{plan}_{cur}"))
        kb.add(types.InlineKeyboardButton("🔙 Back", callback_data="menu_alpha"))

        txt = (
            f"🔑 *Alpha Access — {tier['n']}*\n\n"
            f"{tier['d']}\n\n"
            f"💰 *Price: ${tier['p']:,} USD*\n\n"
            f"◎ SOL  `{usd_to_crypto(tier['p'], prices, 'SOL')}`\n"
            f"⟠ ETH  `{usd_to_crypto(tier['p'], prices, 'ETH')}`\n"
            f"🟡 BNB  `{usd_to_crypto(tier['p'], prices, 'BNB')}`\n\n"
            "Select payment currency:"
        )
        bot.edit_message_text(txt, c.message.chat.id, c.message.message_id, parse_mode="Markdown", reply_markup=kb)
        bot.answer_callback_query(c.id)

    @bot.callback_query_handler(func=lambda c: c.data.startswith("alphacur_"))
    def cb_alphacur(c):
        parts = c.data.split("_")
        plan  = parts[1] if len(parts) > 1 else "monthly"
        cur   = parts[2] if len(parts) > 2 else "SOL"
        tier  = SERVICES["alpha"]["tiers"].get(plan)
        if not tier:
            return bot.answer_callback_query(c.id, "Not found.", show_alert=True)
        uid   = c.from_user.id
        prices = get_crypto_prices()
        amt   = usd_to_crypto(tier["p"], prices, cur)
        wallet = WALLETS[cur]

        order = active_orders.get(uid, {})
        order.update({"currency": cur, "crypto_amount": amt, "wallet": wallet["addr"]})
        active_orders[uid] = order
        user_states[uid] = "alpha_tx"

        kb = types.InlineKeyboardMarkup()
        kb.add(types.InlineKeyboardButton("🔙 Back", callback_data=f"alphapay_{plan}"))

        txt = (
            f"💳 *Payment — Alpha {tier['n']}*\n\n"
            f"Amount:  `{amt}`\n"
            f"Network: *{wallet['name']}*\n\n"
            f"Send to address:\n`{wallet['addr']}`\n\n"
            "After sending, reply here with your *transaction hash (TXID)*.\n"
            "_Access granted within 30 minutes of confirmation._\n\n"
            f"📌 Group link: {ALPHA_URL}"
        )
        bot.send_message(uid, txt, parse_mode="Markdown", reply_markup=kb)
        bot.answer_callback_query(c.id)

    @bot.message_handler(func=lambda m: user_states.get(m.from_user.id) == "alpha_tx")
    def handle_alpha_tx(m):
        uid  = m.from_user.id
        tx   = m.text.strip()
        if is_nav(tx):
            user_states.pop(uid, None)
            return main_menu(uid)
        if len(tx) < 20:
            return bot.send_message(uid, "❌ TX hash looks too short. Please send the full transaction ID.")
        order = active_orders.get(uid, {})
        notify_discord("🔑 ALPHA PAYMENT TX", {"Plan": order.get("tier"), "Price": f"${order.get('price')}", "Currency": order.get("currency"), "Amount": order.get("crypto_amount"), "TX": tx, "User": str(uid), "Username": f"@{m.from_user.username or 'N/A'}"}, color=0xa855f7)
        try:
            bot.send_message(ADMIN_ID, f"🔑 *Alpha TX*\nPlan: {order.get('tier')}\nCurrency: {order.get('currency')}\nAmount: {order.get('crypto_amount')}\nTX: `{tx}`\nUser: {uid} (@{m.from_user.username or 'N/A'})", parse_mode="Markdown")
        except Exception: pass
        user_states.pop(uid, None)
        bot.send_message(uid, f"✅ *Payment submitted!*\n\nWe'll verify your TX and add you to the alpha group within 30 minutes.\n\n📌 Group: {ALPHA_URL}", parse_mode="Markdown")

    @bot.callback_query_handler(func=lambda c: c.data.startswith("svc_"))
    def cb_service(c):
        key = c.data[4:]
        svc = SERVICES.get(key)
        if not svc:
            return bot.answer_callback_query(c.id, "Not found.", show_alert=True)
        uid = c.from_user.id
        active_orders[uid] = {"svc_key": key, "service": svc["name"]}

        if svc.get("needs_ca"):
            user_states[uid] = "need_ca"
            txt = (
                f"{svc['emoji']} *{svc['name']}*\n\n"
                f"_{svc['desc']}_\n\n"
                "📝 *Enter your token contract address (CA)*\n\n"
                "I'll fetch the token info from DexScreener automatically — name, price, liquidity, market cap, and social links."
            )
        else:
            user_states[uid] = "choose_tier"
            prices = get_crypto_prices()
            kb = _tier_keyboard(key, svc, prices)
            txt = (
                f"{svc['emoji']} *{svc['name']}*\n\n"
                f"_{svc['desc']}_\n\n"
                "Choose your package:"
            )
            bot.send_message(uid, txt, parse_mode="Markdown", reply_markup=kb)
            return bot.answer_callback_query(c.id)

        bot.send_message(uid, txt, parse_mode="Markdown")
        bot.answer_callback_query(c.id)

    def _tier_keyboard(svc_key, svc, prices):
        kb = types.InlineKeyboardMarkup(row_width=1)
        for tk, tier in svc["tiers"].items():
            if tier["p"] == 0:
                label = f"{tier['n']} — Custom (contact us)"
            else:
                sol = usd_to_crypto(tier["p"], prices, "SOL")
                eth = usd_to_crypto(tier["p"], prices, "ETH")
                best = " ⭐ Best Value" if tier.get("best") else ""
                label = f"{tier['n']}{best} — ${tier['p']:,}  |  {sol}  ·  {eth}"
            kb.add(types.InlineKeyboardButton(label, callback_data=f"tier_{svc_key}_{tk}"))
        return kb

    @bot.message_handler(func=lambda m: user_states.get(m.from_user.id) == "need_ca")
    def handle_ca(m):
        uid  = m.from_user.id
        text = m.text.strip()
        if is_nav(text):
            user_states.pop(uid, None)
            active_orders.pop(uid, None)
            return main_menu(uid)

        ca    = text
        order = active_orders.get(uid, {})
        order.setdefault("fields", {})["ca"] = ca

        bot.send_message(uid, "🔍 *Fetching token data from DexScreener…*", parse_mode="Markdown")

        tk    = lookup_token(ca)
        svc_key = order.get("svc_key", "")
        svc   = SERVICES.get(svc_key, {})
        prices = get_crypto_prices()

        if tk:
            order["fields"].update({
                "token_name":   tk["name"],
                "token_symbol": tk["symbol"],
                "token_chain":  tk["chain"],
                "token_price":  tk["price"],
                "token_mc":     tk["market_cap"],
                "token_liq":    tk["liquidity"],
                "token_dex":    tk["dex"],
            })
            active_orders[uid] = order

            socials_line = ""
            links = []
            if tk.get("website"):  links.append(f"🌐 [Website]({tk['website']})")
            if tk.get("twitter"):  links.append(f"𝕏 [Twitter]({tk['twitter']})")
            if tk.get("telegram"): links.append(f"✈️ [Telegram]({tk['telegram']})")
            if tk.get("discord"):  links.append(f"💬 [Discord]({tk['discord']})")
            if tk.get("pair_url"): links.append(f"📊 [DexScreener]({tk['pair_url']})")
            if links:
                socials_line = "\n🔗 " + "  ·  ".join(links)

            desc_line = f"\n📋 _{tk['description'][:160]}…_" if tk.get("description") else ""

            h1  = fmt_pct(tk.get("change_h1"))
            h24 = fmt_pct(tk.get("change_h24"))

            txt = (
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"✅ *{tk['name']}* (${tk['symbol']})\n"
                f"━━━━━━━━━━━━━━━━━━━━━━\n"
                f"⛓  Chain:      `{tk['chain'].upper()}`\n"
                f"🏪 DEX:        `{tk['dex'].upper()}`\n"
                f"💰 Price:      `{fmt_price(tk['price'])}`\n"
                f"📈 1H / 24H:  `{h1}`  /  `{h24}`\n"
                f"💧 Liquidity:  `{fmt_num(tk['liquidity'])}`\n"
                f"📊 Market Cap: `{fmt_num(tk['market_cap'])}`\n"
                f"📦 Volume 24H: `{fmt_num(tk['volume_h24'])}`\n"
                f"{desc_line}"
                f"{socials_line}\n\n"
                f"Choose your *{svc.get('name', 'service')}* package:"
            )
            kb = _tier_keyboard(svc_key, svc, prices)
            user_states[uid] = "choose_tier"
            bot.send_message(uid, txt, parse_mode="Markdown", reply_markup=kb, disable_web_page_preview=True)

        else:
            order["fields"]["token_name"] = "Unverified"
            active_orders[uid] = order

            txt = (
                f"⚠️ *Token not found on DexScreener*\n\n"
                f"CA: `{ca}`\n\n"
                "You can still proceed — our team will verify the token manually.\n\n"
                f"Choose your *{svc.get('name', 'service')}* package:"
            )
            kb = _tier_keyboard(svc_key, svc, prices)
            user_states[uid] = "choose_tier"
            bot.send_message(uid, txt, parse_mode="Markdown", reply_markup=kb)

    @bot.callback_query_handler(func=lambda c: c.data.startswith("tier_"))
    def cb_tier(c):
        parts   = c.data.split("_", 2)
        svc_key = parts[1]
        tier_key = parts[2]
        svc  = SERVICES.get(svc_key)
        tier = svc["tiers"].get(tier_key) if svc else None
        if not svc or not tier:
            return bot.answer_callback_query(c.id, "Not found.", show_alert=True)

        uid = c.from_user.id
        prices = get_crypto_prices()
        order = active_orders.get(uid, {})
        order.update({
            "svc_key":  svc_key,
            "service":  svc["name"],
            "tier_key": tier_key,
            "tier_name": tier["n"],
            "price":    tier["p"],
            "desc":     tier["d"],
        })
        active_orders[uid] = order
        user_states[uid] = "await_contact"

        bot.answer_callback_query(c.id)

        txt = (
            f"✅ *{svc['emoji']} {svc['name']} — {tier['n']}*\n"
            f"_{tier['d']}_\n\n"
            f"💰 Price: *${tier['p']:,} USD*\n"
            f"◎ SOL  `{usd_to_crypto(tier['p'], prices, 'SOL')}`\n"
            f"⟠ ETH  `{usd_to_crypto(tier['p'], prices, 'ETH')}`\n"
            f"🟡 BNB  `{usd_to_crypto(tier['p'], prices, 'BNB')}`\n\n"
            "📩 Enter your *Telegram username* so our team can follow up with you.\n"
            "_Type_ `skip` _if you prefer not to share._"
        )
        bot.send_message(uid, txt, parse_mode="Markdown")

    @bot.message_handler(func=lambda m: user_states.get(m.from_user.id) == "await_contact")
    def handle_contact(m):
        uid  = m.from_user.id
        text = m.text.strip()
        if is_nav(text):
            user_states.pop(uid, None)
            active_orders.pop(uid, None)
            return main_menu(uid)

        contact = "" if text.lower() == "skip" else text
        order = active_orders.get(uid, {})
        order["contact"] = contact
        active_orders[uid] = order
        user_states[uid] = "choose_currency"

        prices = get_crypto_prices()
        kb = types.InlineKeyboardMarkup(row_width=1)
        for cur, w in WALLETS.items():
            amt = usd_to_crypto(order.get("price", 0), prices, cur)
            kb.add(types.InlineKeyboardButton(f"{w['sym']} Pay {amt} ({cur})", callback_data=f"pay_{cur}"))

        txt = (
            f"📋 *Order Summary*\n\n"
            f"Service:  *{order.get('service')} — {order.get('tier_name', '')}*\n"
            f"Package:  _{order.get('desc', '')}_\n"
            f"Price:    *${order.get('price', 0):,} USD*\n"
        )
        ca = order.get("fields", {}).get("ca")
        tk_name = order.get("fields", {}).get("token_name")
        if ca:
            txt += f"Token CA: `{ca}`\n"
        if tk_name:
            txt += f"Token:    {tk_name}\n"
        if contact:
            txt += f"Contact:  {contact}\n"
        txt += "\nSelect payment currency:"
        bot.send_message(uid, txt, parse_mode="Markdown", reply_markup=kb)

    @bot.callback_query_handler(func=lambda c: c.data.startswith("pay_") and not c.data.startswith("pay_none"))
    def cb_pay(c):
        cur = c.data[4:]
        if cur not in WALLETS:
            return bot.answer_callback_query(c.id, "Invalid currency.", show_alert=True)
        uid = c.from_user.id
        prices = get_crypto_prices()
        order  = active_orders.get(uid, {})
        wallet = WALLETS[cur]
        amt    = usd_to_crypto(order.get("price", 0), prices, cur)

        order.update({"currency": cur, "crypto_amount": amt, "wallet_addr": wallet["addr"]})
        active_orders[uid] = order
        user_states[uid] = "await_tx"

        notify_discord(
            f"🆕 ORDER — {order.get('service', '').upper()}",
            {
                "Service":  f"{order.get('service')} — {order.get('tier_name', '')}",
                "Price":    f"${order.get('price', 0):,}",
                "Currency": cur,
                "Amount":   amt,
                "Token CA": order.get("fields", {}).get("ca", "N/A"),
                "Token":    order.get("fields", {}).get("token_name", "N/A"),
                "Contact":  order.get("contact") or "N/A",
                "User":     str(uid),
                "Username": f"@{c.from_user.username or 'N/A'}",
            },
            color=0xf97316
        )
        try:
            bot.send_message(
                ADMIN_ID,
                f"🆕 *NEW ORDER*\n"
                f"Service: {order.get('service')} — {order.get('tier_name', '')}\n"
                f"Price: ${order.get('price', 0):,} → {amt}\n"
                f"CA: `{order.get('fields', {}).get('ca', 'N/A')}`\n"
                f"Token: {order.get('fields', {}).get('token_name', 'N/A')}\n"
                f"Contact: {order.get('contact') or 'N/A'}\n"
                f"User: {uid} (@{c.from_user.username or 'N/A'})",
                parse_mode="Markdown"
            )
        except Exception:
            pass

        txt = (
            f"💳 *Payment Instructions*\n\n"
            f"Service:  *{order.get('service')} — {order.get('tier_name', '')}*\n"
            f"Amount:   *`{amt}`*\n"
            f"Network:  *{wallet['name']}*\n\n"
            f"Send to:\n`{wallet['addr']}`\n\n"
            "After sending, reply here with your *transaction hash (TXID)*.\n"
            "_Our team will verify and activate your order within 30–60 minutes._"
        )
        bot.send_message(uid, txt, parse_mode="Markdown")
        bot.answer_callback_query(c.id)

    @bot.message_handler(func=lambda m: user_states.get(m.from_user.id) == "await_tx")
    def handle_tx(m):
        uid = m.from_user.id
        tx  = m.text.strip()
        if is_nav(tx):
            user_states.pop(uid, None)
            active_orders.pop(uid, None)
            return main_menu(uid)
        if len(tx) < 20:
            return bot.send_message(uid, "❌ TX hash too short. Please send the full transaction ID.")
        order = active_orders.get(uid, {})
        notify_discord(
            "💰 PAYMENT TX RECEIVED",
            {
                "Service":  f"{order.get('service')} — {order.get('tier_name', '')}",
                "Price":    f"${order.get('price', 0):,}",
                "Currency": order.get("currency", "N/A"),
                "Amount":   order.get("crypto_amount", "N/A"),
                "TX Hash":  tx,
                "Token CA": order.get("fields", {}).get("ca", "N/A"),
                "User":     str(uid),
                "Username": f"@{m.from_user.username or 'N/A'}",
            },
            color=0x22c55e
        )
        try:
            bot.send_message(
                ADMIN_ID,
                f"💰 *PAYMENT TX*\n"
                f"Service: {order.get('service')} — {order.get('tier_name', '')}\n"
                f"Amount: {order.get('crypto_amount')} ({order.get('currency')})\n"
                f"TX: `{tx}`\n"
                f"CA: `{order.get('fields', {}).get('ca', 'N/A')}`\n"
                f"User: {uid} (@{m.from_user.username or 'N/A'})",
                parse_mode="Markdown"
            )
        except Exception:
            pass
        user_states.pop(uid, None)
        bot.send_message(
            uid,
            "✅ *Payment submitted!*\n\n"
            "Your transaction is now under review. Our team will confirm within 30–60 minutes.\n\n"
            "Thank you for choosing Nomics! 🚀",
            parse_mode="Markdown"
        )

    @bot.message_handler(func=lambda m: True)
    def fallback(m):
        if is_nav(m.text.strip()):
            main_menu(m.chat.id)
        else:
            kb = types.InlineKeyboardMarkup()
            kb.add(types.InlineKeyboardButton("📋 Browse Services", callback_data="menu_services"))
            kb.add(types.InlineKeyboardButton("💬 Support", callback_data="menu_support"))
            bot.send_message(m.chat.id, "Use the buttons below to navigate:", reply_markup=kb)


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

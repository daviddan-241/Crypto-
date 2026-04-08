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

TOKEN    = os.environ.get("BOT_TOKEN", "8710292892:AAG1OQvohkgou5saMxLWg1eeozXX9Wp5uLY")
ADMIN_ID = int(os.environ.get("ADMIN_ID", "8235324142"))
DISCORD  = os.environ.get("DISCORD_WEBHOOK_URL", "https://discord.com/api/webhooks/1490137623577235497/ZzzvUp5fDvWuMwlWB8SVYyNe5KP70S3V7kpi5nefBSXi3eDxSy4CFQOzkvDXPT_F9WsJ")
SITE_URL = os.environ.get("SITE_URL", "https://nomic-alpha-listing-private.vercel.app")
ALPHA    = "https://t.me/+QJVQUQIhP-82ZDk8"
SUPPORT  = "@crypto_guy02"

WALLETS = {
    "SOL": {"addr": os.environ.get("SOL_WALLET", "46ZKRuURaASKEcKBafnPZgMaTqBL8RK8TssZgZzFCBzn"), "sym": "◎", "name": "Solana"},
    "ETH": {"addr": os.environ.get("ETH_WALLET", "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A"),     "sym": "⟠", "name": "Ethereum"},
    "BNB": {"addr": os.environ.get("BNB_WALLET",  "bnb189gjjucwltdpnlemrveakf0q6xg0smfqdh6869"),    "sym": "🟡", "name": "BNB Chain"},
}

DEXSCREENER = "https://api.dexscreener.com/latest/dex"
COINGECKO   = "https://api.coingecko.com/api/v3"

bot = TeleBot(TOKEN, threaded=False) if TOKEN else None

states  = {}
orders  = {}

SERVICES = [
    ("🔥", "premium_listing", "Premium Listing",      True),
    ("📈", "dex_trending",    "DEX Trending Push",     True),
    ("📣", "shill_calls",     "Shill Calls",           True),
    ("🤖", "volume_bot",      "Volume Bot",            True),
    ("👥", "kol",             "KOL / Influencer",      True),
    ("📊", "promotion",       "Full Promotion",        True),
    ("𝕏",  "twitter",        "X Campaign",            True),
    ("😂", "meme",            "Meme Campaign",         True),
    ("🔗", "dex_listing",     "DEX Listing Support",   True),
    ("⚡", "quick_pump",      "Quick Pump",            True),
    ("🛠", "dex_tools",       "DEX Tools & Analytics", False),
    ("🔑", "alpha",           "Alpha Group Access",    False),
]

TIERS = {
    "premium_listing": [
        ("Standard",  150,  "Instant listing + 24h promote + 200 boost pts"),
        ("Featured",  350,  "Standard + Token of the Day + newsletter ⭐"),
        ("Elite",     799,  "Featured + KOL signal + 7-day trending"),
    ],
    "dex_trending": [
        ("Basic",  99,  "24h single-DEX visibility boost"),
        ("Pro",    299, "72h multi-DEX trending ⭐"),
        ("Elite",  799, "7-day sustained trending + volume boost"),
    ],
    "shill_calls": [
        ("Micro",    149, "3–5 callers, 50K+ reach"),
        ("Mid-Tier", 399, "8–12 callers, 250K+ reach ⭐"),
        ("Premium",  999, "20+ callers, 1M+ reach"),
    ],
    "volume_bot": [
        ("Starter",  199,  "24h basic volume rotation"),
        ("Growth",   599,  "72h managed volume + buy simulation ⭐"),
        ("Premium",  1499, "7-day advanced volume system"),
    ],
    "kol": [
        ("Micro",    299,  "3–4 influencers, 100K+ reach"),
        ("Mid-Tier", 799,  "6–9 KOLs, 500K+ reach ⭐"),
        ("Premium",  1999, "20+ high-tier KOLs, 2M+ reach"),
    ],
    "promotion": [
        ("Basic",    129, "Social posts + 3 community shills"),
        ("Standard", 349, "Multi-platform + Twitter thread + TG ⭐"),
        ("Premium",  899, "Full: KOL + trending + socials + TG wave"),
    ],
    "twitter": [
        ("Basic",  99,  "5 posts + community engagement"),
        ("Growth", 299, "Daily tweets + thread + 10 KOL reposts ⭐"),
        ("Viral",  799, "Full X strategy + paid amplification"),
    ],
    "meme": [
        ("Basic",     79,  "Quick visibility + 5 viral posts"),
        ("Viral",     249, "Meme pack + community activation ⭐"),
        ("Explosion", 799, "Full viral campaign: KOL + trending"),
    ],
    "dex_listing": [
        ("Basic",        99,  "Standard DEX listing assistance"),
        ("Fast Track",   249, "Priority listing + initial promo ⭐"),
        ("Full Service", 599, "DEX + Birdeye + DexTools complete"),
    ],
    "quick_pump": [
        ("Basic", 199,  "24–48h call + volume burst"),
        ("Pro",   599,  "Calls + volume + TG raid ⭐"),
        ("Elite", 1499, "Aggressive 72h full momentum package"),
    ],
    "dex_tools": [
        ("Basic",    79,  "Token scanner + basic chart access"),
        ("Advanced", 249, "Full analytics, holder tracking, whale alerts ⭐"),
        ("Pro",      649, "Custom dashboard, API access, alerts"),
    ],
    "alpha": [
        ("Monthly",   99,  f"30 days full alpha access — {ALPHA}"),
        ("Quarterly", 249, f"90 days full alpha access (save $48) ⭐ — {ALPHA}"),
        ("Lifetime",  599, f"Permanent access — best value — {ALPHA}"),
    ],
}


def get_prices():
    try:
        r = requests.get(f"{COINGECKO}/simple/price",
            params={"ids": "solana,ethereum,binancecoin", "vs_currencies": "usd"},
            headers={"accept": "application/json"}, timeout=8)
        d = r.json()
        return {
            "SOL": float(d.get("solana", {}).get("usd", 140)),
            "ETH": float(d.get("ethereum", {}).get("usd", 2500)),
            "BNB": float(d.get("binancecoin", {}).get("usd", 600)),
        }
    except Exception:
        return {"SOL": 140, "ETH": 2500, "BNB": 600}


def to_crypto(usd, prices, cur):
    if not usd:
        return "Custom"
    amt = usd / max(prices.get(cur, 1), 0.0001)
    if cur == "ETH":
        return f"{amt:.4f}"
    return f"{amt:.3f}"


def lookup(ca):
    try:
        r = requests.get(f"{DEXSCREENER}/tokens/{ca}", timeout=10)
        pairs = r.json().get("pairs", [])
        if not pairs:
            return None
        p    = sorted(pairs, key=lambda x: float((x.get("liquidity") or {}).get("usd", 0) or 0), reverse=True)[0]
        info = p.get("info", {})
        soc  = info.get("socials", [])
        web  = [w.get("url") for w in info.get("websites", []) if w.get("url")]
        tw = tg = dc = ""
        for s in soc:
            t = s.get("type", "")
            if t == "twitter":  tw = s.get("url", "")
            elif t == "telegram": tg = s.get("url", "")
            elif t == "discord":  dc = s.get("url", "")
        pc  = p.get("priceChange", {})
        vol = p.get("volume", {})
        return {
            "name":    p.get("baseToken", {}).get("name", ""),
            "symbol":  p.get("baseToken", {}).get("symbol", ""),
            "chain":   p.get("chainId", ""),
            "dex":     p.get("dexId", ""),
            "price":   p.get("priceUsd", "0"),
            "h1":      pc.get("h1", 0),
            "h24":     pc.get("h24", 0),
            "vol24":   vol.get("h24", 0),
            "liq":     p.get("liquidity", {}).get("usd", 0),
            "mc":      p.get("marketCap", 0),
            "url":     p.get("url", ""),
            "image":   info.get("imageUrl", ""),
            "desc":    info.get("description", ""),
            "website": web[0] if web else "",
            "twitter": tw,
            "telegram": tg,
            "discord": dc,
        }
    except Exception:
        return None


def fmt(n):
    try:
        n = float(n or 0)
        if n >= 1_000_000_000: return f"${n/1_000_000_000:.2f}B"
        if n >= 1_000_000:     return f"${n/1_000_000:.2f}M"
        if n >= 1_000:         return f"${n/1_000:.1f}K"
        return f"${n:.2f}"
    except Exception:
        return "$—"


def fmt_price(p):
    try:
        n = float(p or 0)
        if n == 0: return "$0.00"
        if n >= 1: return f"${n:,.4f}"
        s = f"{n:.12f}"
        i = s.find(".") + 1
        zeros = len(s[i:]) - len(s[i:].lstrip("0"))
        sig = s[i+zeros:i+zeros+5].rstrip("0") or "0"
        return f"$0.0…{zeros}{sig}" if zeros > 3 else f"${n:.8f}".rstrip("0").rstrip(".")
    except Exception:
        return "$—"


def fmt_pct(v):
    try:
        v = float(v or 0)
        return f"▲ {v:.2f}%" if v >= 0 else f"▼ {abs(v):.2f}%"
    except Exception:
        return "—"


def discord_notify(title, fields, color=0xf97316):
    if not DISCORD:
        return
    try:
        requests.post(DISCORD, json={"embeds": [{"title": title, "color": color,
            "fields": [{"name": k, "value": str(v)[:1024], "inline": True} for k, v in fields.items()],
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"), "footer": {"text": "Nomics"}}]}, timeout=5)
    except Exception:
        pass


def send(cid, text, kb=None, image=None, parse="Markdown"):
    try:
        if image:
            bot.send_photo(cid, image, caption=text, parse_mode=parse, reply_markup=kb)
        else:
            bot.send_message(cid, text, parse_mode=parse, reply_markup=kb, disable_web_page_preview=True)
    except Exception as e:
        try:
            bot.send_message(cid, text, parse_mode=parse, reply_markup=kb, disable_web_page_preview=True)
        except Exception:
            pass


def main_menu(cid):
    prices = get_prices()
    txt = (
        "━━━━━━━━━━━━━━━━━━━━━\n"
        "⚡ *NOMICS — Web3 Marketing*\n"
        "━━━━━━━━━━━━━━━━━━━━━\n"
        "_Professional token marketing, listing & growth._\n\n"
        "📌 *Live Prices*\n"
        f"◎ SOL `${prices['SOL']:,.2f}` · ⟠ ETH `${prices['ETH']:,.2f}` · 🟡 BNB `${prices['BNB']:,.2f}`\n\n"
        "Tap a button below to get started:"
    )
    kb = types.InlineKeyboardMarkup(row_width=2)
    kb.add(
        types.InlineKeyboardButton("📋 Services",      callback_data="home_services"),
        types.InlineKeyboardButton("🔑 Alpha Access",  callback_data="home_alpha"),
    )
    kb.add(
        types.InlineKeyboardButton("📊 Live Prices",   callback_data="home_prices"),
        types.InlineKeyboardButton("💬 Support",       callback_data="home_support"),
    )
    kb.add(types.InlineKeyboardButton("🌐 Visit Nomics Platform", url=SITE_URL))
    send(cid, txt, kb)


def services_menu(cid):
    txt = "📋 *Select a Service*\n\n_Choose a service — prices shown after you enter your contract address._"
    kb = types.InlineKeyboardMarkup(row_width=2)
    for emoji, key, name, _ in SERVICES:
        kb.add(types.InlineKeyboardButton(f"{emoji} {name}", callback_data=f"svc_{key}"))
    kb.add(types.InlineKeyboardButton("🔙 Main Menu", callback_data="home_back"))
    send(cid, txt, kb)


if bot:

    @bot.message_handler(commands=["start"])
    def cmd_start(m):
        uid  = m.from_user.id
        user = m.from_user.username or "N/A"
        states.pop(uid, None)
        orders.pop(uid, None)
        discord_notify("👤 NEW USER", {"User": str(uid), "Username": f"@{user}", "Time": time.strftime("%Y-%m-%d %H:%M UTC")}, 0x22c55e)
        main_menu(m.chat.id)

    @bot.message_handler(func=lambda m: True)
    def fallback(m):
        uid = m.from_user.id
        txt = (m.text or "").strip()

        state = states.get(uid)

        if txt in ["/start", "Main Menu", "🔙 Main Menu"]:
            states.pop(uid, None)
            orders.pop(uid, None)
            return main_menu(m.chat.id)

        if state == "need_ca":
            return handle_ca(m)
        if state == "need_contact":
            return handle_contact(m)
        if state == "need_tx":
            return handle_tx(m)

        main_menu(m.chat.id)

    def handle_ca(m):
        uid = m.from_user.id
        ca  = (m.text or "").strip()
        if ca.lower() in ["/start", "main menu", "🔙 main menu"]:
            states.pop(uid, None)
            orders.pop(uid, None)
            return main_menu(m.chat.id)

        order = orders.get(uid, {})
        order["ca"] = ca
        orders[uid] = order

        svc_key = order.get("svc_key", "")
        svc_name = order.get("svc_name", "Service")
        prices   = get_prices()

        send(m.chat.id, "🔍 *Fetching token data from DexScreener…*", parse="Markdown")
        tk = lookup(ca)

        if tk:
            order["token"] = tk
            orders[uid] = order

            links = []
            if tk.get("website"):  links.append(f"🌐 [Website]({tk['website']})")
            if tk.get("twitter"):  links.append(f"𝕏 [Twitter]({tk['twitter']})")
            if tk.get("telegram"): links.append(f"✈️ [Telegram]({tk['telegram']})")
            if tk.get("discord"):  links.append(f"💬 [Discord]({tk['discord']})")
            if tk.get("url"):      links.append(f"📊 [DexScreener]({tk['url']})")
            links_str = "  ·  ".join(links) if links else "_No links found_"

            desc_str = f"\n\n📋 _{tk['desc'][:200]}{'…' if len(tk['desc']) > 200 else ''}_" if tk.get("desc") else ""

            caption = (
                f"✅ *{tk['name']}* (${tk['symbol']})\n"
                f"⛓ `{tk['chain'].upper()}`  🏪 `{tk['dex'].upper()}`\n\n"
                f"💰 Price:     `{fmt_price(tk['price'])}`\n"
                f"📈 1H / 24H: `{fmt_pct(tk['h1'])}` / `{fmt_pct(tk['h24'])}`\n"
                f"💧 Liquidity: `{fmt(tk['liq'])}`\n"
                f"📊 Mkt Cap:  `{fmt(tk['mc'])}`\n"
                f"📦 Vol 24H:  `{fmt(tk['vol24'])}`"
                f"{desc_str}\n\n"
                f"🔗 {links_str}"
            )

            tiers = TIERS.get(svc_key, [])
            kb    = types.InlineKeyboardMarkup(row_width=1)
            for t_name, t_price, t_desc in tiers:
                sol = to_crypto(t_price, prices, "SOL")
                eth = to_crypto(t_price, prices, "ETH")
                kb.add(types.InlineKeyboardButton(
                    f"{t_name} — ${t_price:,}  |  ◎{sol} · ⟠{eth}",
                    callback_data=f"tier_{svc_key}_{t_name}"
                ))
            kb.add(types.InlineKeyboardButton("🔙 Services", callback_data="home_services"))

            states[uid] = "choose_tier"
            send(m.chat.id, caption + f"\n\n_Choose your *{svc_name}* package:_", kb, image=tk.get("image") or None)

        else:
            order["token"] = {"name": "Unverified", "symbol": "", "chain": ""}
            orders[uid] = order
            tiers = TIERS.get(svc_key, [])
            kb    = types.InlineKeyboardMarkup(row_width=1)
            for t_name, t_price, t_desc in tiers:
                sol = to_crypto(t_price, prices, "SOL")
                eth = to_crypto(t_price, prices, "ETH")
                kb.add(types.InlineKeyboardButton(
                    f"{t_name} — ${t_price:,}  |  ◎{sol} · ⟠{eth}",
                    callback_data=f"tier_{svc_key}_{t_name}"
                ))
            kb.add(types.InlineKeyboardButton("🔙 Services", callback_data="home_services"))
            states[uid] = "choose_tier"
            send(m.chat.id,
                f"⚠️ *Token not found on DexScreener*\nCA: `{ca}`\n\nYou can still proceed — our team verifies manually.\n\nChoose your *{svc_name}* package:",
                kb)

    def handle_contact(m):
        uid     = m.from_user.id
        contact = (m.text or "").strip()
        if contact.lower() in ["/start", "main menu", "🔙 main menu"]:
            states.pop(uid, None)
            orders.pop(uid, None)
            return main_menu(m.chat.id)

        order = orders.get(uid, {})
        order["contact"] = "" if contact.lower() == "skip" else contact
        orders[uid] = order

        show_payment(m.chat.id, uid)

    def handle_tx(m):
        uid = m.from_user.id
        tx  = (m.text or "").strip()
        if tx.lower() in ["/start", "main menu", "🔙 main menu"]:
            states.pop(uid, None)
            orders.pop(uid, None)
            return main_menu(m.chat.id)
        if len(tx) < 20:
            return send(m.chat.id, "❌ TX hash too short. Please send the full transaction ID.")

        order = orders.get(uid, {})
        tk    = order.get("token", {})
        discord_notify("💰 PAYMENT TX RECEIVED", {
            "Service":  f"{order.get('svc_name')} — {order.get('tier_name')}",
            "Amount":   f"{order.get('crypto_amount')} {order.get('currency')}",
            "TX Hash":  tx,
            "Token CA": order.get("ca", "N/A"),
            "Token":    tk.get("name", "N/A"),
            "User":     str(uid),
            "Username": f"@{m.from_user.username or 'N/A'}",
        }, 0x22c55e)
        try:
            bot.send_message(ADMIN_ID,
                f"💰 *PAYMENT TX*\nService: {order.get('svc_name')} — {order.get('tier_name')}\n"
                f"Amount: {order.get('crypto_amount')} {order.get('currency')}\n"
                f"TX: `{tx}`\nCA: `{order.get('ca', 'N/A')}`\n"
                f"Token: {tk.get('name', 'N/A')}\nUser: {uid} (@{m.from_user.username or 'N/A'})",
                parse_mode="Markdown")
        except Exception:
            pass
        states.pop(uid, None)
        send(m.chat.id,
            "✅ *Payment Submitted!*\n\n"
            "Your transaction is under review. Our team will verify and activate your order within *30–60 minutes*.\n\n"
            "Thank you for choosing Nomics! 🚀", parse="Markdown")


    def show_payment(cid, uid):
        order   = orders.get(uid, {})
        cur     = order.get("currency", "SOL")
        wallet  = WALLETS[cur]
        prices  = get_prices()
        usd     = order.get("tier_price", 0)
        amt     = to_crypto(usd, prices, cur)
        order["crypto_amount"] = f"{amt} {cur}"
        orders[uid] = order
        states[uid] = "need_tx"

        discord_notify(f"🆕 ORDER — {order.get('svc_name', '').upper()}", {
            "Service":  f"{order.get('svc_name')} — {order.get('tier_name')}",
            "Price":    f"${usd:,}",
            "Currency": cur,
            "Amount":   f"{amt} {cur}",
            "CA":       order.get("ca", "N/A"),
            "Token":    order.get("token", {}).get("name", "N/A"),
            "Contact":  order.get("contact", "N/A"),
            "User":     str(uid),
        }, 0xf97316)
        try:
            bot.send_message(ADMIN_ID,
                f"🆕 *NEW ORDER*\nService: {order.get('svc_name')} — {order.get('tier_name')}\n"
                f"Price: ${usd:,} → {amt} {cur}\nCA: `{order.get('ca', 'N/A')}`\n"
                f"Token: {order.get('token', {}).get('name', 'N/A')}\n"
                f"Contact: {order.get('contact', 'N/A')}\nUser: {uid}",
                parse_mode="Markdown")
        except Exception:
            pass

        txt = (
            f"━━━━━━━━━━━━━━━━━━━━━\n"
            f"💳 *Payment Instructions*\n"
            f"━━━━━━━━━━━━━━━━━━━━━\n\n"
            f"Service:  *{order.get('svc_name')} — {order.get('tier_name')}*\n"
            f"Network:  *{wallet['name']}*\n\n"
            f"💰 Amount to send:\n"
            f"`{amt} {cur}`\n"
            f"_(≈ ${usd:,} USD at current rate)_\n\n"
            f"📬 Send to this address:\n"
            f"`{wallet['addr']}`\n\n"
            f"After sending, reply here with your *transaction hash (TXID)*.\n"
            f"_Order confirmed within 30–60 minutes of verification._"
        )
        send(cid, txt)

    @bot.callback_query_handler(func=lambda c: c.data.startswith("home_"))
    def cb_home(c):
        uid = c.from_user.id
        key = c.data
        bot.answer_callback_query(c.id)
        if key == "home_services":
            states.pop(uid, None)
            orders.pop(uid, None)
            services_menu(c.message.chat.id)
        elif key == "home_alpha":
            states.pop(uid, None)
            orders.pop(uid, None)
            prices = get_prices()
            tiers  = TIERS["alpha"]
            kb     = types.InlineKeyboardMarkup(row_width=1)
            for t_name, t_price, _ in tiers:
                sol = to_crypto(t_price, prices, "SOL")
                eth = to_crypto(t_price, prices, "ETH")
                kb.add(types.InlineKeyboardButton(
                    f"{t_name} — ${t_price:,}  |  ◎{sol} · ⟠{eth}",
                    callback_data=f"tier_alpha_{t_name}"
                ))
            kb.add(types.InlineKeyboardButton("🔙 Main Menu", callback_data="home_back"))
            send(c.message.chat.id,
                "🔑 *Alpha Group Access*\n\n"
                "Exclusive private channel:\n"
                "✅ Early gem calls before they pump\n"
                "✅ Insider DEX trending signals\n"
                "✅ Direct KOL network access\n"
                "✅ Daily market alpha & analysis\n\n"
                "Choose your plan:", kb)
        elif key == "home_prices":
            prices = get_prices()
            send(c.message.chat.id,
                f"📊 *Live Crypto Prices*\n\n"
                f"◎ *SOL* — `${prices['SOL']:,.2f}`\n"
                f"⟠ *ETH* — `${prices['ETH']:,.2f}`\n"
                f"🟡 *BNB* — `${prices['BNB']:,.2f}`\n\n"
                f"_Fetched live from CoinGecko._")
        elif key == "home_support":
            kb = types.InlineKeyboardMarkup()
            kb.add(types.InlineKeyboardButton(f"📩 Message {SUPPORT}", url="https://t.me/crypto_guy02"))
            send(c.message.chat.id,
                f"💬 *Support*\n\nFor any questions, order help, or custom deals:\n\n"
                f"Message us directly: {SUPPORT}\n\n_We typically respond within a few hours._", kb)
        elif key == "home_back":
            states.pop(uid, None)
            orders.pop(uid, None)
            main_menu(c.message.chat.id)

    @bot.callback_query_handler(func=lambda c: c.data.startswith("svc_"))
    def cb_svc(c):
        uid     = c.from_user.id
        svc_key = c.data[4:]
        bot.answer_callback_query(c.id)
        states.pop(uid, None)
        orders.pop(uid, None)

        match = next(((e, k, n, needs_ca) for e, k, n, needs_ca in SERVICES if k == svc_key), None)
        if not match:
            return send(c.message.chat.id, "⚠️ Service not found.")

        emoji, key, name, needs_ca = match
        orders[uid] = {"svc_key": key, "svc_name": name}

        if needs_ca:
            states[uid] = "need_ca"
            send(c.message.chat.id,
                f"{emoji} *{name}*\n\n"
                "📝 Enter your *token contract address (CA)*\n\n"
                "I'll fetch your token's name, price, market cap, liquidity, description, and all social links from DexScreener automatically.")
        else:
            prices = get_prices()
            tiers  = TIERS.get(key, [])
            kb     = types.InlineKeyboardMarkup(row_width=1)
            for t_name, t_price, t_desc in tiers:
                sol = to_crypto(t_price, prices, "SOL")
                eth = to_crypto(t_price, prices, "ETH")
                kb.add(types.InlineKeyboardButton(
                    f"{t_name} — ${t_price:,}  |  ◎{sol} · ⟠{eth}",
                    callback_data=f"tier_{key}_{t_name}"
                ))
            kb.add(types.InlineKeyboardButton("🔙 Services", callback_data="home_services"))
            states[uid] = "choose_tier"
            send(c.message.chat.id, f"{emoji} *{name}*\n\nChoose your package:", kb)

    @bot.callback_query_handler(func=lambda c: c.data.startswith("tier_"))
    def cb_tier(c):
        uid  = c.from_user.id
        bot.answer_callback_query(c.id)
        parts    = c.data.split("_", 2)
        svc_key  = parts[1]
        tier_name = parts[2] if len(parts) > 2 else ""

        tiers = TIERS.get(svc_key, [])
        tier  = next((t for t in tiers if t[0] == tier_name), None)
        if not tier:
            return send(c.message.chat.id, "⚠️ Tier not found.")

        t_name, t_price, t_desc = tier
        prices = get_prices()

        order = orders.get(uid, {})
        order.update({
            "svc_key":   svc_key,
            "tier_name": t_name,
            "tier_price": t_price,
            "tier_desc": t_desc,
        })
        orders[uid] = order
        states[uid] = "choose_currency"

        sol = to_crypto(t_price, prices, "SOL")
        eth = to_crypto(t_price, prices, "ETH")
        bnb = to_crypto(t_price, prices, "BNB")

        kb = types.InlineKeyboardMarkup(row_width=1)
        kb.add(
            types.InlineKeyboardButton(f"◎ Pay {sol} SOL", callback_data=f"cur_{svc_key}_SOL"),
            types.InlineKeyboardButton(f"⟠ Pay {eth} ETH", callback_data=f"cur_{svc_key}_ETH"),
            types.InlineKeyboardButton(f"🟡 Pay {bnb} BNB", callback_data=f"cur_{svc_key}_BNB"),
        )
        kb.add(types.InlineKeyboardButton("🔙 Back", callback_data=f"svc_{svc_key}"))

        svc_name = order.get("svc_name", svc_key)
        txt = (
            f"✅ *{svc_name} — {t_name}*\n"
            f"_{t_desc}_\n\n"
            f"💰 *Price: ${t_price:,} USD*\n\n"
            f"◎ SOL  `{sol} SOL`\n"
            f"⟠ ETH  `{eth} ETH`\n"
            f"🟡 BNB  `{bnb} BNB`\n\n"
            "Select your *payment currency:*"
        )
        send(c.message.chat.id, txt, kb)

    @bot.callback_query_handler(func=lambda c: c.data.startswith("cur_"))
    def cb_currency(c):
        uid  = c.from_user.id
        bot.answer_callback_query(c.id)
        parts = c.data.split("_")
        cur   = parts[-1]
        if cur not in WALLETS:
            return send(c.message.chat.id, "⚠️ Invalid currency.")

        order = orders.get(uid, {})
        order["currency"] = cur
        orders[uid] = order
        states[uid] = "need_contact"

        send(c.message.chat.id,
            "📩 *Enter your Telegram username* so our team can follow up.\n\n"
            "Type `skip` if you'd rather not share.")


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

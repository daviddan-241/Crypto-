import os
import sys
import time
import random
import re
import threading
from filelock import FileLock
from telebot import TeleBot, types
from flask import Flask, render_template_string

# ===== FLASK FOR KEEP-ALIVE (Render / Railway style) =====
app = Flask(__name__)

@app.route('/')
def home():
    return render_template_string('''
    <!DOCTYPE html>
    <html><head><title>PF Raid Whales</title><meta http-equiv="refresh" content="300">
    <style>body{background:#0f0f23;color:#0f0;color-family:monospace;padding:40px;text-align:center}
    h1{color:#ff0}.box{background:#111;padding:20px;border-radius:12px;max-width:600px;margin:auto}</style></head>
    <body><h1>🤖 PF Raid Whales Bot</h1><div class="box">
    <p>✅ Running</p><p>Uptime: {{ uptime }}</p><p>Sessions: {{ users }}</p><p>Orders: {{ orders }}</p>
    </div><p>page refreshes every 5 min</p></body></html>
    ''', uptime=time.strftime('%Y-%m-%d %H:%M:%S'), users=len(user_states), orders=len(user_orders))

@app.route('/health')
def health(): return {"status": "ok"}, 200

threading.Thread(target=lambda: app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)), debug=False, use_reloader=False), daemon=True).start()

# ===== CONFIG =====
BOT_TOKEN = "8765151932:AAHUJ2WtV_Uc-GYW2b8uQARtfPyXwm2qIC0"
ADMIN_ID   = 5578314612
BOT_NAME   = "PF Raid Whales"

PAY_ADDRESSES = {
    "BTC": {"addr": "bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw", "emoji": "₿", "name": "Bitcoin"},
    "ETH": {"addr": "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A", "emoji": "⛓️", "name": "Ethereum"},
    "SOL": {"addr": "EaFeqxptPuo2jy3dA8dRsgRz8JRCPSK5mXT3qZZYT7f3", "emoji": "◎", "name": "Solana"}
}

bot = TeleBot(BOT_TOKEN)

user_states = {}
user_orders = {}

# ===== NAVIGATION =====
def nav_markup():
    m = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    m.add("🔙 Back", "🔝 Main Menu 🔝")
    return m

def confirm_markup(act):
    m = types.InlineKeyboardMarkup(row_width=2)
    m.add(
        types.InlineKeyboardButton("✅ Yes", callback_data=f"yes_{act}"),
        types.InlineKeyboardButton("❌ No",  callback_data=f"no_{act}")
    )
    return m

def reset_user(uid):
    user_states.pop(uid, None)
    user_orders.pop(uid, None)

def main_menu(cid):
    m = types.ReplyKeyboardMarkup(resize_keyboard=True)
    m.add("📦 Services", "📞 Support")
    bot.send_message(cid, f"🌟 *{BOT_NAME}* 🌟\n\n🚀 Web3 Growth • Raids • Marketing\nChoose below 👇", parse_mode="Markdown", reply_markup=m)

# ===== SERVICES – very low entry prices =====
SERVICES = {
    "token_marketing": {"name": "🚀 Token Marketing", "tiers": {
        "micro":   {"n": "Micro",   "p": 35,   "d": "basic posts • 24h"},
        "starter": {"n": "Starter", "p": 90,   "d": "socials + calls"},
        "growth":  {"n": "Growth",  "p": 250,  "d": "KOLs + trending"},
        "elite":   {"n": "Elite",   "p": 650,  "d": "full campaign"}
    }},
    "raiding_service": {"name": "⚔️ Raiding", "tiers": {
        "micro":   {"n": "Micro",   "p": 45,   "d": "1 day light raid"},
        "starter": {"n": "Starter", "p": 110,  "d": "1–2 days"},
        "growth":  {"n": "Growth",  "p": 280,  "d": "3–5 days"},
        "elite":   {"n": "Elite",   "p": 700,  "d": "7+ days heavy"}
    }},
    "calls_promotion": {"name": "📣 Calls Promo", "tiers": {
        "micro":   {"n": "Micro",   "p": 30,   "d": "few small calls"},
        "starter": {"n": "Starter", "p": 80,   "d": "5–10 calls"},
        "growth":  {"n": "Growth",  "p": 200,  "d": "mid-tier calls"},
        "elite":   {"n": "Elite",   "p": 550,  "d": "premium network"}
    }},
    "dex_trending": {"name": "🔥 DEX Trending", "tiers": {
        "micro":   {"n": "Micro",   "p": 50,   "d": "small bump"},
        "starter": {"n": "Starter", "p": 130,  "d": "basic push"},
        "growth":  {"n": "Growth",  "p": 320,  "d": "multi-DEX"},
        "elite":   {"n": "Elite",   "p": 800,  "d": "sustained"}
    }},
    "influencer_outreach": {"name": "🤝 KOL Outreach", "tiers": {
        "micro":   {"n": "Micro",   "p": 70,   "d": "2–3 micro"},
        "starter": {"n": "Starter", "p": 180,  "d": "3–5 micro"},
        "growth":  {"n": "Growth",  "p": 450,  "d": "8–12 mid"},
        "elite":   {"n": "Elite",   "p": 1100, "d": "15+ top"}
    }},
    "nft_promotion": {"name": "🎨 NFT Promotion", "tiers": {
        "micro":   {"n": "Micro",   "p": 55,   "d": "basic shill"},
        "starter": {"n": "Starter", "p": 140,  "d": "NFT promo"},
        "growth":  {"n": "Growth",  "p": 340,  "d": "mint hype"},
        "elite":   {"n": "Elite",   "p": 850,  "d": "full launch"}
    }},
    "meme_listing": {"name": "😂 Meme Listing", "tiers": {
        "micro":   {"n": "Micro",   "p": 25,   "d": "quick push"},
        "starter": {"n": "Starter", "p": 70,   "d": "listing help"},
        "growth":  {"n": "Growth",  "p": 160,  "d": "trending push"},
        "elite":   {"n": "Elite",   "p": 420,  "d": "viral push"}
    }},
    "token_verification": {"name": "✅ Verification", "tiers": {
        "micro":   {"n": "Micro",   "p": 20,   "d": "basic check"},
        "starter": {"n": "Starter", "p": 55,   "d": "blue check"},
        "growth":  {"n": "Growth",  "p": 130,  "d": "advanced"},
        "elite":   {"n": "Elite",   "p": 320,  "d": "premium + audit"}
    }},
    "token_pumping": {"name": "📈 Pumping", "tiers": {
        "micro":   {"n": "Micro",   "p": 80,   "d": "light coord"},
        "starter": {"n": "Starter", "p": 200,  "d": "volume pump"},
        "growth":  {"n": "Growth",  "p": 480,  "d": "strong pump"},
        "elite":   {"n": "Elite",   "p": 1200, "d": "sustained"}
    }},
    "dex_listing": {"name": "📊 DEX Listing", "tiers": {
        "micro":   {"n": "Micro",   "p": 45,   "d": "basic help"},
        "starter": {"n": "Starter", "p": 110,  "d": "listing support"},
        "growth":  {"n": "Growth",  "p": 260,  "d": "fast + promo"},
        "elite":   {"n": "Elite",   "p": 650,  "d": "premium"}
    }},
    "birdeye_listing": {"name": "👁 Birdeye Listing", "tiers": {
        "micro":   {"n": "Micro",   "p": 35,   "d": "basic push"},
        "starter": {"n": "Starter", "p": 90,   "d": "fast listing"},
        "growth":  {"n": "Growth",  "p": 220,  "d": "advanced"},
        "elite":   {"n": "Elite",   "p": 550,  "d": "premium"}
    }},
    "twitter_shilling": {"name": "🐦 Twitter Shill", "tiers": {
        "micro":   {"n": "Micro",   "p": 40,   "d": "basic posts"},
        "starter": {"n": "Starter", "p": 100,  "d": "campaign"},
        "growth":  {"n": "Growth",  "p": 240,  "d": "strong hype"},
        "elite":   {"n": "Elite",   "p": 600,  "d": "viral"}
    }},
    "revenue_share_marketing": {"name": "💰 Rev Share Deal", "tiers": {
        "custom": {"n": "Custom", "p": 0, "d": "performance based"}
    }},
}

TIER_REQUIREMENTS = {
    "token_marketing": {
        "growth":  [{"f":"audience", "p":"Target audience? (degens / holders / ...)"}, {"f":"reach", "p":"Desired reach goal?"}],
        "elite":   [{"f":"audience", "p":"Target audience?"}, {"f":"reach", "p":"Reach goal?"}, {"f":"platforms", "p":"Preferred platforms?"}]
    },
    "raiding_service": {
        "growth":  [{"f":"days", "p":"How many days raiding?"}],
        "elite":   [{"f":"days", "p":"Days?"}, {"f":"channels", "p":"Target group sizes?"}]
    },
    "calls_promotion": {
        "growth":  [{"f":"calls", "p":"How many calls / groups?"}],
        "elite":   [{"f":"calls", "p":"Number of calls?"}, {"f":"callers", "p":"Preferred caller types?"}]
    },
    "dex_trending": {
        "growth":  [{"f":"volume", "p":"Target 24h volume?"}],
        "elite":   [{"f":"volume", "p":"24h volume goal?"}, {"f":"days", "p":"Days to sustain?"}]
    },
    "influencer_outreach": {
        "growth":  [{"f":"kolcount", "p":"How many mid KOLs?"}, {"f":"niches", "p":"Preferred niches?"}],
        "elite":   [{"f":"kolcount", "p":"Total KOLs?"}, {"f":"niches", "p":"Niches?"}, {"f":"budget", "p":"Budget per KOL?"}]
    }
}

def valid_contract(t): return t.strip() in ["N/A","n/a",""] or bool(re.match(r'^0x[a-fA-F0-9]{40}$',t)) or bool(re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$',t))
def valid_tg(t):       return t.lower().strip().startswith(('https://t.me/','t.me/','@'))
def valid_usd(t):      return bool(re.match(r'^\d+(\.\d+)?$', t.strip())) and 0 < float(t.strip()) <= 100000
def valid_int(t, mi=1, ma=100000): return t.isdigit() and mi <= int(t) <= ma

# ===== MAIN HANDLERS =====

@bot.message_handler(func=lambda m: m.text == "📦 Services")
def list_services(m):
    markup = types.InlineKeyboardMarkup(row_width=1)
    for k,v in SERVICES.items():
        markup.add(types.InlineKeyboardButton(v["name"], callback_data=f"cat_{k}"))
    bot.send_message(m.chat.id, "Select category:", reply_markup=markup)

@bot.callback_query_handler(func=lambda c: c.data.startswith("cat_"))
def show_tiers(c):
    k = c.data[4:]
    s = SERVICES[k]
    m = types.InlineKeyboardMarkup(row_width=1)
    for tk,tv in s["tiers"].items():
        pr = "Custom" if tv["p"]==0 else f"${tv['p']}"
        m.add(types.InlineKeyboardButton(f"{tv['n']} – {pr} – {tv['d']}", callback_data=f"tier_{k}_{tk}"))
    bot.edit_message_text(f"**{s['name']}** tiers:", c.message.chat.id, c.message.message_id, parse_mode="Markdown", reply_markup=m)

@bot.callback_query_handler(func=lambda c: c.data.startswith("tier_"))
def select_tier(c):
    _, sk, tk = c.data.split("_")
    s = SERVICES[sk]
    t = s["tiers"][tk]

    uid = c.from_user.id
    user_orders[uid] = {
        "sk": sk, "tk": tk,
        "service": s["name"], "tier": t["n"], "price": t["p"], "desc": t["d"],
        "history": ["project"]
    }
    user_states[uid] = "project"

    bot.send_message(
        uid,
        f"Selected: **{s['name']} – {t['n']}**\nPrice: {'Custom' if t['p']==0 else f'${t['p']}'}\n\nProject name?",
        parse_mode="Markdown",
        reply_markup=nav_markup()
    )

@bot.message_handler(func=lambda m: m.from_user.id in user_states)
def collect_data(m):
    uid = m.from_user.id
    st = user_states.get(uid)
    if not st: return

    txt = m.text.strip()
    if txt in ["🔙 Back", "🔝 Main Menu 🔝"]: return

    ord = user_orders.setdefault(uid, {})
    hist = ord.setdefault("history", [])

    def err(msg):
        bot.send_message(uid, f"❌ {msg}\nTry again:", reply_markup=nav_markup())

    hist.append(st)

    if st == "project":
        if not 2 <= len(txt) <= 80:
            err("Name 2–80 characters")
            hist.pop()
            return
        ord["project"] = txt
        user_states[uid] = "contract"
        bot.send_message(uid, "Contract address (or N/A):", reply_markup=nav_markup())

    elif st == "contract":
        if not valid_contract(txt):
            err("Invalid address (0x... / Solana / N/A)")
            hist.pop()
            return
        ord["contract"] = txt.upper() if txt.lower() != "n/a" else "N/A"
        user_states[uid] = "chain"
        bot.send_message(uid, "Blockchain (SOL/ETH/...):", reply_markup=nav_markup())

    elif st == "chain":
        if not 2 <= len(txt) <= 20:
            err("Chain name 2–20 chars")
            hist.pop()
            return
        ord["chain"] = txt.upper()
        user_states[uid] = "budget"
        bot.send_message(uid, "Marketing budget $ (number):", reply_markup=nav_markup())

    elif st == "budget":
        if not valid_usd(txt):
            err("Enter valid number")
            hist.pop()
            return
        ord["budget"] = txt
        user_states[uid] = "telegram"
        bot.send_message(uid, "Telegram link (@ or https://t.me/...):", reply_markup=nav_markup())

    elif st == "telegram":
        if not valid_tg(txt):
            err("Must start with @ or https://t.me/")
            hist.pop()
            return
        ord["telegram"] = txt

        extra = TIER_REQUIREMENTS.get(ord["sk"], {}).get(ord["tk"], [])
        if extra:
            ord["extra_list"] = extra
            ord["extra_idx"] = 0
            user_states[uid] = "extra"
            bot.send_message(uid, extra[0]["p"], reply_markup=nav_markup())
        else:
            bot.send_message(uid, "All done. Submit order?", reply_markup=confirm_markup("order"))
            user_states[uid] = "confirm_order"

    elif st == "extra":
        ex = ord["extra_list"]
        idx = ord["extra_idx"]
        fld = ex[idx]["f"]

        ok = True
        if "days" in fld or "count" in fld or "volume" in fld:
            ok = valid_int(txt)
        if not ok:
            err("Invalid format")
            hist.pop()
            return

        ord[fld] = txt

        if idx + 1 < len(ex):
            ord["extra_idx"] += 1
            bot.send_message(uid, ex[idx+1]["p"], reply_markup=nav_markup())
        else:
            bot.send_message(uid, "All done. Submit order?", reply_markup=confirm_markup("order"))
            user_states[uid] = "confirm_order"

@bot.callback_query_handler(func=lambda c: c.data.startswith(("yes_","no_")))
def handle_confirm(c):
    uid = c.from_user.id
    parts = c.data.split("_")
    ans, act = parts[0], parts[1]

    if ans == "no":
        bot.edit_message_text("Cancelled.", c.message.chat.id, c.message.message_id)
        return

    if act == "order":
        bot.edit_message_text("Order sent to team!", c.message.chat.id, c.message.message_id)
        send_order_to_admin(uid)
        if user_orders[uid]["price"] > 0:
            show_payment_options(uid)
        else:
            reset_user(uid)

    elif act == "tx":
        tx = user_orders[uid].get("pending_tx","")
        if tx:
            bot.edit_message_text("TX submitted – waiting for confirmation", c.message.chat.id, c.message.message_id)
            bot.send_message(ADMIN_ID, f"💸 TX from {uid}\n{user_orders[uid]['service']} – {user_orders[uid]['tier']}\n${user_orders[uid]['price']}\nTX: {tx}")
            user_states[uid] = "waiting_approve"

def send_order_to_admin(uid):
    o = user_orders.get(uid, {})
    lines = [
        f"🆕 ORDER {uid}",
        f"{o.get('service','–')} – {o.get('tier','–')}  ${o.get('price','–')}",
        f"Project: {o.get('project','–')}",
        f"Contract: {o.get('contract','–')}",
        f"Chain: {o.get('chain','–')}",
        f"Budget: ${o.get('budget','–')}",
        f"TG: {o.get('telegram','–')}"
    ]
    for k,v in o.items():
        if k not in ["sk","tk","service","tier","price","desc","history","extra_list","extra_idx"]:
            lines.append(f"{k.title()}: {v}")
    bot.send_message(ADMIN_ID, "\n".join(lines))

def show_payment_options(uid):
    m = types.InlineKeyboardMarkup(row_width=3)
    for k in PAY_ADDRESSES:
        m.add(types.InlineKeyboardButton(k, callback_data=f"pay_{k}"))
    bot.send_message(uid, f"Pay **${user_orders[uid]['price']}** – choose network:", reply_markup=m)

@bot.callback_query_handler(func=lambda c: c.data.startswith("pay_"))
def start_payment(c):
    chain = c.data[4:]
    info = PAY_ADDRESSES[chain]
    p = user_orders[c.from_user.id]["price"]
    txt = (
        f"Send **${p}** to:\n\n"
        f"{info['emoji']} **{info['name']}**\n"
        f"`{info['addr']}`\n\n"
        "Reply with TX hash after sending"
    )
    bot.send_message(c.from_user.id, txt, parse_mode="Markdown", reply_markup=nav_markup())
    user_states[c.from_user.id] = "tx"

@bot.message_handler(func=lambda m: user_states.get(m.from_user.id) == "tx")
def receive_tx(m):
    uid = m.from_user.id
    tx = m.text.strip()
    user_orders[uid]["pending_tx"] = tx
    bot.send_message(uid, f"Confirm TX hash?\n`{tx}`", parse_mode="Markdown", reply_markup=confirm_markup("tx"))

@bot.message_handler(func=lambda m: m.text == "📞 Support")
def support(m):
    bot.send_message(m.chat.id, "Contact admin directly → @youradminusernamehere")

@bot.message_handler(func=lambda m: m.text == "🔝 Main Menu 🔝")
def force_main(m):
    bot.send_message(m.chat.id, "Return to main menu?", reply_markup=confirm_markup("main"))

@bot.message_handler(func=lambda m: m.text == "🔙 Back")
def go_prev(m):
    go_back(m.from_user.id)

print(f"{BOT_NAME} started – {time.ctime()}")
bot.infinity_polling()
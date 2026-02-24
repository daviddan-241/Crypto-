# bot.py
import os
import sys
import time
import threading
import requests
from filelock import FileLock
from telebot import TeleBot, types
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return f"PF Raid Whales Bot - Running since {time.strftime('%Y-%m-%d %H:%M:%S')}"

@app.route('/health')
def health():
    return {"status": "ok"}, 200

# Run Flask in background
def run_flask():
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False, use_reloader=False)

threading.Thread(target=run_flask, daemon=True).start()

# ===========================================
# BOT CONFIG
# ===========================================
BOT_TOKEN = "8765151932:AAHUJ2WtV_Uc-GYW2b8uQARtfPyXwm2qIC0"
ADMIN_ID = 5578314612
BOT_NAME = "PF Raid Whales"

bot = TeleBot(BOT_TOKEN)

user_states = {}
user_orders = {}

PAY_ADDRESSES = {
    "BTC": {"addr": "bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw", "emoji": "₿", "name": "Bitcoin"},
    "ETH": {"addr": "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A", "emoji": "⛓️", "name": "Ethereum"},
    "SOL": {"addr": "EaFeqxptPuo2jy3dA8dRsgRz8JRCPSK5mXT3qZZYT7f3", "emoji": "◎", "name": "Solana"}
}

# Navigation
def nav():
    m = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    m.add("🔙 Back", "🔝 Main Menu 🔝")
    return m

def yesno(act):
    m = types.InlineKeyboardMarkup(row_width=2)
    m.add(
        types.InlineKeyboardButton("✅ Yes", callback_data=f"yes_{act}"),
        types.InlineKeyboardButton("❌ No", callback_data=f"no_{act}")
    )
    return m

def main_menu(cid):
    m = types.ReplyKeyboardMarkup(resize_keyboard=True)
    m.add("📦 Services", "📞 Support")
    bot.send_message(cid, f"🌟 *{BOT_NAME}* 🌟\n\nSelect below 👇", parse_mode="Markdown", reply_markup=m)

# Services – low prices
SERVICES = {
    "token_marketing": {"name": "🚀 Token Marketing", "tiers": {
        "micro":   {"n": "Micro",   "p": 25,  "d": "basic push"},
        "starter": {"n": "Starter", "p": 70,  "d": "socials + calls"},
        "growth":  {"n": "Growth",  "p": 180, "d": "KOLs + trending"},
        "elite":   {"n": "Elite",   "p": 450, "d": "full campaign"}
    }},
    "raiding_service": {"name": "⚔️ Raiding", "tiers": {
        "micro":   {"n": "Micro",   "p": 30,  "d": "1 day"},
        "starter": {"n": "Starter", "p": 80,  "d": "1–2 days"},
        "growth":  {"n": "Growth",  "p": 200, "d": "3–5 days"},
        "elite":   {"n": "Elite",   "p": 500, "d": "7+ days"}
    }},
    "calls_promotion": {"name": "📣 Calls", "tiers": {
        "micro":   {"n": "Micro",   "p": 20,  "d": "few calls"},
        "starter": {"n": "Starter", "p": 60,  "d": "5–10 calls"},
        "growth":  {"n": "Growth",  "p": 150, "d": "mid-tier"},
        "elite":   {"n": "Elite",   "p": 400, "d": "premium"}
    }},
    "dex_trending": {"name": "🔥 DEX Trending", "tiers": {
        "micro":   {"n": "Micro",   "p": 40,  "d": "small bump"},
        "starter": {"n": "Starter", "p": 100, "d": "basic push"},
        "growth":  {"n": "Growth",  "p": 250, "d": "multi-DEX"},
        "elite":   {"n": "Elite",   "p": 600, "d": "sustained"}
    }},
    "influencer_outreach": {"name": "🤝 KOL Outreach", "tiers": {
        "micro":   {"n": "Micro",   "p": 50,  "d": "2–3 micro"},
        "starter": {"n": "Starter", "p": 140, "d": "3–5 micro"},
        "growth":  {"n": "Growth",  "p": 350, "d": "8–12 mid"},
        "elite":   {"n": "Elite",   "p": 850, "d": "15+ top"}
    }},
    "nft_promotion": {"name": "🎨 NFT Promo", "tiers": {
        "micro":   {"n": "Micro",   "p": 40,  "d": "basic shill"},
        "starter": {"n": "Starter", "p": 110, "d": "NFT promo"},
        "growth":  {"n": "Growth",  "p": 270, "d": "mint hype"},
        "elite":   {"n": "Elite",   "p": 650, "d": "full launch"}
    }},
    "meme_listing": {"name": "😂 Meme Listing", "tiers": {
        "micro":   {"n": "Micro",   "p": 20,  "d": "quick push"},
        "starter": {"n": "Starter", "p": 60,  "d": "listing help"},
        "growth":  {"n": "Growth",  "p": 140, "d": "trending"},
        "elite":   {"n": "Elite",   "p": 350, "d": "viral"}
    }},
    "token_verification": {"name": "✅ Verification", "tiers": {
        "micro":   {"n": "Micro",   "p": 15,  "d": "basic"},
        "starter": {"n": "Starter", "p": 45,  "d": "blue check"},
        "growth":  {"n": "Growth",  "p": 110, "d": "advanced"},
        "elite":   {"n": "Elite",   "p": 280, "d": "premium"}
    }},
    "token_pumping": {"name": "📈 Pumping", "tiers": {
        "micro":   {"n": "Micro",   "p": 60,  "d": "light pump"},
        "starter": {"n": "Starter", "p": 160, "d": "volume pump"},
        "growth":  {"n": "Growth",  "p": 380, "d": "strong"},
        "elite":   {"n": "Elite",   "p": 950, "d": "sustained"}
    }},
    "dex_listing": {"name": "📊 DEX Listing", "tiers": {
        "micro":   {"n": "Micro",   "p": 35,  "d": "basic"},
        "starter": {"n": "Starter", "p": 90,  "d": "listing help"},
        "growth":  {"n": "Growth",  "p": 220, "d": "fast + promo"},
        "elite":   {"n": "Elite",   "p": 550, "d": "premium"}
    }},
    "birdeye_listing": {"name": "👁 Birdeye", "tiers": {
        "micro":   {"n": "Micro",   "p": 30,  "d": "basic"},
        "starter": {"n": "Starter", "p": 80,  "d": "fast listing"},
        "growth":  {"n": "Growth",  "p": 190, "d": "advanced"},
        "elite":   {"n": "Elite",   "p": 480, "d": "premium"}
    }},
    "twitter_shilling": {"name": "🐦 Twitter Shill", "tiers": {
        "micro":   {"n": "Micro",   "p": 35,  "d": "basic posts"},
        "starter": {"n": "Starter", "p": 90,  "d": "campaign"},
        "growth":  {"n": "Growth",  "p": 210, "d": "strong hype"},
        "elite":   {"n": "Elite",   "p": 520, "d": "viral"}
    }},
    "revenue_share_marketing": {"name": "💰 Rev Share", "tiers": {
        "custom": {"n": "Custom", "p": 0, "d": "performance based"}
    }}
}

TIER_REQUIREMENTS = {
    "token_marketing": {
        "growth":  [{"f":"audience","p":"Target audience?"}, {"f":"reach","p":"Reach goal?"}],
        "elite":   [{"f":"audience","p":"Target audience?"}, {"f":"reach","p":"Reach goal?"}, {"f":"platforms","p":"Platforms?"}]
    },
    "raiding_service": {
        "growth":  [{"f":"days","p":"Days of raiding?"}],
        "elite":   [{"f":"days","p":"Days?"}, {"f":"size","p":"Target group sizes?"}]
    }
}

# Validation
def vc(t): return t.strip() in ["N/A","n/a",""] or re.match(r'^0x[a-fA-F0-9]{40}$',t) or re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$',t)
def vt(t): return t.lower().strip().startswith(('https://t.me/','t.me/','@'))
def vb(t): return bool(re.match(r'^\d+(\.\d+)?$',t.strip())) and 0<float(t.strip())<=100000
def vi(t): return t.isdigit() and 1<=int(t)<=100000

# ===========================================
# HANDLERS
# ===========================================

@bot.message_handler(commands=['start'])
def start(m):
    main_menu(m.chat.id)

@bot.message_handler(func=lambda m: m.text in ["📦 Services", "Services"])
def services(m):
    mk = types.InlineKeyboardMarkup(row_width=1)
    for k,v in SERVICES.items():
        mk.add(types.InlineKeyboardButton(v["name"], callback_data=f"s_{k}"))
    bot.send_message(m.chat.id, "Pick category:", reply_markup=mk)

@bot.callback_query_handler(func=lambda c: c.data.startswith("s_"))
def tiers(c):
    k = c.data[2:]
    s = SERVICES[k]
    mk = types.InlineKeyboardMarkup(row_width=1)
    for tk,tv in s["tiers"].items():
        pr = "Custom" if tv["p"]==0 else f"${tv['p']}"
        mk.add(types.InlineKeyboardButton(f"{tv['n']} – {pr}", callback_data=f"t_{k}_{tk}"))
    bot.edit_message_text(f"{s['name']} tiers:", c.message.chat.id, c.message.message_id, reply_markup=mk)

@bot.callback_query_handler(func=lambda c: c.data.startswith("t_"))
def pick_tier(c):
    _,sk,tk = c.data.split("_")
    s = SERVICES[sk]
    t = s["tiers"][tk]
    uid = c.from_user.id
    user_orders[uid] = {"sk":sk,"tk":tk,"s":s["name"],"t":t["n"],"p":t["p"],"d":t["d"],"hist":["proj"]}
    user_states[uid] = "proj"
    bot.send_message(uid, f"{s['name']} – {t['n']}\n${t['p'] if t['p'] else 'Custom'}\n\nProject name?", reply_markup=nav())

@bot.message_handler(func=lambda m: m.from_user.id in user_states)
def flow(m):
    uid = m.from_user.id
    st = user_states.get(uid)
    txt = m.text.strip()
    if txt in ["🔙 Back","🔝 Main Menu 🔝"]: return
    o = user_orders.setdefault(uid,{})
    h = o.setdefault("hist",[])

    def e(msg):
        bot.send_message(uid,f"❌ {msg}",reply_markup=nav())

    h.append(st)

    if st=="proj":
        if not 2<=len(txt)<=80: e("2–80 chars"); h.pop(); return
        o["proj"]=txt
        user_states[uid]="cont"
        bot.send_message(uid,"Contract (or N/A):",reply_markup=nav())

    elif st=="cont":
        if not vc(txt): e("Invalid / use N/A"); h.pop(); return
        o["cont"]=txt.upper() if txt.lower()!="n/a" else "N/A"
        user_states[uid]="chain"
        bot.send_message(uid,"Chain (SOL/ETH/...):",reply_markup=nav())

    elif st=="chain":
        if not 2<=len(txt)<=15: e("2–15 chars"); h.pop(); return
        o["chain"]=txt.upper()
        user_states[uid]="budg"
        bot.send_message(uid,"Budget $ (number):",reply_markup=nav())

    elif st=="budg":
        if not vb(txt): e("Valid number please"); h.pop(); return
        o["budg"]=txt
        user_states[uid]="tg"
        bot.send_message(uid,"Telegram (@ or https://t.me/...):",reply_markup=nav())

    elif st=="tg":
        if not vt(txt): e("Must be @ or t.me link"); h.pop(); return
        o["tg"]=txt
        ex = TIER_REQUIREMENTS.get(o["sk"],{}).get(o["tk"],[])
        if ex:
            o["ex"]=ex
            o["exi"]=0
            user_states[uid]="ex"
            bot.send_message(uid,ex[0]["p"],reply_markup=nav())
        else:
            bot.send_message(uid,"Submit order?",reply_markup=yesno("ord"))
            user_states[uid]="conf"

    elif st=="ex":
        ex = o["ex"]
        i = o["exi"]
        f = ex[i]["f"]
        ok = True
        if "days" in f or "count" in f: ok = vi(txt)
        if not ok: e("Bad format"); h.pop(); return
        o[f]=txt
        if i+1<len(ex):
            o["exi"]+=1
            bot.send_message(uid,ex[i+1]["p"],reply_markup=nav())
        else:
            bot.send_message(uid,"Submit order?",reply_markup=yesno("ord"))
            user_states[uid]="conf"

@bot.callback_query_handler(func=lambda c: c.data.startswith(("yes_","no_")))
def conf(c):
    uid = c.from_user.id
    a = c.data.split("_")[1]
    if c.data.startswith("no_"):
        bot.edit_message_text("Cancelled",c.message.chat.id,c.message.message_id)
        return
    if a=="ord":
        bot.edit_message_text("Order sent!",c.message.chat.id,c.message.message_id)
        o = user_orders.get(uid,{})
        lines = [f"ORDER {uid} | {o.get('s')} – {o.get('t')} | ${o.get('p')}"]
        for k in ["proj","cont","chain","budg","tg"]:
            lines.append(f"{k}: {o.get(k,'–')}")
        bot.send_message(ADMIN_ID,"\n".join(lines))
        if o.get("p",0)>0:
            mk = types.InlineKeyboardMarkup(row_width=3)
            for k in PAY_ADDRESSES: mk.add(types.InlineKeyboardButton(k,callback_data=f"p_{k}"))
            bot.send_message(uid,f"Pay ${o['p']} – choose:",reply_markup=mk)
        else:
            reset_user(uid)
    elif a=="tx":
        tx = user_orders[uid].get("tx","")
        bot.edit_message_text("TX sent – waiting",c.message.chat.id,c.message.message_id)
        bot.send_message(ADMIN_ID,f"TX {uid}\n{o['s']} – {o['t']}\n${o['p']}\n{tx}")

@bot.callback_query_handler(func=lambda c: c.data.startswith("p_"))
def pay(c):
    ch = c.data[2:]
    i = PAY_ADDRESSES[ch]
    p = user_orders[c.from_user.id]["p"]
    txt = f"Send ${p}\n\n{i['emoji']} {i['name']}\n`{i['addr']}`\n\nReply with TX hash"
    bot.send_message(c.from_user.id,txt,parse_mode="Markdown",reply_markup=nav())
    user_states[c.from_user.id]="tx"

@bot.message_handler(func=lambda m: user_states.get(m.from_user.id)=="tx")
def txtx(m):
    uid = m.from_user.id
    tx = m.text.strip()
    user_orders[uid]["tx"]=tx
    bot.send_message(uid,f"Confirm TX?\n`{tx}`",parse_mode="Markdown",reply_markup=yesno("tx"))

@bot.message_handler(func=lambda m: m.text=="📞 Support")
def sup(m):
    bot.send_message(m.chat.id,"Message admin directly")

@bot.message_handler(func=lambda m: m.text=="🔝 Main Menu 🔝")
def mm(m):
    bot.send_message(m.chat.id,"Return to menu?",reply_markup=yesno("mm"))

@bot.callback_query_handler(func=lambda c: c.data in ["yes_mm","no_mm"])
def hmm(c):
    if c.data=="yes_mm":
        reset_user(c.from_user.id)
        bot.edit_message_text("Main menu",c.message.chat.id,c.message.message_id)

print(f"{BOT_NAME} started")
bot.infinity_polling(timeout=20, long_polling_timeout=15)
# bot.py – Render-ready, fixed syntax, more description, full info to DM first

import os
import time
import threading
import re
from telebot import TeleBot, types
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home():
    return f"PF Raid Whales Bot – Active since {time.strftime('%Y-%m-%d %H:%M:%S UTC')}"

@app.route('/health')
def health():
    return {"status": "ok"}, 200

# Start Flask in background thread
threading.Thread(
    target=lambda: app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000)),
        debug=False,
        use_reloader=False
    ),
    daemon=True
).start()

# ────────────────────────────────────────────────
TOKEN = "8765151932:AAHUJ2WtV_Uc-GYW2b8uQARtfPyXwm2qIC0"
ADMIN = 5578314612
NAME  = "PF Raid Whales"
IMG   = "https://i.ibb.co/bj0fnN56/IMG-1994.jpg"  # your welcome image

PAY = {
    "BTC": {"a": "bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw", "e": "₿", "n": "Bitcoin"},
    "ETH": {"a": "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A", "e": "⛓️", "n": "Ethereum"},
    "SOL": {"a": "EaFeqxptPuo2jy3dA8dRsgRz8JRCPSK5mXT3qZZYT7f3", "e": "◎", "n": "Solana"}
}

bot = TeleBot(TOKEN)
states = {}
orders = {}

def nav():
    m = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    m.add("Back", "Main Menu")
    return m

def yn(act):
    m = types.InlineKeyboardMarkup(row_width=2)
    m.add(
        types.InlineKeyboardButton("Yes", callback_data=f"y_{act}"),
        types.InlineKeyboardButton("No",  callback_data=f"n_{act}")
    )
    return m

def menu(cid):
    long_text = (
        f"*{NAME}* – Professional Web3 Growth Agency\n\n"
        "We specialize in high-impact marketing, community building, "
        "raiding operations, KOL outreach, DEX visibility, token verification, "
        "volume generation, and performance-based growth strategies for tokens, "
        "memecoins, NFTs, and emerging projects.\n\n"
        "All campaigns are tailored to your goals, timeline, and budget.\n"
        "Provide your project details first → we review → then discuss pricing and execution.\n\n"
        "Choose an option to begin."
    )
    m = types.ReplyKeyboardMarkup(resize_keyboard=True)
    m.add("Services", "Support")
    bot.send_photo(cid, IMG, caption=long_text, parse_mode="Markdown", reply_markup=m)

# ────────────────────────────────────────────────
# SERVICES (14 categories)
# ────────────────────────────────────────────────
SERVICES = {
    "token_marketing": {"n": "Token Marketing", "t": {
        "m": {"n": "Micro",   "p": 49,  "d": "Basic social exposure – 48 hours"},
        "s": {"n": "Starter", "p": 149, "d": "Social posts + calls + Telegram push"},
        "g": {"n": "Growth",  "p": 399, "d": "Mid-tier KOLs + trending + raids"},
        "e": {"n": "Elite",   "p": 999, "d": "Top-tier influencers + volume + multi-channel"}
    }},
    "raiding": {"n": "Raiding Service", "t": {
        "m": {"n": "Micro",   "p": 59,  "d": "1-day targeted raid"},
        "s": {"n": "Starter", "p": 149, "d": "1–2 days Telegram/Discord"},
        "g": {"n": "Growth",  "p": 349, "d": "3–5 days coordinated raiding"},
        "e": {"n": "Elite",   "p": 899, "d": "7+ days full-scale raid operation"}
    }},
    "calls": {"n": "Shill Calls Promotion", "t": {
        "m": {"n": "Micro",   "p": 39,  "d": "2–4 small caller groups"},
        "s": {"n": "Starter", "p": 99,  "d": "5–10 coordinated calls"},
        "g": {"n": "Growth",  "p": 249, "d": "Mid-tier callers + timed execution"},
        "e": {"n": "Elite",   "p": 649, "d": "Large premium caller network"}
    }},
    "dex_trend": {"n": "DEX Trending", "t": {
        "m": {"n": "Micro",   "p": 69,  "d": "Basic visibility bump"},
        "s": {"n": "Starter", "p": 169, "d": "Raydium / Jupiter push"},
        "g": {"n": "Growth",  "p": 399, "d": "Multi-DEX trending support"},
        "e": {"n": "Elite",   "p": 999, "d": "Sustained trending + volume boost"}
    }},
    "kol": {"n": "KOL / Influencer Outreach", "t": {
        "m": {"n": "Micro",   "p": 99,  "d": "2–3 micro-influencers"},
        "s": {"n": "Starter", "p": 249, "d": "3–5 small / micro KOLs"},
        "g": {"n": "Growth",  "p": 599, "d": "8–12 mid-tier influencers"},
        "e": {"n": "Elite",   "p": 1499,"d": "15+ top-tier KOLs & influencers"}
    }},
    "nft": {"n": "NFT Promotion", "t": {
        "m": {"n": "Micro",   "p": 55,  "d": "Basic NFT shilling"},
        "s": {"n": "Starter", "p": 149, "d": "NFT promotion & teasers"},
        "g": {"n": "Growth",  "p": 349, "d": "Mint hype + giveaways"},
        "e": {"n": "Elite",   "p": 899, "d": "Full NFT launch support"}
    }},
    "meme": {"n": "Meme Coin Push", "t": {
        "m": {"n": "Micro",   "p": 29,  "d": "Quick meme exposure"},
        "s": {"n": "Starter", "p": 79,  "d": "Listing + basic promotion"},
        "g": {"n": "Growth",  "p": 199, "d": "Trending meme support"},
        "e": {"n": "Elite",   "p": 499, "d": "Viral meme campaign"}
    }},
    "verify": {"n": "Token Verification", "t": {
        "m": {"n": "Micro",   "p": 25,  "d": "Basic verification"},
        "s": {"n": "Starter", "p": 69,  "d": "Blue check support"},
        "g": {"n": "Growth",  "p": 169, "d": "Advanced verification"},
        "e": {"n": "Elite",   "p": 399, "d": "Premium verification + audit coordination"}
    }},
    "pump": {"n": "Token Pumping", "t": {
        "m": {"n": "Micro",   "p": 79,  "d": "Light pump coordination"},
        "s": {"n": "Starter", "p": 199, "d": "Volume & pump support"},
        "g": {"n": "Growth",  "p": 499, "d": "Strong pump push"},
        "e": {"n": "Elite",   "p": 1199,"d": "Sustained volume strategy"}
    }},
    "dex_list": {"n": "DEX Listing Support", "t": {
        "m": {"n": "Micro",   "p": 49,  "d": "Basic listing help"},
        "s": {"n": "Starter", "p": 129, "d": "DEX listing support"},
        "g": {"n": "Growth",  "p": 299, "d": "Fast listing + promotion"},
        "e": {"n": "Elite",   "p": 749, "d": "Premium DEX integration"}
    }},
    "birdeye": {"n": "Birdeye Listing", "t": {
        "m": {"n": "Micro",   "p": 39,  "d": "Basic Birdeye push"},
        "s": {"n": "Starter", "p": 99,  "d": "Fast Birdeye listing"},
        "g": {"n": "Growth",  "p": 249, "d": "Advanced Birdeye features"},
        "e": {"n": "Elite",   "p": 599, "d": "Premium Birdeye optimization"}
    }},
    "twitter": {"n": "Twitter (X) Shilling", "t": {
        "m": {"n": "Micro",   "p": 45,  "d": "Basic Twitter posts"},
        "s": {"n": "Starter", "p": 119, "d": "Twitter campaign setup"},
        "g": {"n": "Growth",  "p": 289, "d": "Strong Twitter hype"},
        "e": {"n": "Elite",   "p": 699, "d": "Viral Twitter strategy"}
    }},
    "volume_bot": {"n": "Volume Bot Setup", "t": {
        "m": {"n": "Micro",   "p": 89,  "d": "Basic volume bot setup"},
        "s": {"n": "Starter", "p": 229, "d": "Short-term bot management"},
        "g": {"n": "Growth",  "p": 549, "d": "Advanced volume bot run"},
        "e": {"n": "Elite",   "p": 1299,"d": "Custom bot + anti-detection"}
    }},
    "rev_share": {"n": "Revenue Share Deal", "t": {
        "c": {"n": "Custom", "p": 0, "d": "Performance-based growth package"}
    }}
}

EXTRA = {
    "token_marketing": {
        "g": [{"f":"aud","p":"Target audience?"}, {"f":"reach","p":"Reach goal?"}],
        "e": [{"f":"aud","p":"Target audience?"}, {"f":"reach","p":"Reach goal?"}, {"f":"plat","p":"Platforms?"}]
    },
    "raiding": {
        "g": [{"f":"days","p":"Raiding days?"}],
        "e": [{"f":"days","p":"Days?"}, {"f":"size","p":"Target group sizes?"}]
    },
    "calls": {
        "g": [{"f":"calls","p":"Number of calls?"}],
        "e": [{"f":"calls","p":"Calls?"}, {"f":"type","p":"Preferred caller type?"}]
    },
    "dex_trend": {
        "g": [{"f":"vol","p":"Target 24h volume?"}],
        "e": [{"f":"vol","p":"24h volume?"}, {"f":"days","p":"Sustain days?"}]
    }
}

# Validation shortcuts
def vc(t): return t.strip() in ["N/A","n/a",""] or re.match(r'^0x[a-fA-F0-9]{40}$',t) or re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$',t)
def vt(t): return t.lower().strip().startswith(('https://t.me/','t.me/','@'))
def vb(t): 
    try: v = float(t.strip()); return 0 < v <= 100000
    except: return False
def vi(t): 
    try: v = int(t.strip()); return 1 <= v <= 100000
    except: return False

# ────────────────────────────────────────────────
# MAIN FLOW
# ────────────────────────────────────────────────

@bot.message_handler(commands=['start'])
def start(m): menu(m.chat.id)

@bot.message_handler(func=lambda m: m.text == "Services")
def show_cats(m):
    mk = types.InlineKeyboardMarkup(row_width=2)
    for k,v in SERVICES.items():
        mk.add(types.InlineKeyboardButton(v["n"], callback_data=f"c_{k}"))
    bot.send_message(m.chat.id, "Select service category:", reply_markup=mk)

@bot.callback_query_handler(func=lambda c: c.data.startswith("c_"))
def show_packages(c):
    k = c.data[2:]
    s = SERVICES[k]
    mk = types.InlineKeyboardMarkup(row_width=2)
    for tk,tv in s["t"].items():
        p = "Custom" if tv["p"]==0 else f"${tv['p']}"
        txt = f"{tv['n']} – {p}\n{tv['d']}"
        mk.add(types.InlineKeyboardButton(txt, callback_data=f"t_{k}_{tk}"))
    bot.edit_message_text(f"{s['n']} – Select package", c.message.chat.id, c.message.message_id, reply_markup=mk)

@bot.callback_query_handler(func=lambda c: c.data.startswith("t_"))
def start_order(c):
    _,sk,tk = c.data.split("_")
    s = SERVICES[sk]
    t = s["t"][tk]
    uid = c.from_user.id
    orders[uid] = {"sk":sk,"tk":tk,"s":s["n"],"t":t["n"],"p":t["p"],"d":t["d"],"h":["proj"]}
    states[uid] = "proj"
    bot.send_message(uid, f"Selected package: **{s['n']} – {t['n']}**\n{t['d']}\n\nPlease enter project name:", parse_mode="Markdown", reply_markup=nav())

@bot.message_handler(func=lambda m: m.from_user.id in states)
def gather_info(m):
    uid = m.from_user.id
    st = states.get(uid)
    txt = m.text.strip()
    if txt in ["Back", "Main Menu"]: return

    o = orders.setdefault(uid, {})
    h = o.setdefault("h", [])

    def err(msg):
        bot.send_message(uid, msg, reply_markup=nav())

    h.append(st)

    if st == "proj":
        if not 2 <= len(txt) <= 80: err("Project name: 2–80 characters"); h.pop(); return
        o["proj"] = txt
        states[uid] = "cont"
        bot.send_message(uid, "Contract address (or N/A):", reply_markup=nav())

    elif st == "cont":
        if not vc(txt): err("Invalid address format. Use N/A if none."); h.pop(); return
        o["cont"] = txt.upper() if txt.lower() != "n/a" else "N/A"
        states[uid] = "chain"
        bot.send_message(uid, "Blockchain (SOL, ETH, BSC, etc.):", reply_markup=nav())

    elif st == "chain":
        if not 2 <= len(txt) <= 15: err("Blockchain name: 2–15 characters"); h.pop(); return
        o["chain"] = txt.upper()
        states[uid] = "budg"
        bot.send_message(uid, "Marketing budget in USD:", reply_markup=nav())

    elif st == "budg":
        if not vb(txt): err("Enter valid budget amount (number)"); h.pop(); return
        o["budg"] = txt
        states[uid] = "tg"
        bot.send_message(uid, "Telegram link (@group or https://t.me/...):", reply_markup=nav())

    elif st == "tg":
        if not vt(txt): err("Telegram link must start with @ or https://t.me/"); h.pop(); return
        o["tg"] = txt

        ex = EXTRA.get(o["sk"], {}).get(o["tk"], [])
        if ex:
            o["ex"] = ex
            o["exi"] = 0
            states[uid] = "ex"
            bot.send_message(uid, ex[0]["p"], reply_markup=nav())
        else:
            send_full_info_to_admin(uid)
            ask_confirm(uid)

    elif st == "ex":
        ex = o["ex"]
        i = o["exi"]
        f = ex[i]["f"]
        ok = vi(txt) if any(x in f for x in ["days","count"]) else True
        if not ok: err("Please enter a valid number"); h.pop(); return
        o[f] = txt
        if i + 1 < len(ex):
            o["exi"] += 1
            bot.send_message(uid, ex[i+1]["p"], reply_markup=nav())
        else:
            send_full_info_to_admin(uid)
            ask_confirm(uid)

def send_full_info_to_admin(uid):
    o = orders.get(uid, {})
    lines = [
        f"NEW CLIENT – {uid}",
        f"Service: {o.get('s')} – {o.get('t')}",
        f"Planned price: ${o.get('p') if o.get('p') else 'Custom'}",
        "-"*40,
        f"Project: {o.get('proj','–')}",
        f"Contract: {o.get('cont','–')}",
        f"Chain: {o.get('chain','–')}",
        f"Budget: ${o.get('budg','–')}",
        f"Telegram: {o.get('tg','–')}"
    ]
    # extra fields
    for k in o:
        if k not in ["sk","tk","s","t","p","d","h","ex","exi"]:
            lines.append(f"{k.replace('_',' ').title()}: {o[k]}")

    bot.send_message(ADMIN, "\n".join(lines))

def ask_confirm(uid):
    states[uid] = "conf"
    bot.send_message(uid, "All project details collected.\n\nSubmit for review?", reply_markup=yn("sub"))

@bot.callback_query_handler(func=lambda c: c.data.startswith(("y_","n_")))
def handle_confirm(c):
    uid = c.from_user.id
    act = c.data[2:]
    if c.data.startswith("n_"):
        bot.edit_message_text("Submission cancelled.", c.message.chat.id, c.message.message_id)
        return

    if act == "sub":
        bot.edit_message_text("Order received – thank you.", c.message.chat.id, c.message.message_id)
        o = orders.get(uid, {})
        if o.get("p", 0) > 0:
            mk = types.InlineKeyboardMarkup(row_width=3)
            for k in PAY:
                mk.add(types.InlineKeyboardButton(k, callback_data=f"p_{k}"))
            bot.send_message(uid, f"Service fee: **${o['p']} USD**\n\nSelect payment network:", parse_mode="Markdown", reply_markup=mk)
        else:
            bot.send_message(uid, "Custom proposal submitted. Our team will contact you within 24 hours.")
            del states[uid]
            del orders[uid]

    elif act == "tx":
        tx = orders[uid].get("tx", "")
        bot.edit_message_text("Transaction hash submitted.", c.message.chat.id, c.message.message_id)
        o = orders.get(uid, {})
        bot.send_message(ADMIN, f"PAYMENT TX RECEIVED\nUser: {uid}\n{o.get('s')} – {o.get('t')}\n${o.get('p')}\nTX: {tx}")

@bot.callback_query_handler(func=lambda c: c.data.startswith("p_"))
def show_payment(c):
    ch = c.data[2:]
    i = PAY[ch]
    p = orders[c.from_user.id]["p"]
    msg = (
        f"Please transfer **${p}** to the address below:\n\n"
        f"{i['e']} **{i['n']}**\n"
        f"`{i['a']}`\n\n"
        "Once sent, reply with the transaction hash for verification."
    )
    bot.send_message(c.from_user.id, msg, parse_mode="Markdown", reply_markup=nav())
    states[c.from_user.id] = "tx"

@bot.message_handler(func=lambda m: states.get(m.from_user.id) == "tx")
def receive_tx(m):
    uid = m.from_user.id
    tx = m.text.strip()
    orders[uid]["tx"] = tx
    bot.send_message(uid, f"Transaction hash entered:\n`{tx}`\n\nConfirm this is correct?", parse_mode="Markdown", reply_markup=yn("tx"))

@bot.message_handler(func=lambda m: m.text == "Support")
def support(m):
    bot.send_message(m.chat.id, "Please message the administrator directly.")

@bot.message_handler(func=lambda m: m.text == "Main Menu")
def return_main(m):
    bot.send_message(m.chat.id, "Return to main menu?", reply_markup=yn("mm"))

@bot.callback_query_handler(func=lambda c: c.data == "y_mm")
def go_main(c):
    uid = c.from_user.id
    del states[uid]
    del orders[uid]
    bot.edit_message_text("Returned to main menu.", c.message.chat.id, c.message.message_id)
    menu(c.message.chat.id)

print(f"{NAME} started – {time.ctime()}")
bot.infinity_polling(timeout=20, long_polling_timeout=15)
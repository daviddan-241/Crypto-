import os, time, threading, re
from telebot import TeleBot, types
from flask import Flask

app = Flask(__name__)

@app.route('/')
def home(): return f"PF Raid Whales – {time.strftime('%Y-%m-%d %H:%M:%S')}"

@app.route('/health')
def health(): return {"status": "ok"}, 200

threading.Thread(target=lambda: app.run(host="0.0.0.0", port=int(os.environ.get("PORT",10000)), debug=False, use_reloader=False), daemon=True).start()

# ────────────────────────────────────────────────
TOKEN = "8765151932:AAHUJ2WtV_Uc-GYW2b8uQARtfPyXwm2qIC0"
ADMIN = 5578314612
NAME  = "PF Raid Whales"
IMG   = "https://i.ibb.co/bj0fnN56/IMG-1994.jpg"

PAY = {
    "BTC": {"a": "bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw", "e": "₿", "n": "Bitcoin"},
    "ETH": {"a": "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A", "e": "⛓️", "n": "Ethereum"},
    "SOL": {"a": "EaFeqxptPuo2jy3dA8dRsgRz8JRCPSK5mXT3qZZYT7f3", "e": "◎", "n": "Solana"}
}

bot = TeleBot(TOKEN)
states, orders = {}, {}

def nav(): 
    m = types.ReplyKeyboardMarkup(resize_keyboard=True,row_width=2)
    m.add("Back", "Main Menu")
    return m

def yn(act): 
    m = types.InlineKeyboardMarkup(row_width=2)
    m.add(types.InlineKeyboardButton("Yes", callback_data=f"y_{act}"),
          types.InlineKeyboardButton("No",  callback_data=f"n_{act}"))
    return m

def menu(cid):
    m = types.ReplyKeyboardMarkup(resize_keyboard=True)
    m.add("Services", "Support")
    bot.send_photo(cid, IMG, caption=f"*{NAME}*\nProfessional Web3 Growth Services\nSelect below.", parse_mode="Markdown", reply_markup=m)

SERVICES = {
    "token_marketing": {"n": "Token Marketing", "t": {
        "m": {"n": "Micro",   "p": 49,  "d": "Basic exposure – 48h"},
        "s": {"n": "Starter", "p": 149, "d": "Socials + calls + TG"},
        "g": {"n": "Growth",  "p": 399, "d": "Mid KOLs + trending"},
        "e": {"n": "Elite",   "p": 999, "d": "Top influencers + volume"}
    }},
    "raiding": {"n": "Raiding Service", "t": {
        "m": {"n": "Micro",   "p": 59,  "d": "1-day raid"},
        "s": {"n": "Starter", "p": 149, "d": "1–2 days TG/Discord"},
        "g": {"n": "Growth",  "p": 349, "d": "3–5 days coordinated"},
        "e": {"n": "Elite",   "p": 899, "d": "7+ days full raid"}
    }},
    "calls": {"n": "Shill Calls", "t": {
        "m": {"n": "Micro",   "p": 39,  "d": "2–4 small groups"},
        "s": {"n": "Starter", "p": 99,  "d": "5–10 calls"},
        "g": {"n": "Growth",  "p": 249, "d": "Mid-tier + timing"},
        "e": {"n": "Elite",   "p": 649, "d": "Premium network"}
    }},
    "dex_trend": {"n": "DEX Trending", "t": {
        "m": {"n": "Micro",   "p": 69,  "d": "Basic bump"},
        "s": {"n": "Starter", "p": 169, "d": "Raydium/Jupiter push"},
        "g": {"n": "Growth",  "p": 399, "d": "Multi-DEX trending"},
        "e": {"n": "Elite",   "p": 999, "d": "Sustained + volume"}
    }},
    "kol": {"n": "KOL Outreach", "t": {
        "m": {"n": "Micro",   "p": 99,  "d": "2–3 micro KOLs"},
        "s": {"n": "Starter", "p": 249, "d": "3–5 small KOLs"},
        "g": {"n": "Growth",  "p": 599, "d": "8–12 mid-tier"},
        "e": {"n": "Elite",   "p": 1499,"d": "15+ top-tier"}
    }},
    "nft": {"n": "NFT Promotion", "t": {
        "m": {"n": "Micro",   "p": 55,  "d": "Basic shill"},
        "s": {"n": "Starter", "p": 149, "d": "NFT promo"},
        "g": {"n": "Growth",  "p": 349, "d": "Mint hype"},
        "e": {"n": "Elite",   "p": 899, "d": "Full launch"}
    }},
    "meme": {"n": "Meme Coin Push", "t": {
        "m": {"n": "Micro",   "p": 29,  "d": "Quick push"},
        "s": {"n": "Starter", "p": 79,  "d": "Listing + push"},
        "g": {"n": "Growth",  "p": 199, "d": "Trending support"},
        "e": {"n": "Elite",   "p": 499, "d": "Viral campaign"}
    }},
    "verify": {"n": "Token Verification", "t": {
        "m": {"n": "Micro",   "p": 25,  "d": "Basic check"},
        "s": {"n": "Starter", "p": 69,  "d": "Blue check"},
        "g": {"n": "Growth",  "p": 169, "d": "Advanced"},
        "e": {"n": "Elite",   "p": 399, "d": "Premium + audit"}
    }},
    "pump": {"n": "Token Pumping", "t": {
        "m": {"n": "Micro",   "p": 79,  "d": "Light pump"},
        "s": {"n": "Starter", "p": 199, "d": "Volume pump"},
        "g": {"n": "Growth",  "p": 499, "d": "Strong push"},
        "e": {"n": "Elite",   "p": 1199,"d": "Sustained"}
    }},
    "dex_list": {"n": "DEX Listing", "t": {
        "m": {"n": "Micro",   "p": 49,  "d": "Basic help"},
        "s": {"n": "Starter", "p": 129, "d": "Listing support"},
        "g": {"n": "Growth",  "p": 299, "d": "Fast + promo"},
        "e": {"n": "Elite",   "p": 749, "d": "Premium"}
    }},
    "birdeye": {"n": "Birdeye Listing", "t": {
        "m": {"n": "Micro",   "p": 39,  "d": "Basic push"},
        "s": {"n": "Starter", "p": 99,  "d": "Fast listing"},
        "g": {"n": "Growth",  "p": 249, "d": "Advanced"},
        "e": {"n": "Elite",   "p": 599, "d": "Premium"}
    }},
    "twitter": {"n": "Twitter Shilling", "t": {
        "m": {"n": "Micro",   "p": 45,  "d": "Basic posts"},
        "s": {"n": "Starter", "p": 119, "d": "Campaign"},
        "g": {"n": "Growth",  "p": 289, "d": "Strong hype"},
        "e": {"n": "Elite",   "p": 699, "d": "Viral"}
    }},
    "volume_bot": {"n": "Volume Bot Setup", "t": {
        "m": {"n": "Micro",   "p": 89,  "d": "Basic setup"},
        "s": {"n": "Starter", "p": 229, "d": "Short-term"},
        "g": {"n": "Growth",  "p": 549, "d": "Advanced run"},
        "e": {"n": "Elite",   "p": 1299,"d": "Custom + anti-detect"}
    }},
    "rev_share": {"n": "Revenue Share Deal", "t": {
        "c": {"n": "Custom", "p": 0, "d": "Performance based"}
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
        "e": [{"f":"calls","p":"Calls?"}, {"f":"type","p":"Caller type?"}]
    },
    "dex_trend": {
        "g": [{"f":"vol","p":"Target 24h volume?"}],
        "e": [{"f":"vol","p":"24h volume?"}, {"f":"days","p":"Sustain days?"}]
    }
}

def vc(t): return t.strip() in ["N/A","n/a",""] or re.match(r'^0x[a-fA-F0-9]{40}$',t) or re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$',t)
def vt(t): return t.lower().strip().startswith(('https://t.me/','t.me/','@'))
def vb(t): try: v=float(t.strip()); return 0<v<=100000 except: return False
def vi(t): try: v=int(t.strip()); return 1<=v<=100000 except: return False

@bot.message_handler(commands=['start'])
def start(m): menu(m.chat.id)

@bot.message_handler(func=lambda m: m.text in ["Services"])
def cats(m):
    mk = types.InlineKeyboardMarkup(row_width=2)
    for k,v in SERVICES.items():
        mk.add(types.InlineKeyboardButton(v["n"], callback_data=f"c_{k}"))
    bot.send_message(m.chat.id, "Select category:", reply_markup=mk)

@bot.callback_query_handler(func=lambda c: c.data.startswith("c_"))
def tiers(c):
    k = c.data[2:]
    s = SERVICES[k]
    mk = types.InlineKeyboardMarkup(row_width=2)
    for tk,tv in s["t"].items():
        p = "Custom" if tv["p"]==0 else f"${tv['p']}"
        mk.add(types.InlineKeyboardButton(f"{tv['n']} – {p}\n{tv['d']}", callback_data=f"t_{k}_{tk}"))
    bot.edit_message_text(f"{s['n']} – Choose package", c.message.chat.id, c.message.message_id, reply_markup=mk)

@bot.callback_query_handler(func=lambda c: c.data.startswith("t_"))
def pick(c):
    _,sk,tk = c.data.split("_")
    s = SERVICES[sk]
    t = s["t"][tk]
    uid = c.from_user.id
    orders[uid] = {"sk":sk,"tk":tk,"s":s["n"],"t":t["n"],"p":t["p"],"d":t["d"],"h":["proj"]}
    states[uid] = "proj"
    bot.send_message(uid, f"Selected: **{s['n']} – {t['n']}**\n{t['d']}\n\nProject name:", parse_mode="Markdown", reply_markup=nav())

@bot.message_handler(func=lambda m: m.from_user.id in states)
def collect(m):
    uid = m.from_user.id
    st = states.get(uid)
    txt = m.text.strip()
    if txt in ["Back","Main Menu"]: return

    o = orders.setdefault(uid,{})
    h = o.setdefault("h",[])

    def err(msg): bot.send_message(uid, msg, reply_markup=nav())

    h.append(st)

    if st=="proj":
        if not 2<=len(txt)<=80: err("2–80 chars"); h.pop(); return
        o["proj"]=txt
        states[uid]="cont"
        bot.send_message(uid,"Contract (or N/A):",reply_markup=nav())

    elif st=="cont":
        if not vc(txt): err("Invalid / N/A"); h.pop(); return
        o["cont"]=txt.upper() if txt.lower()!="n/a" else "N/A"
        states[uid]="chain"
        bot.send_message(uid,"Blockchain:",reply_markup=nav())

    elif st=="chain":
        if not 2<=len(txt)<=15: err("2–15 chars"); h.pop(); return
        o["chain"]=txt.upper()
        states[uid]="budg"
        bot.send_message(uid,"Budget (USD):",reply_markup=nav())

    elif st=="budg":
        if not vb(txt): err("Valid number"); h.pop(); return
        o["budg"]=txt
        states[uid]="tg"
        bot.send_message(uid,"Telegram link:",reply_markup=nav())

    elif st=="tg":
        if not vt(txt): err("Invalid link"); h.pop(); return
        o["tg"]=txt
        ex = EXTRA.get(o["sk"],{}).get(o["tk"],[])
        if ex:
            o["ex"]=ex
            o["exi"]=0
            states[uid]="ex"
            bot.send_message(uid,ex[0]["p"],reply_markup=nav())
        else:
            states[uid]="conf"
            bot.send_message(uid,"Submit order?",reply_markup=yn("sub"))

    elif st=="ex":
        ex=o["ex"]
        i=o["exi"]
        f=ex[i]["f"]
        ok = vi(txt) if "days" in f or "count" in f else True
        if not ok: err("Invalid number"); h.pop(); return
        o[f]=txt
        if i+1<len(ex):
            o["exi"]+=1
            bot.send_message(uid,ex[i+1]["p"],reply_markup=nav())
        else:
            states[uid]="conf"
            bot.send_message(uid,"Submit order?",reply_markup=yn("sub"))

@bot.callback_query_handler(func=lambda c: c.data.startswith(("y_","n_")))
def cf(c):
    uid = c.from_user.id
    act = c.data[2:]
    if c.data.startswith("n_"):
        bot.edit_message_text("Cancelled", c.message.chat.id, c.message.message_id)
        return

    if act == "sub":
        bot.edit_message_text("Submitted.", c.message.chat.id, c.message.message_id)
        o = orders.get(uid,{})
        lines = [f"ORDER {uid} | {o.get('s')} – {o.get('t')} | ${o.get('p')}"]
        for k in ["proj","cont","chain","budg","tg"]:
            lines.append(f"{k.title()}: {o.get(k,'–')}")
        for k in o:
            if k not in ["sk","tk","s","t","p","d","h","ex","exi"]:
                lines.append(f"{k.title()}: {o[k]}")
        bot.send_message(ADMIN, "\n".join(lines))

        if o.get("p",0)>0:
            mk = types.InlineKeyboardMarkup(row_width=3)
            for k in PAY: mk.add(types.InlineKeyboardButton(k, callback_data=f"p_{k}"))
            bot.send_message(uid, f"Fee: **${o['p']}**\nSelect network:", parse_mode="Markdown", reply_markup=mk)
        else:
            bot.send_message(uid, "Custom order received. Team will contact you.")
            del states[uid]; del orders[uid]

    elif act == "tx":
        tx = orders[uid].get("tx","")
        bot.edit_message_text("TX submitted.", c.message.chat.id, c.message.message_id)
        bot.send_message(ADMIN, f"TX {uid}\n{o['s']} – {o['t']}\n${o['p']}\nTX: {tx}")

@bot.callback_query_handler(func=lambda c: c.data.startswith("p_"))
def pay(c):
    ch = c.data[2:]
    i = PAY[ch]
    p = orders[c.from_user.id]["p"]
    msg = f"Send **${p}**:\n\n{i['e']} **{i['n']}**\n`{i['a']}`\n\nReply with TX hash."
    bot.send_message(c.from_user.id, msg, parse_mode="Markdown", reply_markup=nav())
    states[c.from_user.id] = "tx"

@bot.message_handler(func=lambda m: states.get(m.from_user.id) == "tx")
def tx(m):
    uid = m.from_user.id
    tx = m.text.strip()
    orders[uid]["tx"] = tx
    bot.send_message(uid, f"Confirm TX?\n`{tx}`", parse_mode="Markdown", reply_markup=yn("tx"))

@bot.message_handler(func=lambda m: m.text == "Support")
def sup(m): bot.send_message(m.chat.id, "Contact admin directly.")

@bot.message_handler(func=lambda m: m.text == "Main Menu")
def mm(m): bot.send_message(m.chat.id, "Return to main menu?", reply_markup=yn("mm"))

@bot.callback_query_handler(func=lambda c: c.data == "y_mm")
def do_mm(c):
    uid = c.from_user.id
    del states[uid]; del orders[uid]
    bot.edit_message_text("Main menu.", c.message.chat.id, c.message.message_id)
    menu(c.message.chat.id)

print(f"{NAME} started")
bot.infinity_polling(timeout=20, long_polling_timeout=15)
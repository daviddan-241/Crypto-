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


# ✅ YOUR CONFIG (PRESERVED)
TOKEN    = "8710292892:AAG1OQvohkgou5saMxLWg1eeozXX9Wp5uLY"
ADMIN_ID = 8503340530
DISCORD  = "https://discord.com/api/webhooks/1490137623577235497/ZzzvUp5fDvWuMwlWB8SVYyNe5KP70S3V7kpi5nefBSXi3eDxSy4CFQOzkvDXPT_F9WsJ"
SITE_URL = "https://nomic-alpha-listing-private.vercel.app"
ALPHA    = "https://t.me/+QJVQUQIhP-82ZDk8"
SUPPORT  = "@crypto_guy02"

WALLETS = {
    "SOL": {"addr": "46ZKRuURaASKEcKBafnPZgMaTqBL8RK8TssZgZzFCBzn", "sym": "◎", "name": "Solana"},
    "ETH": {"addr": "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A", "sym": "⟠", "name": "Ethereum"},
    "BNB": {"addr": "bnb189gjjucwltdpnlemrveakf0q6xg0smfqdh6869", "sym": "🟡", "name": "BNB Chain"},
}

DEXSCREENER = "https://api.dexscreener.com/latest/dex"
COINGECKO   = "https://api.coingecko.com/api/v3"

bot = TeleBot(TOKEN, threaded=False)

states  = {}
orders  = {}

# ✅ SERVICES (UNCHANGED)
SERVICES = [
    ("🔥","premium_listing","Premium Listing",True),
    ("📈","dex_trending","DEX Trending Push",True),
    ("📣","shill_calls","Shill Calls",True),
    ("🤖","volume_bot","Volume Bot",True),
    ("👥","kol","KOL / Influencer",True),
    ("📊","promotion","Full Promotion",True),
    ("𝕏","twitter","X Campaign",True),
    ("😂","meme","Meme Campaign",True),
    ("🔗","dex_listing","DEX Listing Support",True),
    ("⚡","quick_pump","Quick Pump",True),
    ("🛠","dex_tools","DEX Tools & Analytics",False),
    ("🔑","alpha","Alpha Group Access",False),
]

# ✅ TIERS (UNCHANGED)
TIERS = {
    "premium_listing":[("Standard",150,"Instant listing"),("Featured",350,"Boost ⭐"),("Elite",799,"Full")],
    "dex_trending":[("Basic",99,"24h"),("Pro",299,"72h ⭐"),("Elite",799,"7d")],
    "shill_calls":[("Micro",149,"Small"),("Mid-Tier",399,"Medium ⭐"),("Premium",999,"Large")],
    "volume_bot":[("Starter",199,"24h"),("Growth",599,"72h ⭐"),("Premium",1499,"7d")],
    "kol":[("Micro",299,"Small"),("Mid-Tier",799,"Medium ⭐"),("Premium",1999,"Large")],
    "promotion":[("Basic",129,"Basic"),("Standard",349,"Multi ⭐"),("Premium",899,"Full")],
    "twitter":[("Basic",99,"Posts"),("Growth",299,"Daily ⭐"),("Viral",799,"Full")],
    "meme":[("Basic",79,"Quick"),("Viral",249,"Boost ⭐"),("Explosion",799,"Full")],
    "dex_listing":[("Basic",99,"Basic"),("Fast Track",249,"Priority ⭐"),("Full Service",599,"Full")],
    "quick_pump":[("Basic",199,"Short"),("Pro",599,"Boost ⭐"),("Elite",1499,"Aggressive")],
    "dex_tools":[("Basic",79,"Basic"),("Advanced",249,"Full ⭐"),("Pro",649,"API")],
    "alpha":[("Monthly",99,"30d"),("Quarterly",249,"90d ⭐"),("Lifetime",599,"Forever")]
}

# ✅ PRICE
def get_prices():
    try:
        r = requests.get(f"{COINGECKO}/simple/price",
            params={"ids":"solana,ethereum,binancecoin","vs_currencies":"usd"}, timeout=8)
        d = r.json()
        return {
            "SOL": d.get("solana",{}).get("usd",140),
            "ETH": d.get("ethereum",{}).get("usd",2500),
            "BNB": d.get("binancecoin",{}).get("usd",600),
        }
    except:
        return {"SOL":140,"ETH":2500,"BNB":600}

def to_crypto(usd, prices, cur):
    return round(usd / prices[cur], 4)

# ✅ FIXED DEX
def lookup(ca):
    try:
        headers={"User-Agent":"Mozilla/5.0"}
        for _ in range(2):
            r=requests.get(f"{DEXSCREENER}/tokens/{ca}",headers=headers,timeout=10)
            pairs=r.json().get("pairs",[])
            if pairs: break
            time.sleep(1)
        if not pairs: return None
        p=pairs[0]
        return {
            "name":p["baseToken"]["name"],
            "symbol":p["baseToken"]["symbol"],
            "price":p.get("priceUsd","0")
        }
    except:
        return None

# ✅ SEND SAFE
def send(cid,text,kb=None):
    try:
        bot.send_message(cid,text,reply_markup=kb,parse_mode="Markdown")
    except:
        bot.send_message(cid,text,reply_markup=kb)

# ✅ MAIN MENU
def main_menu(cid):
    kb=types.InlineKeyboardMarkup()
    kb.add(types.InlineKeyboardButton("📋 Services",callback_data="home_services"))
    kb.add(types.InlineKeyboardButton("🔑 Alpha",callback_data="home_alpha"))
    send(cid,"⚡ *Nomics Bot*\nSelect option:",kb)

# ✅ MIXED SERVICES UI
def services_menu(cid):
    kb=types.InlineKeyboardMarkup()
    btns=[types.InlineKeyboardButton(f"{e} {n}",callback_data=f"svc_{k}") for e,k,n,_ in SERVICES]

    for i in range(0,len(btns),5):
        row=btns[i:i+5]
        kb.row(*row[:3])
        if len(row)>3:
            kb.row(*row[3:])

    kb.add(types.InlineKeyboardButton("🔙 Main Menu",callback_data="home_back"))
    send(cid,"📋 Select Service:",kb)

# START
@bot.message_handler(commands=["start"])
def start(m):
    main_menu(m.chat.id)

# CALLBACK HOME
@bot.callback_query_handler(func=lambda c:c.data.startswith("home_"))
def home_cb(c):
    if c.data=="home_services":
        services_menu(c.message.chat.id)
    else:
        main_menu(c.message.chat.id)

# SERVICE CLICK
@bot.callback_query_handler(func=lambda c:c.data.startswith("svc_"))
def svc(c):
    uid=c.from_user.id
    key=c.data.replace("svc_","",1)

    orders[uid]={"svc_key":key}
    states[uid]="need_ca"

    send(c.message.chat.id,"Send contract address")

# HANDLE CA
@bot.message_handler(func=lambda m:states.get(m.from_user.id)=="need_ca")
def handle_ca(m):
    uid=m.from_user.id
    ca=m.text

    tk=lookup(ca)
    if not tk:
        send(m.chat.id,"⚠️ Token not found, continue anyway")

    orders[uid]["ca"]=ca
    states[uid]="choose_tier"

    tiers=TIERS[orders[uid]["svc_key"]]
    kb=types.InlineKeyboardMarkup()

    for t in tiers:
        kb.add(types.InlineKeyboardButton(t[0],callback_data=f"tier_{orders[uid]['svc_key']}_{t[0]}"))

    send(m.chat.id,"Choose tier:",kb)

# ✅ FIXED TIER
@bot.callback_query_handler(func=lambda c:c.data.startswith("tier_"))
def tier(c):
    uid=c.from_user.id

    data=c.data.replace("tier_","",1)
    svc_key,tier_name=data.split("_",1)

    tier=next((t for t in TIERS[svc_key] if t[0]==tier_name),None)
    if not tier:
        return send(c.message.chat.id,"⚠️ Tier not found.")

    orders[uid]["tier"]=tier_name
    states[uid]="choose_currency"

    kb=types.InlineKeyboardMarkup()
    kb.add(types.InlineKeyboardButton("◎ Pay SOL",callback_data="cur_SOL"))
    kb.add(types.InlineKeyboardButton("⟠ Pay ETH",callback_data="cur_ETH"))
    kb.add(types.InlineKeyboardButton("🟡 Pay BNB",callback_data="cur_BNB"))

    send(c.message.chat.id,f"Selected {tier_name}\nChoose payment:",kb)

# CURRENCY
@bot.callback_query_handler(func=lambda c:c.data.startswith("cur_"))
def cur(c):
    uid=c.from_user.id
    cur=c.data.split("_")[1]

    orders[uid]["currency"]=cur
    states[uid]="need_tx"

    send(c.message.chat.id,f"Send payment to:\n`{WALLETS[cur]['addr']}`\n\nThen send TX")

# TX
@bot.message_handler(func=lambda m:states.get(m.from_user.id)=="need_tx")
def tx(m):
    uid=m.from_user.id

    bot.send_message(ADMIN_ID,f"💰 TX from {uid}:\n{m.text}")

    states.pop(uid,None)
    send(m.chat.id,"✅ Payment submitted")

# RUN BOT
def run_bot():
    while True:
        try:
            bot.polling(none_stop=True)
        except:
            time.sleep(5)

if __name__=="__main__":
    threading.Thread(target=run_bot).start()
    app.run(host="0.0.0.0",port=8000)
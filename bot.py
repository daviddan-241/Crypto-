# =====================================================================
#  PF Raid Whales – Professional Web3 Marketing Telegram Bot
#  Complete version – February 2026 – lower entry + higher impact tiers
# =====================================================================

import os
import time
import threading
import re

from telebot import TeleBot, types
from flask import Flask

# ─── Flask (Render / hosting health check) ────────────────────────────
app = Flask(__name__)

@app.route('/')
def home():
    return f"PF Raid Whales – Active since {time.strftime('%Y-%m-%d %H:%M:%S UTC')}"

@app.route('/health')
def health():
    return {"status": "ok"}, 200

threading.Thread(
    target=lambda: app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 10000)),
        debug=False,
        use_reloader=False
    ),
    daemon=True
).start()

# ─── Bot Configuration ────────────────────────────────────────────────
TOKEN       = "8765151932:AAHUJ2WtV_Uc-GYW2b8uQARtfPyXwm2qIC0"
ADMIN_ID    = 8235324142
BOT_NAME    = "PF Raid Whales"
HEADER_IMG  = "https://i.ibb.co/bj0fnN56/IMG-1994.jpg"

PAYMENT_METHODS = {
    "BTC": {"addr": "bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw", "symbol": "₿",  "name": "Bitcoin"},
    "ETH": {"addr": "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A", "symbol": "⛓️", "name": "Ethereum"},
    "SOL": {"addr": "EaFeqxptPuo2jy3dA8dRsgRz8JRCPSK5mXT3qZZYT7f3", "symbol": "◎", "name": "Solana"}
}

bot = TeleBot(TOKEN)

user_states    = {}
active_orders  = {}
support_queue  = set()

# ─── Navigation Keyboards ─────────────────────────────────────────────

def nav():
    m = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    m.add("🔙 Back", "Main Menu 🔝")
    return m

def yesno(action):
    m = types.InlineKeyboardMarkup(row_width=2)
    m.add(
        types.InlineKeyboardButton("✔️ Confirm", callback_data=f"y_{action}"),
        types.InlineKeyboardButton("✖️ Cancel",  callback_data=f"n_{action}")
    )
    return m

# ─── Main Menu ────────────────────────────────────────────────────────

def main_menu(cid):
    txt = (
        f"**{BOT_NAME}**\n\n"
        "Web3 • Crypto • Memecoin Marketing & Growth\n\n"
        "Services include:\n"
        "• Raiding & community activation\n"
        "• KOL, callers, trending packages\n"
        "• Volume strategies & quick momentum\n"
        "• Token verification & DEX support\n\n"
        "Every project starts with your details → custom plan & quote.\n\n"
        "Select an option to continue."
    )
    mk = types.ReplyKeyboardMarkup(resize_keyboard=True, row_width=2)
    mk.add("📋 Services", "🛎️ Support")
    bot.send_photo(cid, HEADER_IMG, caption=txt, parse_mode="Markdown", reply_markup=mk)

# ─── All Services (17 total – adjusted prices + 3 new profit-oriented) ─

SERVICES = {
    "token_marketing": {
        "emoji": "🚀",
        "name": "Token Marketing Campaign",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  35, "d": "48-hour basic social exposure"},
            "core":    {"n": "Core",    "p": 140, "d": "Telegram + X + small caller push"},
            "growth":  {"n": "Growth",  "p": 420, "d": "Mid-tier KOLs + trending support"},
            "premium": {"n": "Premium", "p": 1250, "d": "High-tier influencers + volume assist"}
        }
    },
    "raiding": {
        "emoji": "⚡",
        "name": "Raiding Service",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  30, "d": "24-hour focused raid"},
            "core":    {"n": "Core",    "p": 110, "d": "48–72 hour TG/Discord activation"},
            "growth":  {"n": "Growth",  "p": 380, "d": "5–7 days structured raiding"},
            "premium": {"n": "Premium", "p": 1450, "d": "10+ day high-velocity operation"}
        }
    },
    "calls": {
        "emoji": "📣",
        "name": "Shill Calls Promotion",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  25, "d": "3–5 micro caller groups"},
            "core":    {"n": "Core",    "p":  90, "d": "8–12 coordinated calls"},
            "growth":  {"n": "Growth",  "p": 280, "d": "Mid-tier caller network"},
            "premium": {"n": "Premium", "p": 1050, "d": "Large premium callers – strong impulse"}
        }
    },
    "dex_trend": {
        "emoji": "📈",
        "name": "DEX Trending Push",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  45, "d": "Basic visibility bump"},
            "core":    {"n": "Core",    "p": 160, "d": "Raydium / Jupiter focused push"},
            "growth":  {"n": "Growth",  "p": 520, "d": "Multi-DEX trending campaign"},
            "premium": {"n": "Premium", "p": 1950, "d": "Sustained trend + volume acceleration"}
        }
    },
    "kol": {
        "emoji": "👥",
        "name": "KOL / Influencer Outreach",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  80, "d": "3–4 micro influencers"},
            "core":    {"n": "Core",    "p": 250, "d": "6–9 quality mid-tier KOLs"},
            "growth":  {"n": "Growth",  "p": 720, "d": "12–18 established influencers"},
            "premium": {"n": "Premium", "p": 1950, "d": "20+ high-tier KOL partnerships"}
        }
    },
    "nft": {
        "emoji": "🖼️",
        "name": "NFT Promotion & Launch",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  40, "d": "Basic NFT shilling"},
            "core":    {"n": "Core",    "p": 130, "d": "Pre-launch teasers + promo"},
            "growth":  {"n": "Growth",  "p": 380, "d": "Mint phase hype + rewards"},
            "premium": {"n": "Premium", "p": 1050, "d": "Complete NFT launch campaign"}
        }
    },
    "meme": {
        "emoji": "😂",
        "name": "Meme Coin Promotion",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  25, "d": "Quick meme visibility"},
            "core":    {"n": "Core",    "p":  95, "d": "Listing + social momentum"},
            "growth":  {"n": "Growth",  "p": 320, "d": "Viral narrative support"},
            "premium": {"n": "Premium", "p":  880, "d": "High-intensity meme campaign"}
        }
    },
    "verify": {
        "emoji": "✅",
        "name": "Token Verification & Blue Check",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  20, "d": "Basic verification push"},
            "core":    {"n": "Core",    "p":  70, "d": "Standard blue-check support"},
            "growth":  {"n": "Growth",  "p": 190, "d": "Advanced verification + listings"},
            "premium": {"n": "Premium", "p":  520, "d": "Priority verification + audit help"}
        }
    },
    "pump": {
        "emoji": "💹",
        "name": "Volume & Pump Strategy",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  65, "d": "Light volume coordination"},
            "core":    {"n": "Core",    "p": 220, "d": "Moderate directional volume"},
            "growth":  {"n": "Growth",  "p": 680, "d": "Strong structured volume push"},
            "premium": {"n": "Premium", "p": 2450, "d": "Professional sustained pump – max impact"}
        }
    },
    "dex_list": {
        "emoji": "🔗",
        "name": "DEX Listing Support",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  40, "d": "Basic listing assistance"},
            "core":    {"n": "Core",    "p": 140, "d": "Standard DEX listing support"},
            "growth":  {"n": "Growth",  "p": 380, "d": "Fast-track + initial promotion"},
            "premium": {"n": "Premium", "p":  980, "d": "Priority DEX integration"}
        }
    },
    "birdeye": {
        "emoji": "🦅",
        "name": "Birdeye Listing & Boost",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  30, "d": "Basic Birdeye visibility"},
            "core":    {"n": "Core",    "p": 100, "d": "Fast Birdeye indexing"},
            "growth":  {"n": "Growth",  "p": 300, "d": "Advanced Birdeye features"},
            "premium": {"n": "Premium", "p":  780, "d": "Complete Birdeye optimization"}
        }
    },
    "twitter": {
        "emoji": "🐦",
        "name": "X (Twitter) Campaign",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  45, "d": "Basic X posts & presence"},
            "core":    {"n": "Core",    "p": 160, "d": "Structured X campaign"},
            "growth":  {"n": "Growth",  "p": 480, "d": "High-engagement X push"},
            "premium": {"n": "Premium", "p": 1250, "d": "Viral X strategy + amplification"}
        }
    },
    "volume_bot": {
        "emoji": "🤖",
        "name": "Volume Bot Infrastructure",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  90, "d": "Basic volume generation setup"},
            "core":    {"n": "Core",    "p": 320, "d": "Short-term managed rotation"},
            "growth":  {"n": "Growth",  "p": 950, "d": "Advanced volume distribution"},
            "premium": {"n": "Premium", "p": 2850, "d": "Custom low-detection volume system"}
        }
    },
    "rev_share": {
        "emoji": "🤝",
        "name": "Revenue Share Partnership",
        "tiers": {
            "custom": {"n": "Custom", "p":    0, "d": "Performance-based long-term deal"}
        }
    },
    # ─── NEW SERVICES (short-term price / attention focused) ───────────
    "quick_pump": {
        "emoji": "⚡💰",
        "name": "Quick Pump Coordination",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  80, "d": "24–48h call + volume burst"},
            "core":    {"n": "Core",    "p": 280, "d": "Calls + volume + TG raid combo"},
            "growth":  {"n": "Growth",  "p": 850, "d": "Aggressive 72h momentum package"},
            "premium": {"n": "Premium", "p": 2650, "d": "High-intensity short-term pump"}
        }
    },
    "x_momentum": {
        "emoji": "🐦🚀",
        "name": "X Momentum Booster",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  55, "d": "Fast X visibility burst"},
            "core":    {"n": "Core",    "p": 190, "d": "Hype cycle + structured posts"},
            "growth":  {"n": "Growth",  "p": 580, "d": "High-engagement + paid reach"},
            "premium": {"n": "Premium", "p": 1680, "d": "Viral X wave – rapid attention"}
        }
    },
    "buy_pressure": {
        "emoji": "📈🛒",
        "name": "Buy Pressure + Holder Growth",
        "tiers": {
            "entry":   {"n": "Entry",   "p":  70, "d": "Basic buy sim + incentives"},
            "core":    {"n": "Core",    "p": 240, "d": "Moderate pressure + rewards"},
            "growth":  {"n": "Growth",  "p": 720, "d": "Strong buy simulation + mechanics"},
            "premium": {"n": "Premium", "p": 2250, "d": "Advanced pressure + holder focus"}
        }
    }
}

# ─── Start & Main Menu Handlers ───────────────────────────────────────

@bot.message_handler(commands=['start'])
def cmd_start(message):
    main_menu(message.chat.id)

@bot.message_handler(func=lambda m: m.text in ["Main Menu 🔝", "Main Menu"])
def return_main(message):
    main_menu(message.chat.id)

@bot.message_handler(func=lambda m: m.text in ["🔙 Back", "Back"])
def handle_back(message):
    main_menu(message.chat.id)
    uid = message.from_user.id
    user_states.pop(uid, None)
    active_orders.pop(uid, None)

# ─── Services Menu ────────────────────────────────────────────────────

@bot.message_handler(func=lambda m: m.text == "📋 Services")
def show_service_list(message):
    markup = types.InlineKeyboardMarkup(row_width=2)
    for key, serv in SERVICES.items():
        markup.add(types.InlineKeyboardButton(
            f"{serv['emoji']} {serv['name']}",
            callback_data=f"cat_{key}"
        ))
    bot.send_message(message.chat.id, "Select service category:", reply_markup=markup)

@bot.callback_query_handler(func=lambda call: call.data.startswith("cat_"))
def show_tiers(call):
    cat_key = call.data[4:]
    category = SERVICES.get(cat_key)
    if not category:
        return bot.answer_callback_query(call.id, "Category not found.", show_alert=True)

    markup = types.InlineKeyboardMarkup(row_width=1)
    for tier_key, tier in category["tiers"].items():
        price_str = "Custom" if tier["p"] == 0 else f"${tier['p']:,}"
        markup.add(types.InlineKeyboardButton(
            f"{tier['n']}  —  {price_str}\n{tier['d']}",
            callback_data=f"tier_{cat_key}_{tier_key}"
        ))

    bot.edit_message_text(
        f"{category['emoji']} {category['name']}\n\nChoose package:",
        call.message.chat.id,
        call.message.message_id,
        reply_markup=markup
    )

# ─── Order Creation ───────────────────────────────────────────────────

@bot.callback_query_handler(func=lambda call: call.data.startswith("tier_"))
def start_order_form(call):
    _, cat_key, tier_key = call.data.split("_")
    cat = SERVICES[cat_key]
    tier = cat["tiers"][tier_key]

    uid = call.from_user.id
    active_orders[uid] = {
        "cat_key": cat_key,
        "tier_key": tier_key,
        "service": cat["name"],
        "tier_name": tier["n"],
        "price": tier["p"],
        "desc": tier["d"],
        "fields": {}
    }
    user_states[uid] = "project_name"

    bot.send_message(
        uid,
        f"Selected: **{cat['emoji']} {cat['name']} – {tier['n']}**\n"
        f"{tier['d']}\n\n"
        "Project / token name:",
        parse_mode="Markdown",
        reply_markup=nav()
    )

# ─── Form Steps ───────────────────────────────────────────────────────

@bot.message_handler(func=lambda m: m.from_user.id in user_states)
def form_handler(m):
    uid = m.from_user.id
    text = m.text.strip()
    state = user_states.get(uid)

    if text in ["🔙 Back", "Back", "Main Menu 🔝", "Main Menu"]:
        main_menu(uid)
        user_states.pop(uid, None)
        active_orders.pop(uid, None)
        return

    order = active_orders.get(uid)
    if not order:
        return main_menu(uid)

    def err(msg):
        bot.send_message(uid, msg, reply_markup=nav())

    if state == "project_name":
        if not 3 <= len(text) <= 80:
            return err("Project name should be 3–80 characters.")
        order["fields"]["project"] = text
        user_states[uid] = "contract_addr"
        bot.send_message(uid, "Token / contract address (or N/A):", reply_markup=nav())

    elif state == "contract_addr":
        t = text.strip().upper()
        if t in ["", "N/A"]:
            order["fields"]["contract"] = "N/A"
        elif re.match(r'^0x[a-fA-F0-9]{40}$', t) or re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$', t):
            order["fields"]["contract"] = t
        else:
            return err("Invalid address. Use N/A if not launched yet.")
        user_states[uid] = "blockchain"
        bot.send_message(uid, "Blockchain (SOL, ETH, BSC, BASE…):", reply_markup=nav())

    elif state == "blockchain":
        if not 2 <= len(text) <= 15:
            return err("Blockchain name 2–15 characters.")
        order["fields"]["chain"] = text.upper()
        user_states[uid] = "budget"
        bot.send_message(uid, "Marketing budget (USD):", reply_markup=nav())

    elif state == "budget":
        try:
            val = float(text.replace(",", "").replace("$", ""))
            if val <= 0:
                raise ValueError
            order["fields"]["budget"] = f"${val:,.0f}"
        except:
            return err("Enter valid positive number.")
        user_states[uid] = "telegram_link"
        bot.send_message(uid, "Telegram group/channel (@ or https://t.me/...):", reply_markup=nav())

    elif state == "telegram_link":
        t = text.strip()
        if t.lower().startswith(("https://t.me/", "t.me/", "@")):
            order["fields"]["telegram"] = t
            show_summary(uid)
        else:
            err("Telegram link must start with @ or https://t.me/")

# ─── Order Summary & Confirmation ─────────────────────────────────────

def show_summary(uid):
    o = active_orders.get(uid)
    if not o:
        return

    lines = [
        "┌──────────────────────────────────────┐",
        "          Order Summary               ",
        "└──────────────────────────────────────┘",
        f"Service   : {o['service']} – {o['tier_name']}",
        f"Desc      : {o['desc']}",
        f"Price     : {'Custom' if o['price']==0 else f'${o['price']:,}'}",
        "────────────────────────────────────────",
        f"Project   : {o['fields'].get('project', '–')}",
        f"Contract  : {o['fields'].get('contract', '–')}",
        f"Chain     : {o['fields'].get('chain', '–')}",
        f"Budget    : {o['fields'].get('budget', '–')}",
        f"Telegram  : {o['fields'].get('telegram', '–')}",
        "────────────────────────────────────────",
        "Is this correct?"
    ]

    bot.send_message(
        uid,
        "\n".join(lines),
        reply_markup=yesno("submit")
    )
    user_states[uid] = "confirm"

@bot.callback_query_handler(func=lambda c: c.data in ["y_submit", "n_submit"])
def confirm_order(c):
    uid = c.from_user.id

    if c.data == "n_submit":
        bot.edit_message_text("Cancelled.", c.message.chat.id, c.message.message_id)
        user_states.pop(uid, None)
        active_orders.pop(uid, None)
        return main_menu(uid)

    o = active_orders.get(uid)
    if not o:
        return

    admin_text = [
        f"NEW ORDER  •  {uid}  •  {time.strftime('%Y-%m-%d %H:%M')}",
        f"Service   : {o['service']} – {o['tier_name']}",
        f"Price     : {'Custom' if o['price']==0 else f'${o['price']:,}'}",
        "───────────────────────────────────────",
        f"Project   : {o['fields'].get('project')}",
        f"Contract  : {o['fields'].get('contract')}",
        f"Chain     : {o['fields'].get('chain')}",
        f"Budget    : {o['fields'].get('budget')}",
        f"Telegram  : {o['fields'].get('telegram')}",
    ]

    bot.send_message(ADMIN_ID, "\n".join(admin_text))

    if o["price"] > 0:
        mk = types.InlineKeyboardMarkup(row_width=3)
        for k in PAYMENT_METHODS:
            mk.add(types.InlineKeyboardButton(k, callback_data=f"pay_{k}"))

        bot.edit_message_text(
            "Order received.\nPlease complete payment to begin.",
            c.message.chat.id, c.message.message_id
        )

        bot.send_message(
            uid,
            f"Amount due: **${o['price']:,}**\n\nSelect payment network:",
            parse_mode="Markdown",
            reply_markup=mk
        )
        user_states[uid] = "choose_payment"
    else:
        bot.edit_message_text(
            "Custom proposal submitted.\nTeam will contact you soon.",
            c.message.chat.id, c.message.message_id
        )
        user_states.pop(uid, None)
        active_orders.pop(uid, None)

# ─── Payment Flow ─────────────────────────────────────────────────────

@bot.callback_query_handler(func=lambda c: c.data.startswith("pay_"))
def payment_screen(c):
    uid = c.from_user.id
    net = c.data[4:]

    if uid not in active_orders or net not in PAYMENT_METHODS:
        bot.answer_callback_query(c.id, "Session expired.", show_alert=True)
        return main_menu(uid)

    o = active_orders[uid]
    pay = PAYMENT_METHODS[net]

    msg = (
        "💳 **Payment Details**\n\n"
        f"Amount: **${o['price']:,}**\n"
        f"Network: **{pay['name']}**\n\n"
        "Send **exactly** this amount to:\n\n"
        f"```
{pay['symbol']} {pay['name']}
{pay['addr']}
```\n\n"
        "• Double-check address\n"
        "• No tag/memo needed\n"
        "• Reply here with TX hash after sending\n"
        "• Verification: 10–60 min usually\n\n"
        "Reply with transaction hash:"
    )

    bot.send_message(uid, msg, parse_mode="Markdown", reply_markup=nav())
    user_states[uid] = "tx_hash"
    o["payment_net"] = net

[@bot](https://x.com/bot).message_handler(func=lambda m: user_states.get([m.from_user.id](http://m.from_user.id)) == "tx_hash")
def tx_input(m):
    uid = [m.from_user.id](http://m.from_user.id)
    tx = m.text.strip()

    if len(tx) < 20:
        return bot.send_message(uid, "TX hash too short. Send full hash.", reply_markup=nav())

    active_orders[uid]["tx"] = tx

    mk = types.InlineKeyboardMarkup(row_width=2)
    mk.add(
        types.InlineKeyboardButton("✔️ Correct", callback_data="y_tx"),
        types.InlineKeyboardButton("✖️ Edit",    callback_data="n_tx")
    )

    preview = (
        "Payment Confirmation\n\n"
        f"Amount   : **${active_orders[uid]['price']:,}**\n"
        f"Network  : **{PAYMENT_METHODS[active_orders[uid]['payment_net']]['name']}**\n"
        f"TX       : `{tx}`\n\n"
        "Is the TX hash correct?"
    )

    bot.send_message(uid, preview, parse_mode="Markdown", reply_markup=mk)
    user_states[uid] = "tx_confirm"

[@bot](https://x.com/bot).callback_query_handler(func=lambda c: c.data in ["y_tx", "n_tx"])
def tx_final(c):
    uid = [c.from_user.id](http://c.from_user.id)

    if c.data == "n_tx":
        bot.edit_message_text("Send correct TX hash.", [c.message.chat.id](http://c.message.chat.id), c.message.message_id, reply_markup=nav())
        user_states[uid] = "tx_hash"
        return

    o = active_orders.get(uid)
    admin_msg = (
        f"💰 PAYMENT SUBMITTED\n"
        f"User: {uid}\n"
        f"Service: {o['service']} – {o['tier_name']}\n"
        f"Amount: ${o['price']:,}\n"
        f"Network: {o['payment_net']}\n"
        f"TX: `{o.get('tx')}`\n"
        f"Project: {o['fields'].get('project')}"
    )
    bot.send_message(ADMIN_ID, admin_msg, parse_mode="Markdown")

    bot.edit_message_text(
        "Payment submitted.\nVerification in progress (10–60 min).\nYou will be notified when confirmed.\nThank you!",
        [c.message.chat.id](http://c.message.chat.id), c.message.message_id
    )

    user_states.pop(uid, None)
    # active_orders.pop(uid, None)   # keep for logs if desired

# ─── Support ──────────────────────────────────────────────────────────

[@bot](https://x.com/bot).message_handler(func=lambda m: m.text == "🛎️ Support")
def support_entry(m):
    uid = [m.from_user.id](http://m.from_user.id)
    support_queue.add(uid)
    bot.send_message(
        uid,
        "Type your message / question now.\nIt will be sent to the team.",
        reply_markup=nav()
    )

[@bot](https://x.com/bot).message_handler(func=lambda m: [m.from_user.id](http://m.from_user.id) in support_queue)
def forward_support(m):
    uid = [m.from_user.id](http://m.from_user.id)
    msg = m.text.strip()
    bot.send_message(ADMIN_ID, f"SUPPORT from {uid}:\n\n{msg}")
    bot.send_message(uid, "Message sent. Team will reply soon.")
    support_queue.discard(uid)
    main_menu(uid)

# ─── Bot Start ────────────────────────────────────────────────────────

print(f"{BOT_NAME} started – {time.ctime()}")
bot.infinity_polling(timeout=20, long_polling_timeout=15)
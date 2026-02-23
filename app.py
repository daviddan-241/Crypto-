import os
import sys
import time
import threading
import requests
from io import BytesIO
import qrcode
from filelock import FileLock
import telebot
from telebot import types
from flask import Flask, render_template_string, send_file
import atexit

# ────────────────────────────────────────────────
#  CONFIGURATION & CONSTANTS
# ────────────────────────────────────────────────
BOT_NAME       = "PF Raiders"
TG_TOKEN       = "8765151932:AAHUJ2WtV_Uc-GYW2b8uQARtfPyXwm2qIC0"
ADMIN_TG_ID    = 8297034218

ETHERSCAN_KEY  = "3JKC13MTMR6JFQUKYMYH7NQVFKQHKSXTYB"
SOLSCAN_JWT    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NjY5MjYzNzk1OTAsImVtYWlsIjoib3ZvdXJjcm9zc0BnbWFpbC5jb20iLCJhY3Rpb24iOiJ0b2tlbi1hcGkiLCJhcGlWZXJzaW9uIjoidjIiLCJpYXQiOjE3NjY5MjYzNzl9.mCGX77xarC4ojdis92AVpi4iR1kBWRFXNbqHY2leagI"

PAY_ADDRESSES = {
    "BTC": "bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw",
    "SOL": "EaFeqxptPuo2jy3dA8dRsgRz8JRCPSK5mXT3qZZYT7f3",
    "ETH": "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A"
}

# ────────────────────────────────────────────────
# SERVICES – Clean, mature descriptions + emojis + image placeholders
# ────────────────────────────────────────────────
SERVICES = {
    # Entry-level (quick buys)
    "pf_name_gen": {
        "name": "Pump.fun Name & Ticker Generator",
        "price": 9,
        "desc": "50 curated, high-conviction names and tickers ready for immediate use",
        "emoji": "✨",
        "image": "https://i.imgur.com/example-name-gen.png"  # ← replace with real URL
    },
    "raid_messages": {
        "name": "Raid & Shill Message Library",
        "price": 19,
        "desc": "150+ professionally crafted messages optimized for maximum engagement",
        "emoji": "📢",
        "image": "https://i.imgur.com/example-raid-msg.png"
    },
    "fake_chart_pack": {
        "name": "Premium Pump Chart Templates",
        "price": 29,
        "desc": "8 high-resolution, editable screenshots of convincing volume spikes",
        "emoji": "📈",
        "image": "https://i.imgur.com/example-chart-pack.png"
    },
    "testimonial_set": {
        "name": "Elite Testimonial Collection",
        "price": 39,
        "desc": "20 authentic-looking reviews with matching professional avatars",
        "emoji": "🗣️",
        "image": "https://i.imgur.com/example-testimonials.png"
    },
    "badge_template": {
        "name": "Dex Paid Badge Template",
        "price": 49,
        "desc": "High-quality PSD file to simulate verified/paid DexTools badge",
        "emoji": "🏅",
        "image": "https://i.imgur.com/example-badge.png"
    },

    # Mid-tier professional tools
    "pf_launch_guide": {
        "name": "Pump.fun Launch Mastery Guide",
        "price": 79,
        "desc": "Comprehensive 2026 strategy playbook with image & timing optimization",
        "emoji": "📘",
        "image": "https://i.imgur.com/example-launch-guide.png"
    },
    "meme_concept": {
        "name": "Premium Meme Concept Package",
        "price": 149,
        "desc": "20 refined, market-ready concepts including visual direction",
        "emoji": "🖼️",
        "image": "https://i.imgur.com/example-meme-concept.png"
    },
    "token_template": {
        "name": "Production-Grade Token Contract",
        "price": 199,
        "desc": "Secure SPL / ERC-20 template with deployment documentation",
        "emoji": "🔗",
        "image": "https://i.imgur.com/example-token-code.png"
    },
    "dexscreener_guide": {
        "name": "DexScreener Trending Playbook",
        "price": 299,
        "desc": "Proven step-by-step tactics to achieve top rankings",
        "emoji": "🔥",
        "image": "https://i.imgur.com/example-dex-guide.png"
    },
    "kol_network": {
        "name": "Curated KOL & Influencer Directory",
        "price": 499,
        "desc": "150+ vetted contacts with pricing and outreach templates",
        "emoji": "🌐",
        "image": "https://i.imgur.com/example-kol-db.png"
    },
    "volume_boost": {
        "name": "Controlled Volume Strategy Pack",
        "price": 799,
        "desc": "Framework for building legitimate-looking volume safely",
        "emoji": "📊",
        "image": "https://i.imgur.com/example-volume-pack.png"
    },
    "custom_sniper": {
        "name": "Personalized Sniper Configuration",
        "price": 999,
        "desc": "Tailored sniper setup optimized for your target pairs",
        "emoji": "🎯",
        "image": "https://i.imgur.com/example-sniper.png"
    },

    # High-ticket premium services
    "dfy_launch": {
        "name": "Done-For-You Pump.fun Launch",
        "price": 2999,
        "desc": "Complete execution — token creation to post-launch promotion",
        "emoji": "🚀",
        "image": "https://i.imgur.com/example-dfy-launch.png"
    },
    "top_3_push": {
        "name": "Guaranteed Top 3 Trending Push",
        "price": 4999,
        "desc": "Coordinated strategy aiming for top 3 — partial refund if unmet",
        "emoji": "🏆",
        "image": "https://i.imgur.com/example-top3-push.png"
    },
    "elite_alpha_access": {
        "name": "Lifetime Elite Alpha Group Access",
        "price": 3999,
        "desc": "Permanent VIP entry + founder-level privileges in private group",
        "emoji": "🔒",
        "image": "https://i.imgur.com/example-alpha-group.png"
    },
    "mega_raid": {
        "name": "Mega Raid Coordination (2,000+ wallets)",
        "price": 5999,
        "desc": "Large-scale, synchronized activation for maximum impact",
        "emoji": "⚡",
        "image": "https://i.imgur.com/example-mega-raid.png"
    },
    "full_project_director": {
        "name": "Personal Project Director",
        "price": 6999,
        "desc": "End-to-end oversight from concept to sustained performance",
        "emoji": "👑",
        "image": "https://i.imgur.com/example-director.png"
    },
}

DELIVERY_CONTENT = {
    "pf_name_gen": "Your curated 50 PF-ready names & tickers delivered.\nExample:\n1. PumpLord → $PUMP\n2. SolChad → $SCHAD\n... (full list)",
    "raid_messages": "Raid & shill message pack delivered – 150+ optimized copies ready.",
    "dfy_launch": "Done-for-you launch slot confirmed.\nPlease DM @Bryanlucas90 immediately with project name, vision, and any preferences.",
    "top_3_push": "Top 3 trending push reserved.\nStrict terms apply — DM @Bryanlucas90 to initiate coordination.",
    # Add real links / files for others
}

pending_orders = {}
pending_wallets = {}

flask_app = Flask(__name__)
PORT = int(os.environ.get('PORT', 10000))
start_time = time.time()

# ────────────────────────────────────────────────
# HELPERS – Price & Verification
# ────────────────────────────────────────────────
def get_crypto_price(chain):
    ids = {"BTC": "bitcoin", "SOL": "solana", "ETH": "ethereum"}
    try:
        r = requests.get(f"https://api.coingecko.com/api/v3/simple/price?ids={ids[chain]}&vs_currencies=usd")
        return r.json()[ids[chain]]["usd"]
    except:
        return 0

def verify_transaction(chain, tx_hash, expected_addr, min_usd):
    price = get_crypto_price(chain)
    if price == 0:
        return False, "Price fetch failed"

    if chain == "ETH":
        url = f"https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash={tx_hash}&apikey={ETHERSCAN_API_KEY}"
        r = requests.get(url).json()
        result = r.get("result")
        if not result:
            return False, "Transaction not found"
        if result["to"].lower() != expected_addr.lower():
            return False, "Wrong recipient"
        value = int(result["value"], 16) / 1e18
        if value * price < min_usd:
            return False, f"Amount too low (${value * price:.2f})"
        return True, f"Verified (${value * price:.2f})"

    if chain == "SOL":
        headers = {"Authorization": f"Bearer {SOLSCAN_JWT}"}
        r = requests.get(f"https://pro-api.solscan.io/v2.0/transaction/detail?tx={tx_hash}", headers=headers)
        if r.status_code != 200 or r.json().get("data", {}).get("status") != "Success":
            return False, "Invalid or failed tx"
        return True, "SOL transaction confirmed"

    if chain == "BTC":
        r = requests.get(f"https://blockchain.info/rawtx/{tx_hash}?cors=true").json()
        if "error" in r:
            return False, "Transaction not found"
        for out in r.get("out", []):
            if out.get("addr") == expected_addr and out["value"] / 1e8 * price >= min_usd:
                return True, "BTC transaction confirmed"
        return False, "No matching transfer"

    return False, "Unsupported chain"

# ────────────────────────────────────────────────
# FLASK WEBSITE – PF Raiders Theme
# ────────────────────────────────────────────────
@flask_app.route('/')
def home():
    uptime = time.strftime('%H:%M:%S', time.gmtime(time.time() - start_time))
    html = '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>PF Raiders – Precision Execution</title>
        <style>
            body { background:#0a0e1a; color:#d0f0ff; font-family:monospace; margin:0; padding:30px; text-align:center; }
            h1 { color:#ffeb3b; font-size:3.2em; margin-bottom:10px; }
            .intro { color:#90a4ae; max-width:900px; margin:0 auto 50px; font-size:1.15em; line-height:1.7; }
            .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:30px; max-width:1500px; margin:auto; }
            .card { background:#111827; border:1px solid #374151; border-radius:12px; padding:30px; transition:0.3s; }
            .card:hover { transform:translateY(-8px); border-color:#60a5fa; box-shadow:0 10px 25px rgba(96,165,250,0.15); }
            .price { font-size:1.9em; color:#ffeb3b; font-weight:bold; margin:20px 0; }
            button { background:#60a5fa; color:#000; border:none; padding:16px 36px; font-size:1.15em; cursor:pointer; border-radius:8px; font-weight:bold; }
            #modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); align-items:center; justify-content:center; }
            .modal-box { background:#111827; padding:40px; border-radius:14px; width:92%; max-width:620px; border:1px solid #4b5563; }
            .service-img { width:100%; height:140px; object-fit:cover; border-radius:8px; margin-bottom:15px; }
        </style>
    </head>
    <body>
        <h1>PF Raiders</h1>
        <div class="intro">
            Precision infrastructure and strategic execution for serious pump.fun operators.<br>
            From foundational tools to full-cycle dominance — built for discretion and results.
        </div>

        <div class="grid">
            {% for k, s in services.items() %}
            <div class="card">
                <img src="{{ s.image }}" class="service-img" alt="{{ s.name }}">
                <h3>{{ s.emoji }} {{ s.name }}</h3>
                <p>{{ s.desc }}</p>
                <div class="price">${{ s.price }}</div>
                <button onclick="showPay('{{ k }}', '{{ s.name }}', {{ s.price }})">Secure Access</button>
            </div>
            {% endfor %}
        </div>

        <br><br><br>
        <button onclick="alert('Use /wallet <address> in Telegram (optional)')">Connect Wallet (Optional)</button>

        <div id="modal">
            <div class="modal-box">
                <h2 id="m-title"></h2>
                <p><strong>Investment:</strong> $<span id="m-price"></span></p>
                <select id="chain-select" onchange="updQR()">
                    <option>BTC</option><option>SOL</option><option>ETH</option>
                </select>
                <p><strong>Address:</strong> <span id="addr-show"></span></p>
                <img id="qr-img" src="" style="width:280px; margin:25px auto; display:block; border:1px solid #4b5563;">
                <p style="color:#90a4ae; font-size:0.98em;">
                    Transfer exact amount → reply with transaction hash in Telegram for verification.
                </p>
                <button onclick="document.getElementById('modal').style.display='none'" style="background:#374151;color:#fff;">Close</button>
            </div>
        </div>

        <script>
        function showPay(k, n, p) {
            document.getElementById('m-title').innerText = n;
            document.getElementById('m-price').innerText = p;
            document.getElementById('modal').style.display = 'flex';
            updQR();
        }
        function updQR() {
            let c = document.getElementById('chain-select').value;
            let a = {{ addrs | tojson }}[c];
            document.getElementById('addr-show').innerText = a;
            document.getElementById('qr-img').src = `/qr?chain=${c}`;
        }
        </script>
    </body>
    </html>
    '''
    return render_template_string(html, uptime=uptime, services=SERVICES, addrs=PAY_ADDRESSES)

@flask_app.route('/qr')
def qr():
    c = request.args.get('chain', 'BTC')
    addr = PAY_ADDRESSES.get(c, PAY_ADDRESSES['BTC'])
    qr_img = qrcode.make(addr)
    buf = BytesIO()
    qr_img.save(buf, 'PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

@flask_app.route('/health')
def health():
    return "OK", 200

def run_flask():
    flask_app.run(host='0.0.0.0', port=PORT, debug=False, use_reloader=False)

# ────────────────────────────────────────────────
# TELEGRAM BOT – PF Raiders
# ────────────────────────────────────────────────
tg_bot = telebot.TeleBot(TG_TOKEN)

@tg_bot.message_handler(commands=['start'])
def start(message):
    welcome = (
        f"Welcome to {BOT_NAME}.\n\n"
        "A private suite built for serious pump.fun operators and high-conviction builders.\n\n"
        "Infrastructure, strategy, and execution — delivered with precision and discretion.\n\n"
        "Access the available solutions below."
    )

    markup = types.ReplyKeyboardMarkup(resize_keyboard=True)
    markup.add(types.KeyboardButton("Connect Wallet (Optional)"))
    tg_bot.send_message(message.chat.id, welcome, reply_markup=markup)

    show_services(message)

def show_services(message):
    markup = types.InlineKeyboardMarkup(row_width=1)
    for key, svc in SERVICES.items():
        btn_text = f"{svc['emoji']} {svc['name']}"
        markup.add(types.InlineKeyboardButton(btn_text, callback_data=f"buy_{key}"))
    tg_bot.send_message(
        message.chat.id,
        "Available Solutions:",
        reply_markup=markup
    )

@tg_bot.callback_query_handler(func=lambda call: call.data.startswith('buy_'))
def buy_callback(call):
    key = call.data[4:]
    if key not in SERVICES:
        tg_bot.answer_callback_query(call.id, "Service not found")
        return
    svc = SERVICES[key]
    markup = types.InlineKeyboardMarkup(row_width=3)
    for ch in PAY_ADDRESSES:
        markup.add(types.InlineKeyboardButton(ch, callback_data=f"pay_{key}_{ch}"))
    tg_bot.edit_message_text(
        f"{svc['emoji']} **{svc['name']}**\n\n{svc['desc']}\n\nChoose payment network:",
        call.message.chat.id,
        call.message.message_id,
        parse_mode='Markdown',
        reply_markup=markup
    )

@tg_bot.callback_query_handler(func=lambda call: call.data.startswith('pay_'))
def pay_callback(call):
    _, key, chain = call.data.split('_')
    svc = SERVICES[key]
    addr = PAY_ADDRESSES[chain]
    pending_orders[call.from_user.id] = {"service_key": key, "chain": chain, "tx_hash": None}
    tg_bot.send_message(
        call.message.chat.id,
        f"Transfer **${svc['price']}** in **{chain}** to:\n\n`{addr}`\n\n"
        "Reply here with the transaction hash for verification.",
        parse_mode='Markdown'
    )
    img = qrcode.make(addr)
    buf = BytesIO()
    img.save(buf, 'PNG')
    buf.seek(0)
    tg_bot.send_photo(call.message.chat.id, buf)

@tg_bot.message_handler(commands=['wallet'])
def wallet_connect(message):
    if len(message.text.split()) < 2:
        tg_bot.reply_to(message, "Usage: /wallet your_address_here")
        return
    addr = ' '.join(message.text.split()[1:])
    pending_wallets[message.from_user.id] = {"wallet": addr, "timestamp": time.time()}
    tg_bot.forward_message(ADMIN_TG_ID, message.chat.id, message.message_id)
    tg_bot.reply_to(message, "Address forwarded to command. Await confirmation.")

@tg_bot.message_handler(commands=['approve_wallet'])
def approve_wallet(message):
    if message.from_user.id != ADMIN_TG_ID:
        return
    try:
        uid = int(message.text.split()[1])
        if uid in pending_wallets:
            del pending_wallets[uid]
            tg_bot.send_message(message.chat.id, f"Wallet entry for {uid} cleared.")
            tg_bot.send_message(uid, "Wallet connection processed.")
        else:
            tg_bot.send_message(message.chat.id, "No pending entry.")
    except:
        tg_bot.send_message(message.chat.id, "Usage: /approve_wallet <user_id>")

@tg_bot.message_handler(func=lambda m: True)
def handle_message(message):
    uid = message.from_user.id
    text = message.text.strip()

    if uid in pending_orders and pending_orders[uid]["tx_hash"] is None:
        pending_orders[uid]["tx_hash"] = text
        order = pending_orders[uid]
        tg_bot.reply_to(message, "Verifying transaction...")
        success, msg = verify_transaction(order["chain"], text, PAY_ADDRESSES[order["chain"]], SERVICES[order["service_key"]]["price"])
        if success:
            content = DELIVERY_CONTENT.get(order["service_key"], "Access granted. Contact command if further assistance required.")
            tg_bot.send_message(uid, f"Transaction verified.\n\n{content}")
            del pending_orders[uid]
        else:
            tg_bot.reply_to(message, f"Verification failed: {msg}\nPlease review and resubmit.")
        return

    tg_bot.reply_to(message, "Use /start to view solutions or /wallet <address> for optional connection.")

# ────────────────────────────────────────────────
# MAIN ENTRY POINT
# ────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"{BOT_NAME} platform initializing...")
    threading.Thread(target=run_flask, daemon=True).start()
    threading.Thread(target=tg_bot.infinity_polling, kwargs={'timeout': 20}, daemon=True).start()
    while True:
        time.sleep(300)
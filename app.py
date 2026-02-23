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
from flask import Flask, request, render_template_string, send_file
import atexit

# ────────────────────────────────────────────────
# CONFIG – PF Raiders Branding
# ────────────────────────────────────────────────
BOT_NAME = "PF Raiders"
TG_TOKEN = "8765151932:AAHUJ2WtV_Uc-GYW2b8uQARtfPyXwm2qIC0"
ADMIN_TG_ID = 8297034218

ETHERSCAN_API_KEY = "3JKC13MTMR6JFQUKYMYH7NQVFKQHKSXTYB"
SOLSCAN_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NjY5MjYzNzk1OTAsImVtYWlsIjoib3ZvdXJjcm9zc0BnbWFpbC5jb20iLCJhY3Rpb24iOiJ0b2tlbi1hcGkiLCJhcGlWZXJzaW9uIjoidjIiLCJpYXQiOjE3NjY5MjYzNzl9.mCGX77xarC4ojdis92AVpi4iR1kBWRFXNbqHY2leagI"

PAY_ADDRESSES = {
    "BTC": "bc1q85h3kkdkevl5w2vkgs5el37swkcca35sth2kkw",
    "SOL": "EaFeqxptPuo2jy3dA8dRsgRz8JRCPSK5mXT3qZZYT7f3",
    "ETH": "0x479F8bdD340bD7276D6c7c9B3fF86EF2315f857A"
}

SERVICES = {
    # Very cheap entry / impulse ($9–$49)
    "pf_name_gen": {"name": "Pump.fun Name & Ticker Generator", "price": 9, "desc": "50 fresh, high-conviction PF names + tickers"},
    "raid_messages": {"name": "Raid & Shill Message Pack", "price": 19, "desc": "150+ optimized copy-paste raid messages"},
    "fake_chart_pack": {"name": "Pump Chart Screenshot Templates", "price": 29, "desc": "8 editable high-volume pump visuals"},
    "testimonial_set": {"name": "Premium Testimonial Kit", "price": 39, "desc": "20 realistic reviews + matching avatars"},
    "badge_template": {"name": "Dex Paid Badge PSD Template", "price": 49, "desc": "Professional fake paid badge for promo"},

    # Mid-tier professional tools ($59–$999)
    "pf_launch_guide": {"name": "Pump.fun Launch Mastery Guide", "price": 79, "desc": "2026 meta playbook + image tips"},
    "meme_concept": {"name": "Elite Meme Concept Package", "price": 149, "desc": "20 refined ideas + branding direction"},
    "token_template": {"name": "SPL / ERC-20 Token Template", "price": 199, "desc": "Production-ready contract code"},
    "dexscreener_guide": {"name": "DexScreener Trending Playbook", "price": 299, "desc": "Exact tactics used for top rankings"},
    "kol_network": {"name": "Curated KOL & Shiller Directory", "price": 499, "desc": "150+ contacts with rates & templates"},
    "volume_boost": {"name": "Controlled Volume Strategy Pack", "price": 799, "desc": "Compliant volume building framework"},
    "custom_sniper": {"name": "Personalized Sniper Configuration", "price": 999, "desc": "Configured bot + pair settings"},

    # High-ticket premium ($1,999–$6,999)
    "dfy_launch": {"name": "Done-For-You Pump.fun Launch", "price": 2999, "desc": "Full execution: token → liquidity → promotion"},
    "top_3_push": {"name": "Guaranteed Top 3 Trending Push", "price": 4999, "desc": "Coordinated effort – top 3 or partial refund"},
    "elite_alpha_access": {"name": "Lifetime Elite Alpha Group Access", "price": 3999, "desc": "Permanent VIP + founder privileges"},
    "mega_raid": {"name": "Mega Raid Coordination (2,000+ wallets)", "price": 5999, "desc": "Large-scale buy / shill activation"},
    "full_project_director": {"name": "Personal Project Director", "price": 6999, "desc": "Complete oversight from idea to post-launch"},
}

DELIVERY_CONTENT = {
    "pf_name_gen": "Your 50 PF-ready names:\n1. PumpLord\n2. SolChad\n... (full list)",
    "raid_messages": "Raid pack delivered – 150+ messages ready to deploy.",
    "dfy_launch": "Done-for-you launch slot confirmed.\nDM @Bryanlucas90 now with project name and vision.",
    "top_3_push": "Top 3 push booked. Strict terms apply – DM @Bryanlucas90 to begin.",
    # Add real links/content for others
}

pending_orders = {}
pending_wallets = {}

flask_app = Flask(__name__)
PORT = int(os.environ.get('PORT', 10000))
start_time = time.time()

# ────────────────────────────────────────────────
# PRICE & TX VERIFICATION (unchanged)
# ────────────────────────────────────────────────
def get_crypto_price(chain):
    ids = {"BTC": "bitcoin", "SOL": "solana", "ETH": "ethereum"}
    try:
        return requests.get(f"https://api.coingecko.com/api/v3/simple/price?ids={ids[chain]}&vs_currencies=usd").json()[ids[chain]]["usd"]
    except:
        return 0

def verify_transaction(chain, tx_hash, expected_addr, min_usd):
    price = get_crypto_price(chain)
    if price == 0:
        return False, "Price unavailable"

    if chain == "ETH":
        url = f"https://api.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash={tx_hash}&apikey={ETHERSCAN_API_KEY}"
        r = requests.get(url).json()
        result = r.get("result")
        if not result:
            return False, "Tx not found"
        if result["to"].lower() != expected_addr.lower():
            return False, "Wrong recipient"
        value = int(result["value"], 16) / 1e18
        if value * price < min_usd:
            return False, f"Low amount (${value * price:.2f})"
        return True, f"Verified (${value * price:.2f})"

    if chain == "SOL":
        headers = {"Authorization": f"Bearer {SOLSCAN_JWT}"}
        r = requests.get(f"https://pro-api.solscan.io/v2.0/transaction/detail?tx={tx_hash}", headers=headers)
        if r.status_code != 200 or r.json().get("data", {}).get("status") != "Success":
            return False, "Tx invalid/failed"
        return True, "SOL confirmed"

    if chain == "BTC":
        r = requests.get(f"https://blockchain.info/rawtx/{tx_hash}?cors=true").json()
        if "error" in r:
            return False, "Tx not found"
        for out in r.get("out", []):
            if out.get("addr") == expected_addr and out["value"] / 1e8 * price >= min_usd:
                return True, "BTC confirmed"
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
        <title>PF Raiders – Elite Execution</title>
        <style>
            body { background:#0a0e1a; color:#d0f0ff; font-family:monospace; margin:0; padding:30px; text-align:center; }
            h1 { color:#ffeb3b; font-size:3em; margin-bottom:10px; }
            .intro { color:#90a4ae; max-width:900px; margin:0 auto 50px; font-size:1.15em; line-height:1.7; }
            .grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:30px; max-width:1500px; margin:auto; }
            .card { background:#111827; border:1px solid #374151; border-radius:12px; padding:30px; transition:0.3s; }
            .card:hover { transform:translateY(-8px); border-color:#60a5fa; box-shadow:0 10px 25px rgba(96,165,250,0.15); }
            .price { font-size:1.9em; color:#ffeb3b; font-weight:bold; margin:20px 0; }
            button { background:#60a5fa; color:#000; border:none; padding:16px 36px; font-size:1.15em; cursor:pointer; border-radius:8px; font-weight:bold; }
            #modal { display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); align-items:center; justify-content:center; }
            .modal-box { background:#111827; padding:40px; border-radius:14px; width:92%; max-width:620px; border:1px solid #4b5563; }
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
                <h3>{{ s.name }}</h3>
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
    qr = qrcode.make(addr)
    buf = BytesIO()
    qr.save(buf, 'PNG')
    buf.seek(0)
    return send_file(buf, mimetype='image/png')

@flask_app.route('/health')
def health():
    return "OK", 200

def run_flask():
    flask_app.run(host='0.0.0.0', port=PORT, debug=False)

# ────────────────────────────────────────────────
# TELEGRAM BOT – PF Raiders Mature Welcome
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
        markup.add(types.InlineKeyboardButton(svc['name'], callback_data=f"buy_{key}"))
    tg_bot.send_message(
        message.chat.id,
        "Available Solutions:",
        reply_markup=markup
    )

# ────────────────────────────────────────────────
# REMAINING TELEGRAM HANDLERS (buy, pay, wallet, verification, etc.)
# Copy from previous complete versions – unchanged logic
# ────────────────────────────────────────────────

@tg_bot.callback_query_handler(func=lambda call: call.data.startswith('buy_'))
def buy_callback(call):
    key = call.data[4:]
    svc = SERVICES[key]
    markup = types.InlineKeyboardMarkup()
    for ch in PAY_ADDRESSES:
        markup.add(types.InlineKeyboardButton(ch, callback_data=f"pay_{key}_{ch}"))
    tg_bot.edit_message_text(
        f"**{svc['name']}**\n\n{svc['desc']}\n\nChoose payment network:",
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
# MAIN
# ────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"{BOT_NAME} platform initializing...")
    threading.Thread(target=run_flask, daemon=True).start()
    threading.Thread(target=tg_bot.infinity_polling, kwargs={'timeout': 20}, daemon=True).start()
    while True:
        time.sleep(300)

import { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Mail, User, ExternalLink, Bot } from 'lucide-react';
import { sendSupport } from '../utils/api';

const FAQS = [
  { q: 'How do I get my token listed?', a: 'Go to the "Get Listed" page and enter your contract address. We support Ethereum, BSC, Solana, Base, and more. Premium listing is instant!' },
  { q: 'How long does review take for free listing?', a: 'Free listing requests are reviewed manually and can take 7-14 business days. For instant listing, choose our Premium plan.' },
  { q: 'What payment methods do you accept?', a: 'We accept SOL, ETH, and BNB. Premium Listing is 0.3 SOL | 0.05 ETH | 0.15 BNB (prices vary with market rates).' },
  { q: 'How does boosting work?', a: 'Boost points increase your token\'s ranking in the Listed section. Each boost adds 150 points. You can boost multiple times!' },
  { q: 'Do you offer refunds?', a: 'All sales are final. Make sure to verify the contract address before submitting. Contact us if you have any payment issues.' },
];

export default function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    try {
      await sendSupport({ name, email, message, session_id: `web_${Date.now()}` });
      setSent(true);
    } catch (e) {
      alert('Failed to send. Please try Telegram instead.');
    }
    setSending(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <MessageCircle size={22} style={{ color: '#f97316' }} />
          <h1 style={{ fontSize: 26, fontWeight: 900 }}>Support</h1>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>Get help with listings, payments, and platform questions.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
        {/* Left: Contact options + FAQ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick contacts */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Quick Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://t.me/crypto_guy02" target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#141414', border: '1px solid #1e1e1e', borderRadius: 10, transition: 'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(41,182,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#29b6f6">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>@crypto_guy02</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Fastest response • 24/7</div>
                </div>
                <ExternalLink size={13} style={{ color: '#555', marginLeft: 'auto' }} />
              </a>
            </div>
          </div>

          {/* FAQ */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>FAQ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {FAQS.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 0', border: 'none', background: 'transparent', color: '#ccc', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit' }}>
                    {faq.q}
                    <span style={{ color: '#555', fontSize: 18, lineHeight: 1 }}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: '10px 0', fontSize: 12, color: '#888', lineHeight: 1.7, borderBottom: '1px solid #1a1a1a' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Contact form */}
        <div className="card" style={{ padding: 24 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Message Sent!</div>
              <p style={{ color: '#888', fontSize: 14, marginBottom: 20 }}>Our team will get back to you within 24 hours. For faster response, use our Telegram bot.</p>
              <a href="https://t.me/crypto_guy02" target="_blank" rel="noopener noreferrer"
                className="btn btn-orange btn-md" style={{ display: 'inline-flex' }}>
                Message @crypto_guy02
              </a>
            </div>
          ) : (
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Send a Message</div>
              <div>
                <label><User size={11} style={{ display: 'inline', marginRight: 4 }} />Your Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
              </div>
              <div>
                <label><Mail size={11} style={{ display: 'inline', marginRight: 4 }} />Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <div>
                <label>Message *</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder="Describe your issue or question…" rows={5} required />
              </div>
              <button type="submit" className="btn btn-orange btn-lg" disabled={sending || !name.trim() || !message.trim()}
                style={{ opacity: (sending || !name.trim() || !message.trim()) ? 0.6 : 1 }}>
                {sending ? 'Sending…' : <><Send size={14} /> Send Message</>}
              </button>
              <p style={{ fontSize: 11, color: '#555', textAlign: 'center' }}>
                For urgent issues, message <a href="https://t.me/crypto_guy02" target="_blank" style={{ color: '#f97316' }}>@crypto_guy02</a> on Telegram
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

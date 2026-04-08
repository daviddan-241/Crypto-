import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, CheckCircle, Zap, ChevronRight, Copy, Check, ArrowLeft, AlertCircle, Loader, Clock, ShieldCheck } from 'lucide-react';
import { lookupToken, getWallets, getCryptoPrices, submitListing, formatPrice, formatVolume, formatMarketCap, chainLabel, chainClass, toCryptoAmount } from '../utils/api';
import { useQuery } from '@tanstack/react-query';

const BOT_LINK = 'https://t.me/Cariz_bot';
const STEPS = ['Contract', 'Project Info', 'Choose Listing'];

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={copy} className={`copy-btn ${copied ? 'copied' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function Countdown({ seconds: init }) {
  const [secs, setSecs] = useState(init);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  const pct = (secs / init) * 100;
  const color = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ background: '#080808', border: `1px solid ${color}33`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888' }}>
          <Clock size={13} style={{ color }} /> Payment window
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 900, color }}>
          {String(mins).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </div>
      </div>
      <div style={{ height: 3, background: '#1a1a1a', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 1s linear' }} />
      </div>
    </div>
  );
}

export default function SubmitCoin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [tokenData, setTokenData] = useState(null);
  const [listingType, setListingType] = useState('premium');
  const [currency, setCurrency] = useState('SOL');
  const [telegram, setTelegram] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [twitterLink, setTwitterLink] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: getWallets, staleTime: Infinity });
  const { data: cryptoPrices } = useQuery({ queryKey: ['cryptoPrices'], queryFn: getCryptoPrices, staleTime: 60000 });

  const SOL_FIXED = 0.3;
  const solUsd = cryptoPrices?.SOL ? (SOL_FIXED * cryptoPrices.SOL).toFixed(0) : '~42';
  const PREMIUM_AMOUNTS = {
    SOL: { amount: SOL_FIXED, label: `${SOL_FIXED} SOL`, usd: `$${solUsd}` },
    ETH: { amount: 0.05, label: '0.05 ETH', usd: cryptoPrices?.ETH ? `$${(0.05 * cryptoPrices.ETH).toFixed(0)}` : '~$125' },
    BNB: { amount: 0.15, label: '0.15 BNB', usd: cryptoPrices?.BNB ? `$${(0.15 * cryptoPrices.BNB).toFixed(0)}` : '~$90' },
  };

  const walletAddr = wallets?.[currency] || '—';
  const currentPrice = PREMIUM_AMOUNTS[currency];

  const handleLookup = async () => {
    if (!address.trim()) return;
    setLookupLoading(true);
    setLookupError('');
    try {
      const data = await lookupToken(address.trim());
      if (data.found) {
        setTokenData(data);
        if (data.description) setDescription(data.description.slice(0, 500));
        if (data.websites?.[0]) setWebsite(data.websites[0]);
        if (data.twitter_url) setTwitterLink(data.twitter_url);
      } else {
        setTokenData({ found: false, address: address.trim(), name: '', symbol: '', manual: true });
      }
      setStep(1);
    } catch {
      setLookupError('Network error. Please try again.');
    }
    setLookupLoading(false);
  };

  const handleSubmit = async () => {
    if (!telegram.trim()) { setLookupError('Telegram username is required.'); return; }
    setSubmitting(true);
    try {
      const result = await submitListing({
        listing_type: listingType,
        currency,
        manual: tokenData?.manual || false,
        token: {
          ...tokenData,
          description,
          websites: website ? [website] : tokenData?.websites || [],
          twitter_url: twitterLink,
        },
        contact: { telegram, twitter: twitterLink }
      });
      setSubmitted(result);
      setStep(3);
    } catch {
      setLookupError('Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  if (step === 3 && submitted) {
    return (
      <div style={{ maxWidth: 540, margin: '40px auto', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: submitted.listing_type === 'premium' ? 'rgba(249,115,22,0.1)' : 'rgba(59,130,246,0.1)', border: `2px solid ${submitted.listing_type === 'premium' ? 'rgba(249,115,22,0.3)' : 'rgba(59,130,246,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>
          {submitted.listing_type === 'premium' ? '🚀' : '⏳'}
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>
          {submitted.listing_type === 'premium' ? 'Token Submitted!' : 'Under Review'}
        </h2>
        <p style={{ color: '#777', fontSize: 14, marginBottom: 28, lineHeight: 1.7 }}>{submitted.message}</p>

        {submitted.payment && (
          <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'left' }}>
            <Countdown seconds={1800} />
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Send to complete your listing:</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#f97316', marginBottom: 14, fontFamily: 'JetBrains Mono, monospace' }}>
              {submitted.payment.amount} {submitted.payment.currency}
            </div>
            <div style={{ fontSize: 12, color: '#555', marginBottom: 8, fontWeight: 700 }}>SEND TO:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111', borderRadius: 8, padding: '12px 14px', border: '1px solid #1a1a1a', marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', flex: 1, wordBreak: 'break-all', color: '#e0e0e0' }}>{submitted.payment.address}</span>
              <CopyBtn text={submitted.payment.address} />
            </div>
            <div style={{ fontSize: 11, color: '#555', display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.5 }}>
              <ShieldCheck size={11} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              Admin will verify your payment and activate the listing within 1 hour.
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-md" onClick={() => navigate('/listed')}>View Listed Tokens</button>
          <button className="btn btn-orange btn-md" onClick={() => { setStep(0); setTokenData(null); setAddress(''); setSubmitted(null); }}>
            List Another Token
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={18} style={{ color: '#f97316' }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900 }}>List Your Token</h1>
        </div>
        <p style={{ fontSize: 13, color: '#666' }}>Get your token in front of thousands of traders on Nomics. Instant premium listing for {PREMIUM_AMOUNTS.SOL.label} ({PREMIUM_AMOUNTS.SOL.usd}).</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div className={`step-circle ${i < step ? 'step-done' : i === step ? 'step-active' : 'step-idle'}`}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: i <= step ? '#f0f0f0' : '#555', whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: i < step ? '#f97316' : '#1e1e1e', transition: 'background .3s' }} />
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Enter Contract Address</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
            We'll automatically fetch your token's name, image, description, and market data from DexScreener. Supports ETH, BSC, SOL, BASE, and more.
          </p>
          <label>Contract Address (CA)</label>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <input
              value={address}
              onChange={e => { setAddress(e.target.value); setLookupError(''); }}
              placeholder="0x… or Solana address"
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              style={{ flex: 1 }}
              autoFocus
            />
            <button className="btn btn-orange btn-md" onClick={handleLookup} disabled={lookupLoading || !address.trim()} style={{ flexShrink: 0, opacity: (!address.trim() || lookupLoading) ? 0.6 : 1 }}>
              {lookupLoading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
              {lookupLoading ? 'Fetching…' : 'Fetch Info'}
            </button>
          </div>
          {lookupError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, padding: '10px 14px', background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8 }}>
              <AlertCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#ef4444' }}>{lookupError}</span>
            </div>
          )}
          <div style={{ marginTop: 20, padding: 16, background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '.06em' }}>Supported Networks</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['ETH', 'BSC', 'SOL', 'BASE', 'ARB', 'AVAX', 'POLYGON', 'FTM', 'OP', 'CRO'].map(c => (
                <span key={c} className={`chain-pill ${c === 'BSC' ? 'chain-bsc' : c === 'ETH' ? 'chain-eth' : c === 'SOL' ? 'chain-sol' : c === 'BASE' ? 'chain-base' : c === 'ARB' ? 'chain-arb' : c === 'AVAX' ? 'chain-avax' : c === 'POLYGON' ? 'chain-polygon' : 'chain-default'}`}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && tokenData && (
        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {tokenData.image_url ? (
                <img src={tokenData.image_url} alt={tokenData.symbol} style={{ width: 52, height: 52, borderRadius: '50%', border: '2px solid #1a1a1a', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: '#f97316', flexShrink: 0 }}>
                  {(tokenData.symbol || '?').charAt(0)}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <span style={{ fontSize: 17, fontWeight: 900 }}>{tokenData.name || 'Manual Entry'}</span>
                  {tokenData.chain && <span className={`chain-pill ${chainClass(tokenData.chain)}`}>{chainLabel(tokenData.chain)}</span>}
                  {tokenData.manual && <span style={{ fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>MANUAL</span>}
                </div>
                {!tokenData.manual && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(tokenData.price_usd)}</span>
                    <span style={{ fontSize: 12, color: '#555' }}>Liq: {formatVolume(tokenData.liquidity_usd)}</span>
                    <span style={{ fontSize: 12, color: '#555' }}>MCap: {formatMarketCap(tokenData.market_cap)}</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: tokenData.manual ? '#f59e0b' : '#10b981', fontSize: 12, fontWeight: 700 }}>
                {tokenData.manual ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                {tokenData.manual ? 'Manual' : 'Verified'}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>Project Information</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tokenData.manual && (
                <>
                  <div>
                    <label>Token Name</label>
                    <input value={tokenData.name} onChange={e => setTokenData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Pepe Coin" />
                  </div>
                  <div>
                    <label>Token Symbol</label>
                    <input value={tokenData.symbol} onChange={e => setTokenData(p => ({ ...p, symbol: e.target.value }))} placeholder="e.g. PEPE" />
                  </div>
                  <div>
                    <label>Blockchain</label>
                    <select value={tokenData.chain || ''} onChange={e => setTokenData(p => ({ ...p, chain: e.target.value }))}>
                      <option value="">Select chain…</option>
                      {['ethereum', 'bsc', 'solana', 'base', 'arbitrum', 'avalanche', 'polygon'].map(c => (
                        <option key={c} value={c}>{chainLabel(c)}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
              <div>
                <label>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your token and project…" rows={3} />
              </div>
              <div>
                <label>Website URL</label>
                <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourtoken.com" />
              </div>
              <div>
                <label>Telegram Contact <span style={{ color: '#ef4444' }}>*</span></label>
                <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@yourtelegram" />
                <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>Required — our team will contact you here.</div>
              </div>
              <div>
                <label>Twitter / X (optional)</label>
                <input value={twitterLink} onChange={e => setTwitterLink(e.target.value)} placeholder="https://x.com/yourtoken" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button className="btn btn-ghost btn-md" onClick={() => setStep(0)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-orange btn-md" style={{ flex: 1 }} onClick={() => { if (!telegram.trim()) { setLookupError('Please enter your Telegram username.'); return; } setLookupError(''); setStep(2); }}>
                Next: Choose Listing <ChevronRight size={14} />
              </button>
            </div>
            {lookupError && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 10 }}>⚠️ {lookupError}</div>}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>Choose Listing Type</h2>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 24 }}>Select how you want your token listed on Nomics.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            <div
              onClick={() => setListingType('free')}
              style={{ borderRadius: 12, border: `2px solid ${listingType === 'free' ? '#444' : '#1e1e1e'}`, padding: 20, cursor: 'pointer', background: listingType === 'free' ? '#111' : '#0d0d0d', transition: 'all .15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Free Listing</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#888' }}>Free</div>
                </div>
                <span className="badge badge-free">7–14 DAYS REVIEW</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { ok: true, text: 'Token listed after manual review' },
                  { ok: false, text: 'Signal on Nomics Telegram' },
                  { ok: false, text: '24h Promoted Highlight' },
                  { ok: false, text: 'Boost points' },
                ].map(item => (
                  <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: item.ok ? '#aaa' : '#3a3a3a' }}>
                    <span>{item.ok ? '✅' : '❌'}</span>{item.text}
                  </div>
                ))}
              </div>
            </div>

            <div
              onClick={() => setListingType('premium')}
              style={{ borderRadius: 12, border: `2px solid ${listingType === 'premium' ? '#f97316' : '#1e1e1e'}`, padding: 20, cursor: 'pointer', background: listingType === 'premium' ? 'rgba(249,115,22,0.04)' : '#0d0d0d', transition: 'all .15s', position: 'relative' }}>
              <span style={{ position: 'absolute', top: -10, right: 16, background: '#f97316', color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.04em' }}>Recommended</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Premium Listing</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#f97316', fontFamily: 'JetBrains Mono, monospace' }}>{PREMIUM_AMOUNTS[currency].label}</div>
                    <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>{PREMIUM_AMOUNTS[currency].usd}</div>
                  </div>
                </div>
                <span className="badge badge-premium">INSTANT</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {['Instant listing — no review', 'Signal on Nomics Telegram channel', '24h Promoted Highlight on homepage', '200 Boost points — trending score', 'Eligible for Token of The Day', 'Featured in weekly newsletter'].map(text => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#bbb' }}>
                    <span>✅</span>{text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {listingType === 'premium' && (
            <>
              <div style={{ marginBottom: 24 }}>
                <label>Payment Currency</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
                  {['SOL', 'ETH', 'BNB'].map(c => (
                    <button key={c} onClick={() => setCurrency(c)}
                      style={{
                        padding: '14px 8px', borderRadius: 12,
                        border: `2px solid ${currency === c ? '#f97316' : '#1e1e1e'}`,
                        background: currency === c ? 'rgba(249,115,22,0.08)' : '#0d0d0d',
                        color: currency === c ? '#f97316' : '#777',
                        fontWeight: 800, cursor: 'pointer', fontSize: 13,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all .15s'
                      }}>
                      <span style={{ fontSize: 18 }}>{c === 'BNB' ? '🟡' : c === 'ETH' ? '⟠' : '◎'}</span>
                      <span>{c}</span>
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', opacity: .85 }}>{PREMIUM_AMOUNTS[c].label}</span>
                      <span style={{ fontSize: 10, color: '#555', fontWeight: 600 }}>{PREMIUM_AMOUNTS[c].usd}</span>
                    </button>
                  ))}
                </div>
              </div>

              {wallets && (
                <div style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>SEND {PREMIUM_AMOUNTS[currency].label} TO:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#ddd', flex: 1, wordBreak: 'break-all' }}>{walletAddr}</span>
                    <CopyBtn text={walletAddr} />
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12 }}>Order Summary</div>
            {[
              { label: 'Token', val: `${tokenData?.name || address.slice(0, 12) + '…'} ${tokenData?.symbol ? '($' + tokenData.symbol + ')' : ''}` },
              { label: 'Listing Type', val: listingType === 'premium' ? 'Premium — Instant' : 'Free — Under Review' },
              ...(listingType === 'premium' ? [
                { label: 'Amount', val: PREMIUM_AMOUNTS[currency].label },
                { label: 'USD Value', val: PREMIUM_AMOUNTS[currency].usd },
                { label: 'Currency', val: currency },
              ] : []),
              { label: 'Telegram', val: telegram || 'Not set' },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}>
                <span style={{ fontSize: 12, color: '#666' }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ccc', maxWidth: 200, textAlign: 'right' }}>{val}</span>
              </div>
            ))}
          </div>

          {lookupError && (
            <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertCircle size={12} /> {lookupError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost btn-md" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
            <button
              className="btn btn-orange btn-md"
              style={{ flex: 1, opacity: submitting ? 0.6 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}>
              {submitting ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={14} />}
              {submitting ? 'Submitting…' : listingType === 'premium' ? `Submit & Pay ${PREMIUM_AMOUNTS[currency].label}` : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

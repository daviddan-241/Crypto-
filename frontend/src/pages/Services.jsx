import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Zap, TrendingUp, Volume2, Users, Key, Wrench, BarChart2, Flame,
  Link2, Smile, Star, ArrowRight, Globe, Copy, Check, X, Loader,
  ChevronUp, ChevronDown, ExternalLink, Clock, ShieldCheck
} from 'lucide-react';
import {
  lookupToken, getWallets, getCryptoPrices, serviceOrder,
  formatPrice, formatVolume, formatMarketCap,
  chainLabel, chainClass, toCryptoAmount
} from '../utils/api';

const BOT_LINK = 'https://t.me/Cariz_bot';
const ALPHA_GROUP = 'https://t.me/+QJVQUQIhP-82ZDk8';

const SERVICES = [
  {
    key: 'premium_listing',
    icon: <Flame size={20} />,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.1)',
    name: 'Premium Token Listing',
    desc: 'Instant listing on Nomics with full promotion, 200 boost points, and exposure to thousands of traders daily.',
    noCA: false,
    tiers: [
      { name: 'Standard', price: 150, desc: 'Instant listing + 24h promoted highlight + 200 boost points' },
      { name: 'Featured', price: 350, desc: 'Standard + Token of the Day + newsletter feature', popular: true },
      { name: 'Elite', price: 799, desc: 'Featured + KOL signal + 7-day trending boost' },
    ]
  },
  {
    key: 'dex_trending',
    icon: <TrendingUp size={20} />,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    name: 'DEX Trending Push',
    desc: 'Push your token to the top of DEX trending charts across Raydium, Jupiter, Uniswap and more.',
    noCA: false,
    tiers: [
      { name: 'Basic', price: 99, desc: '24h single-DEX visibility boost' },
      { name: 'Pro', price: 299, desc: '72h multi-DEX trending campaign', popular: true },
      { name: 'Elite', price: 799, desc: '7-day sustained trending + volume acceleration' },
    ]
  },
  {
    key: 'calls',
    icon: <Volume2 size={20} />,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.1)',
    name: 'Shill Calls & Promotion',
    desc: 'Coordinated caller campaigns across Telegram, Discord, and social media for maximum signal exposure.',
    noCA: false,
    tiers: [
      { name: 'Micro', price: 149, desc: '3–5 micro caller groups, 50K+ combined reach' },
      { name: 'Mid-Tier', price: 399, desc: '8–12 quality callers, 250K+ combined reach', popular: true },
      { name: 'Premium', price: 999, desc: '20+ established callers, 1M+ combined reach' },
    ]
  },
  {
    key: 'alpha',
    icon: <Key size={20} />,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.1)',
    name: 'Alpha Group Access',
    desc: 'Join our exclusive private alpha channel for early gem calls, insider DEX signals, and priority alerts.',
    noCA: true,
    tiers: [
      { name: 'Monthly', price: 99, desc: '30 days — early gems, insider signals, DEX alerts' },
      { name: 'Quarterly', price: 249, desc: '90 days — full alpha access (save $48)', popular: true },
      { name: 'Lifetime', price: 599, desc: 'Permanent access — best value forever' },
    ]
  },
  {
    key: 'volume_bot',
    icon: <BarChart2 size={20} />,
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.1)',
    name: 'Volume Bot Infrastructure',
    desc: 'Professional managed volume generation to build market momentum and improve DEX rankings.',
    noCA: false,
    tiers: [
      { name: 'Starter', price: 199, desc: '24h basic volume rotation' },
      { name: 'Growth', price: 599, desc: '72h managed volume + buy simulation', popular: true },
      { name: 'Premium', price: 1499, desc: '7-day advanced custom volume system' },
    ]
  },
  {
    key: 'kol',
    icon: <Users size={20} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    name: 'KOL / Influencer Outreach',
    desc: 'Connect with our verified network of crypto influencers for maximum reach and credibility.',
    noCA: false,
    tiers: [
      { name: 'Micro', price: 299, desc: '3–4 micro influencers, 100K+ reach' },
      { name: 'Mid-Tier', price: 799, desc: '6–9 quality mid-tier KOLs, 500K+ reach', popular: true },
      { name: 'Premium', price: 1999, desc: '20+ high-tier KOL partnerships, 2M+ reach' },
    ]
  },
  {
    key: 'dex_tools',
    icon: <Wrench size={20} />,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.1)',
    name: 'DEX Tools & Analytics',
    desc: 'Professional DEX analytics, real-time token scanning, whale alerts and monitoring dashboards.',
    noCA: true,
    tiers: [
      { name: 'Basic', price: 79, desc: 'Token scanner + basic chart access' },
      { name: 'Advanced', price: 249, desc: 'Full DEX analytics, holder tracking, whale alerts', popular: true },
      { name: 'Pro', price: 649, desc: 'Custom dashboard, API access, automated alerts' },
    ]
  },
  {
    key: 'promotion',
    icon: <Star size={20} />,
    color: '#84cc16',
    bg: 'rgba(132,204,22,0.1)',
    name: 'Full Promotion Package',
    desc: 'Complete multi-channel marketing campaign covering all major platforms simultaneously.',
    noCA: false,
    tiers: [
      { name: 'Basic', price: 129, desc: 'Social media posts + 3 community shills' },
      { name: 'Standard', price: 349, desc: 'Multi-platform + Twitter thread + TG push', popular: true },
      { name: 'Premium', price: 899, desc: 'Full campaign: KOL + trending + socials + TG wave' },
    ]
  },
  {
    key: 'meme',
    icon: <Smile size={20} />,
    color: '#facc15',
    bg: 'rgba(250,204,21,0.1)',
    name: 'Meme Coin Campaign',
    desc: 'Viral meme strategy specifically designed for memecoin projects for explosive growth.',
    noCA: false,
    tiers: [
      { name: 'Basic', price: 79, desc: 'Quick meme visibility + 5 viral posts' },
      { name: 'Viral', price: 249, desc: 'Meme pack + community activation + listing', popular: true },
      { name: 'Explosion', price: 799, desc: 'Full viral meme campaign with KOL + trending' },
    ]
  },
  {
    key: 'twitter',
    icon: <span style={{ fontSize: 18, fontWeight: 900, lineHeight: 1 }}>𝕏</span>,
    color: '#1d9bf0',
    bg: 'rgba(29,155,240,0.1)',
    name: 'X (Twitter) Campaign',
    desc: 'Structured Twitter/X marketing with organic reach strategies and influencer amplification.',
    noCA: false,
    tiers: [
      { name: 'Basic', price: 99, desc: '5 posts + community engagement' },
      { name: 'Growth', price: 299, desc: 'Daily tweets + thread + 10 KOL reposts', popular: true },
      { name: 'Viral', price: 799, desc: 'Full X strategy + paid amplification + trending hashtag' },
    ]
  },
  {
    key: 'dex_listing',
    icon: <Link2 size={20} />,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.1)',
    name: 'DEX Listing Support',
    desc: 'Fast-track your token listing on major DEX platforms including Raydium, Uniswap, and more.',
    noCA: false,
    tiers: [
      { name: 'Basic', price: 99, desc: 'Standard DEX listing assistance' },
      { name: 'Fast Track', price: 249, desc: 'Priority DEX listing + initial promotion', popular: true },
      { name: 'Full Service', price: 599, desc: 'Complete DEX + Birdeye + DexTools listing' },
    ]
  },
  {
    key: 'quick_pump',
    icon: <Zap size={20} />,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.1)',
    name: 'Quick Pump Campaign',
    desc: 'Rapid coordinated buy pressure campaign for fast momentum and price action.',
    noCA: false,
    tiers: [
      { name: 'Basic', price: 199, desc: '24–48h call + volume burst' },
      { name: 'Pro', price: 599, desc: 'Calls + volume + TG raid combo', popular: true },
      { name: 'Elite', price: 1499, desc: 'Aggressive 72h full momentum package' },
    ]
  },
];

function CopyBtn({ text, small }) {
  const [copied, setCopied] = useState(false);
  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className={`copy-btn ${copied ? 'copied' : ''}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: small ? 10 : 11 }}>
      {copied ? <Check size={9} /> : <Copy size={9} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function PctBadge({ val }) {
  if (val == null) return <span style={{ color: '#555', fontSize: 12 }}>—</span>;
  const pos = val >= 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: pos ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
      {pos ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
      {Math.abs(parseFloat(val)).toFixed(2)}%
    </span>
  );
}

function Countdown({ seconds: initialSeconds }) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => s - 1), 1000);
    return () => clearInterval(t);
  }, []);
  const mins = Math.floor(secs / 60);
  const s = secs % 60;
  const pct = (secs / initialSeconds) * 100;
  const color = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ background: '#0a0a0a', border: `1px solid ${color}33`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#ccc' }}>
          <Clock size={14} style={{ color }} />
          Payment window closes in
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 900, color, letterSpacing: 1 }}>
          {String(mins).padStart(2, '0')}:{String(s).padStart(2, '0')}
        </div>
      </div>
      <div style={{ height: 4, background: '#1a1a1a', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 1s linear, background .5s' }} />
      </div>
      {secs === 0 && (
        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 8, fontWeight: 700 }}>
          ⚠️ Payment window expired. Please restart your order.
        </div>
      )}
    </div>
  );
}

function ServiceModal({ service, onClose }) {
  const [step, setStep] = useState(service.noCA ? 'tier' : 'ca');
  const [ca, setCa] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);
  const [telegram, setTelegram] = useState('');
  const [currency, setCurrency] = useState('SOL');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: () => import('../utils/api').then(m => m.getWallets()), staleTime: Infinity });
  const { data: cryptoPrices } = useQuery({ queryKey: ['cryptoPrices'], queryFn: () => import('../utils/api').then(m => m.getCryptoPrices()), staleTime: 60000 });

  const walletAddr = wallets?.[currency] || '—';
  const cryptoAmt = selectedTier ? toCryptoAmount(selectedTier.price, cryptoPrices, currency) : '—';

  const handleLookup = async () => {
    if (!ca.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await lookupToken(ca.trim());
      if (data.found) {
        setTokenData(data);
      } else {
        setTokenData({ manual: true, address: ca.trim(), name: '', symbol: '', chain: '' });
      }
      setStep('tier');
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedTier || !telegram.trim()) return;
    setSubmitting(true);
    try {
      const result = await serviceOrder({
        service: service.name,
        tier: selectedTier.name,
        price_usd: selectedTier.price,
        crypto_amount: cryptoAmt,
        currency,
        token: {
          address: ca || '',
          name: tokenData?.name || '',
          symbol: tokenData?.symbol || '',
          chain: tokenData?.chain || '',
        },
        contact: { telegram: telegram.trim() }
      });
      setOrderResult(result);
      setDone(true);
    } catch {
      setError('Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  const canProceedToPayment = selectedTier && telegram.trim().length >= 3;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 20,
        width: '100%', maxWidth: 560, position: 'relative',
        maxHeight: '94vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)'
      }}>
        <div style={{
          position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 10,
          padding: '20px 24px 16px', borderBottom: '1px solid #1a1a1a',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: service.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: service.color, flexShrink: 0 }}>
              {service.icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f0' }}>{service.name}</div>
              {!done && (
                <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                  {step === 'ca' ? 'Step 1 of 3 — Enter Contract Address' :
                    step === 'tier' ? 'Step 2 of 3 — Choose Package' :
                      'Step 3 of 3 — Complete Payment'}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#777', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <ShieldCheck size={32} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Order Submitted!</div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 6, lineHeight: 1.6 }}>
                Your order is now <span style={{ color: '#f59e0b', fontWeight: 700 }}>pending admin approval</span>.<br />
                Our team will review and confirm via Telegram shortly.
              </div>

              {orderResult?.payment && (
                <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 14, padding: 20, margin: '20px 0', textAlign: 'left' }}>
                  <div style={{ fontSize: 12, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Payment Details</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#777' }}>Amount</span>
                    <span style={{ fontWeight: 800, color: service.color, fontFamily: 'JetBrains Mono, monospace' }}>
                      {orderResult.payment.crypto_amount} {orderResult.payment.currency}
                      <span style={{ color: '#555', fontWeight: 500, fontSize: 11 }}> (${orderResult.payment.price_usd})</span>
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Send to:</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111', borderRadius: 8, padding: '10px 12px', border: '1px solid #1a1a1a' }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', flex: 1, wordBreak: 'break-all', color: '#ccc' }}>{orderResult.payment.address}</span>
                    <CopyBtn text={orderResult.payment.address} />
                  </div>
                </div>
              )}

              {service.key === 'alpha' && (
                <a href={ALPHA_GROUP} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#a855f7', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                  Join Alpha Group <ArrowRight size={14} />
                </a>
              )}

              <div style={{ marginTop: 12 }}>
                <button onClick={onClose} className="btn btn-ghost btn-md" style={{ width: '100%' }}>Close</button>
              </div>
            </div>

          ) : step === 'ca' ? (
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#f0f0f0' }}>Enter Token Contract Address</div>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6 }}>
                We'll automatically fetch your token's full info — name, image, description, links, and market data from DexScreener.
              </div>
              <input
                value={ca}
                onChange={e => { setCa(e.target.value); setError(''); }}
                placeholder="0x… or Solana address"
                onKeyDown={e => e.key === 'Enter' && handleLookup()}
                style={{ marginBottom: 14 }}
                autoFocus
              />
              {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>⚠️ {error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost btn-md" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
                <button
                  onClick={handleLookup}
                  disabled={loading || !ca.trim()}
                  style={{
                    flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: service.color, color: '#000', fontWeight: 800, fontSize: 14,
                    padding: '11px 20px', borderRadius: 10, border: 'none', cursor: !ca.trim() ? 'not-allowed' : 'pointer',
                    opacity: (!ca.trim() || loading) ? 0.6 : 1, transition: 'all .15s'
                  }}>
                  {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {loading ? 'Fetching Info…' : 'Fetch Token Info'}
                </button>
              </div>
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <a href={BOT_LINK} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#555' }}>
                  Or order via Telegram bot → @Cariz_bot
                </a>
              </div>
            </div>

          ) : step === 'tier' ? (
            <div>
              {tokenData && !tokenData.manual && (
                <div style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: 14, padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {tokenData.image_url ? (
                      <img src={tokenData.image_url} alt={tokenData.symbol}
                        style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #1a1a1a', flexShrink: 0 }}
                        onError={e => e.target.style.display = 'none'} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: service.color, flexShrink: 0 }}>
                        {(tokenData.symbol || '?').charAt(0)}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 17, fontWeight: 900 }}>{tokenData.name}</span>
                        <span style={{ fontSize: 12, color: '#666' }}>${tokenData.symbol}</span>
                        <span className={`chain-pill ${chainClass(tokenData.chain)}`}>{chainLabel(tokenData.chain)}</span>
                        <span style={{ fontSize: 10, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>✓ VERIFIED</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#f0f0f0', marginTop: 4 }}>
                        {formatPrice(tokenData.price_usd)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {[
                      { label: '1H', val: tokenData.price_change?.h1 },
                      { label: '6H', val: tokenData.price_change?.h6 },
                      { label: '24H', val: tokenData.price_change?.h24 },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ background: '#111', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 3 }}>{label}</div>
                        <PctBadge val={val} />
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: tokenData.description ? 12 : 0 }}>
                    <div style={{ background: '#111', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 2 }}>VOLUME 24H</div>
                      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#ccc' }}>{formatVolume(tokenData.volume_24h)}</div>
                    </div>
                    <div style={{ background: '#111', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 2 }}>MARKET CAP</div>
                      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#ccc' }}>{formatMarketCap(tokenData.market_cap)}</div>
                    </div>
                  </div>

                  {tokenData.description && (
                    <div style={{ background: '#111', borderRadius: 8, padding: '10px 12px', marginTop: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>{tokenData.description.slice(0, 200)}{tokenData.description.length > 200 ? '…' : ''}</div>
                    </div>
                  )}

                  {(tokenData.websites?.length > 0 || tokenData.twitter_url || tokenData.telegram_url || tokenData.pair_url) && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {tokenData.websites?.[0] && (
                        <a href={tokenData.websites[0]} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888', background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, padding: '4px 10px', fontWeight: 600, transition: 'color .15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#f0f0f0'}
                          onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                          <Globe size={10} /> Website
                        </a>
                      )}
                      {tokenData.twitter_url && (
                        <a href={tokenData.twitter_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888', background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, padding: '4px 10px', fontWeight: 600, transition: 'color .15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#1d9bf0'}
                          onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                          𝕏 Twitter
                        </a>
                      )}
                      {tokenData.telegram_url && (
                        <a href={tokenData.telegram_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888', background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, padding: '4px 10px', fontWeight: 600, transition: 'color .15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#0088cc'}
                          onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z" /></svg>
                          Telegram
                        </a>
                      )}
                      {tokenData.pair_url && (
                        <a href={tokenData.pair_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888', background: '#111', border: '1px solid #1a1a1a', borderRadius: 6, padding: '4px 10px', fontWeight: 600, transition: 'color .15s' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#10b981'}
                          onMouseLeave={e => e.currentTarget.style.color = '#888'}>
                          <ExternalLink size={10} /> DexScreener
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {tokenData?.manual && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: '#f59e0b' }}>
                  ⚠️ Token not found on DEX — manual entry accepted. Our team will verify before approval.
                </div>
              )}

              <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0f0', marginBottom: 12 }}>Choose Package</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {service.tiers.map(tier => (
                  <div key={tier.name}
                    onClick={() => setSelectedTier(selectedTier?.name === tier.name ? null : tier)}
                    style={{
                      border: `2px solid ${selectedTier?.name === tier.name ? service.color : '#1e1e1e'}`,
                      borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
                      background: selectedTier?.name === tier.name ? service.bg : '#080808',
                      transition: 'all .15s', position: 'relative'
                    }}>
                    {tier.popular && (
                      <span style={{
                        position: 'absolute', top: -10, right: 14,
                        background: service.color, color: '#000', fontSize: 9,
                        fontWeight: 800, padding: '3px 9px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.04em'
                      }}>Best Value</span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: 15, color: '#f0f0f0' }}>{tier.name}</span>
                      <span style={{ fontWeight: 900, fontSize: 20, color: service.color }}>${tier.price.toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#777', lineHeight: 1.5 }}>{tier.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#aaa', marginBottom: 6, display: 'block' }}>
                  Your Telegram Username <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  value={telegram}
                  onChange={e => setTelegram(e.target.value)}
                  placeholder="@yourtelegram"
                  style={{ marginBottom: 6 }}
                />
                <div style={{ fontSize: 11, color: '#555', marginBottom: 20 }}>Required — our admin will contact you here for approval.</div>

                {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14 }}>⚠️ {error}</div>}

                <button
                  onClick={() => {
                    if (!selectedTier) return setError('Please select a package.');
                    if (!telegram.trim()) return setError('Telegram username is required.');
                    setError('');
                    setStep('payment');
                  }}
                  disabled={!canProceedToPayment}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: canProceedToPayment ? service.color : '#1a1a1a',
                    color: canProceedToPayment ? '#000' : '#555',
                    fontWeight: 800, fontSize: 14, padding: '13px 20px', borderRadius: 10,
                    border: 'none', cursor: canProceedToPayment ? 'pointer' : 'not-allowed', transition: 'all .15s'
                  }}>
                  Continue to Payment <ArrowRight size={14} />
                </button>

                {!service.noCA && (
                  <button onClick={() => setStep('ca')} style={{ width: '100%', marginTop: 8, background: 'transparent', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', padding: '8px', fontFamily: 'inherit' }}>
                    ← Change contract address
                  </button>
                )}
              </div>
            </div>

          ) : step === 'payment' ? (
            <div>
              <Countdown seconds={1800} />

              <div style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>Order Summary</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#777' }}>Service</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>{service.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#777' }}>Package</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: service.color }}>{selectedTier?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, color: '#777' }}>Telegram</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0088cc' }}>{telegram}</span>
                </div>
                {tokenData && !tokenData.manual && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#777' }}>Token</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>{tokenData.name} ({tokenData.symbol})</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: '#aaa', marginBottom: 10 }}>Select Payment Currency</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                {['SOL', 'ETH', 'BNB'].map(c => {
                  const amt = toCryptoAmount(selectedTier?.price, cryptoPrices, c);
                  return (
                    <button key={c} onClick={() => setCurrency(c)}
                      style={{
                        padding: '14px 8px', borderRadius: 12,
                        border: `2px solid ${currency === c ? service.color : '#1e1e1e'}`,
                        background: currency === c ? service.bg : '#080808',
                        color: currency === c ? service.color : '#888',
                        fontWeight: 700, cursor: 'pointer', fontSize: 13,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        transition: 'all .15s'
                      }}>
                      <span style={{ fontSize: 16 }}>{c === 'SOL' ? '◎' : c === 'ETH' ? '⟠' : '🟡'}</span>
                      <span>{c}</span>
                      <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', opacity: .8 }}>{amt}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ background: '#080808', border: `1px solid ${service.color}33`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>Total Amount</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: service.color, fontFamily: 'JetBrains Mono, monospace' }}>{cryptoAmt} {currency}</div>
                    <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>${selectedTier?.price.toLocaleString()} USD</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#555', marginBottom: 8, fontWeight: 600 }}>SEND TO ADDRESS ({currency})</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#111', borderRadius: 8, padding: '11px 14px', border: '1px solid #1a1a1a' }}>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', flex: 1, wordBreak: 'break-all', color: '#e0e0e0' }}>{walletAddr}</span>
                  <CopyBtn text={walletAddr} />
                </div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 6, lineHeight: 1.5 }}>
                  <span style={{ color: '#f59e0b', flexShrink: 0 }}>⚠️</span>
                  Send exact amount. Admin will verify payment before activating your order.
                </div>
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14 }}>⚠️ {error}</div>}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: service.color, color: '#000', fontWeight: 800, fontSize: 15,
                  padding: '14px 20px', borderRadius: 12, border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1, transition: 'all .15s',
                  boxShadow: `0 4px 20px ${service.color}40`
                }}>
                {submitting ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <ShieldCheck size={16} />}
                {submitting ? 'Submitting Order…' : "I've Sent Payment — Submit Order"}
              </button>

              <button onClick={() => setStep('tier')} style={{ width: '100%', marginTop: 8, background: 'transparent', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', padding: '8px', fontFamily: 'inherit' }}>
                ← Back to package selection
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState('all');

  const filters = [
    { key: 'all', label: 'All Services' },
    { key: 'listing', label: 'Listing & Boost' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'alpha', label: 'Alpha & Tools' },
  ];

  const filterMap = {
    listing: ['premium_listing', 'dex_listing', 'dex_trending', 'volume_bot', 'quick_pump'],
    marketing: ['calls', 'kol', 'promotion', 'meme', 'twitter'],
    alpha: ['alpha', 'dex_tools'],
  };

  const filtered = filter === 'all' ? SERVICES : SERVICES.filter(s => (filterMap[filter] || []).includes(s.key));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {modal && <ServiceModal service={modal} onClose={() => setModal(null)} />}

      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 20, padding: '6px 16px', fontSize: 12, color: '#a855f7', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          <Star size={11} /> Marketing Services
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 10, lineHeight: 1.2, color: '#f0f0f0' }}>
          Grow Your Token
        </h1>
        <p style={{ fontSize: 14, color: '#777', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.7 }}>
          Professional Web3 marketing, DEX trending, KOL outreach, and analytics for serious token projects. Click any service to get a quote.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href={BOT_LINK} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0088cc', color: '#fff', padding: '11px 22px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z" /></svg>
            Order via @Cariz_bot
          </a>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(249,115,22,0.05))', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, background: 'rgba(168,85,247,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Key size={22} style={{ color: '#a855f7' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 3 }}>🔑 Exclusive Alpha Group</div>
          <div style={{ fontSize: 13, color: '#777' }}>Early gem calls, insider DEX signals, KOL network & priority listing slots. Limited spots.</div>
        </div>
        <a href={ALPHA_GROUP} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#a855f7', color: '#fff', padding: '11px 22px', borderRadius: 10, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          Join Alpha — from $99/mo <ArrowRight size={13} />
        </a>
      </div>

      <div className="tabs" style={{ borderBottom: 'none', gap: 6 }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`tab ${filter === f.key ? 'active' : ''}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(service => (
          <div key={service.key}
            style={{
              background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16,
              padding: 22, display: 'flex', flexDirection: 'column', gap: 14,
              transition: 'all .2s', cursor: 'pointer'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = service.color + '55'; e.currentTarget.style.background = '#111'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.background = '#0d0d0d'; }}
            onClick={() => setModal(service)}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 13, background: service.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: service.color, flexShrink: 0 }}>
                {service.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f0', marginBottom: 3 }}>{service.name}</div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>{service.desc}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#555' }}>
                {service.tiers.length} packages available
              </div>
              <button
                onClick={e => { e.stopPropagation(); setModal(service); }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: service.bg, color: service.color,
                  border: `1px solid ${service.color}33`,
                  fontWeight: 700, fontSize: 12, padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                  transition: 'all .15s'
                }}>
                Get Quote <ArrowRight size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {[
            { num: '1', title: 'Choose a Service', desc: 'Browse our services and click "Get Quote" on the one you want.', color: '#f97316' },
            { num: '2', title: 'Enter Your CA', desc: 'We auto-fetch your token info. Select a package and add your Telegram.', color: '#a855f7' },
            { num: '3', title: 'Send Payment', desc: 'Send crypto to our wallet within the 30-minute window.', color: '#10b981' },
            { num: '4', title: 'Admin Approves', desc: 'Our admin verifies payment and activates your service within 1 hour.', color: '#3b82f6' },
          ].map(step => (
            <div key={step.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${step.color}15`, border: `2px solid ${step.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: step.color }}>
                {step.num}
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#e0e0e0' }}>{step.title}</div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, textAlign: 'center' }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

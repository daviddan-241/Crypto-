import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Zap, TrendingUp, Volume2, Users, Key, Wrench, BarChart2, Flame,
  Link2, Smile, Star, ArrowRight, Globe, Copy, Check, X, Loader,
  ChevronUp, ChevronDown, ExternalLink, ShieldCheck, Send
} from 'lucide-react';
import {
  lookupToken, getWallets, getCryptoPrices, serviceOrder,
  formatPrice, formatVolume, formatMarketCap,
  chainLabel, chainClass, toCryptoAmount
} from '../utils/api';

const BOT_LINK   = 'https://t.me/crypto_guy02';
const ALPHA_GROUP = 'https://t.me/+QJVQUQIhP-82ZDk8';

const SERVICES = [
  {
    key: 'premium_listing', icon: <Flame size={20} />, color: '#f97316', bg: 'rgba(249,115,22,0.1)',
    name: 'Premium Token Listing', noCA: false,
    desc: 'Instant listing on Nomics with full promotion, 200 boost points, and daily exposure to thousands of traders.',
    tiers: [
      { name: 'Standard', price: 150, desc: 'Instant listing + 24h promoted highlight + 200 boost points' },
      { name: 'Featured', price: 350, desc: 'Standard + Token of the Day + newsletter feature', popular: true },
      { name: 'Elite',    price: 799, desc: 'Featured + KOL signal + 7-day trending boost' },
    ]
  },
  {
    key: 'dex_trending', icon: <TrendingUp size={20} />, color: '#10b981', bg: 'rgba(16,185,129,0.1)',
    name: 'DEX Trending Push', noCA: false,
    desc: 'Push your token to the top of DEX trending charts across Raydium, Jupiter, Uniswap and more.',
    tiers: [
      { name: 'Basic', price: 99,  desc: '24h single-DEX visibility boost' },
      { name: 'Pro',   price: 299, desc: '72h multi-DEX trending campaign', popular: true },
      { name: 'Elite', price: 799, desc: '7-day sustained trending + volume acceleration' },
    ]
  },
  {
    key: 'calls', icon: <Volume2 size={20} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',
    name: 'Shill Calls & Promotion', noCA: false,
    desc: 'Coordinated caller campaigns across Telegram, Discord, and social media for maximum signal exposure.',
    tiers: [
      { name: 'Micro',    price: 149, desc: '3–5 micro caller groups, 50K+ combined reach' },
      { name: 'Mid-Tier', price: 399, desc: '8–12 quality callers, 250K+ combined reach', popular: true },
      { name: 'Premium',  price: 999, desc: '20+ established callers, 1M+ combined reach' },
    ]
  },
  {
    key: 'alpha', icon: <Key size={20} />, color: '#a855f7', bg: 'rgba(168,85,247,0.1)',
    name: 'Alpha Group Access', noCA: true,
    desc: 'Exclusive private alpha channel — early gem calls, insider DEX signals, and priority listing alerts.',
    tiers: [
      { name: 'Monthly',   price: 99,  desc: '30 days full alpha access' },
      { name: 'Quarterly', price: 249, desc: '90 days full alpha access (save $48)', popular: true },
      { name: 'Lifetime',  price: 599, desc: 'Permanent access — best value forever' },
    ]
  },
  {
    key: 'volume_bot', icon: <BarChart2 size={20} />, color: '#ec4899', bg: 'rgba(236,72,153,0.1)',
    name: 'Volume Bot Infrastructure', noCA: false,
    desc: 'Professional managed volume generation to build market momentum and improve DEX rankings.',
    tiers: [
      { name: 'Starter', price: 199,  desc: '24h basic volume rotation' },
      { name: 'Growth',  price: 599,  desc: '72h managed volume + buy simulation', popular: true },
      { name: 'Premium', price: 1499, desc: '7-day advanced custom volume system' },
    ]
  },
  {
    key: 'kol', icon: <Users size={20} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',
    name: 'KOL / Influencer Outreach', noCA: false,
    desc: 'Connect with our verified network of crypto influencers for maximum reach and credibility.',
    tiers: [
      { name: 'Micro',    price: 299,  desc: '3–4 micro influencers, 100K+ reach' },
      { name: 'Mid-Tier', price: 799,  desc: '6–9 quality mid-tier KOLs, 500K+ reach', popular: true },
      { name: 'Premium',  price: 1999, desc: '20+ high-tier KOL partnerships, 2M+ reach' },
    ]
  },
  {
    key: 'dex_tools', icon: <Wrench size={20} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',
    name: 'DEX Tools & Analytics', noCA: true,
    desc: 'Professional DEX analytics, real-time token scanning, whale alerts and monitoring dashboards.',
    tiers: [
      { name: 'Basic',    price: 79,  desc: 'Token scanner + basic chart access' },
      { name: 'Advanced', price: 249, desc: 'Full DEX analytics, holder tracking, whale alerts', popular: true },
      { name: 'Pro',      price: 649, desc: 'Custom dashboard, API access, automated alerts' },
    ]
  },
  {
    key: 'promotion', icon: <Star size={20} />, color: '#84cc16', bg: 'rgba(132,204,22,0.1)',
    name: 'Full Promotion Package', noCA: false,
    desc: 'Complete multi-channel marketing campaign covering all major platforms simultaneously.',
    tiers: [
      { name: 'Basic',    price: 129, desc: 'Social media posts + 3 community shills' },
      { name: 'Standard', price: 349, desc: 'Multi-platform + Twitter thread + TG push', popular: true },
      { name: 'Premium',  price: 899, desc: 'Full campaign: KOL + trending + socials + TG wave' },
    ]
  },
  {
    key: 'meme', icon: <Smile size={20} />, color: '#facc15', bg: 'rgba(250,204,21,0.1)',
    name: 'Meme Coin Campaign', noCA: false,
    desc: 'Viral meme strategy designed for memecoin projects for explosive community growth.',
    tiers: [
      { name: 'Basic',     price: 79,  desc: 'Quick meme visibility + 5 viral posts' },
      { name: 'Viral',     price: 249, desc: 'Meme pack + community activation + listing', popular: true },
      { name: 'Explosion', price: 799, desc: 'Full viral meme campaign with KOL + trending' },
    ]
  },
  {
    key: 'twitter', icon: <span style={{ fontSize: 17, fontWeight: 900, lineHeight: 1 }}>𝕏</span>, color: '#1d9bf0', bg: 'rgba(29,155,240,0.1)',
    name: 'X (Twitter) Campaign', noCA: false,
    desc: 'Structured Twitter/X marketing with organic reach strategies and influencer amplification.',
    tiers: [
      { name: 'Basic',  price: 99,  desc: '5 posts + community engagement' },
      { name: 'Growth', price: 299, desc: 'Daily tweets + thread + 10 KOL reposts', popular: true },
      { name: 'Viral',  price: 799, desc: 'Full X strategy + paid amplification + trending hashtag' },
    ]
  },
  {
    key: 'dex_listing', icon: <Link2 size={20} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)',
    name: 'DEX Listing Support', noCA: false,
    desc: 'Fast-track your token listing on major DEX platforms including Raydium, Uniswap, and more.',
    tiers: [
      { name: 'Basic',        price: 99,  desc: 'Standard DEX listing assistance' },
      { name: 'Fast Track',   price: 249, desc: 'Priority DEX listing + initial promotion', popular: true },
      { name: 'Full Service', price: 599, desc: 'Complete DEX + Birdeye + DexTools listing' },
    ]
  },
  {
    key: 'quick_pump', icon: <Zap size={20} />, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',
    name: 'Quick Pump Campaign', noCA: false,
    desc: 'Rapid coordinated buy pressure campaign for fast momentum and price action.',
    tiers: [
      { name: 'Basic', price: 199,  desc: '24–48h call + volume burst' },
      { name: 'Pro',   price: 599,  desc: 'Calls + volume + TG raid combo', popular: true },
      { name: 'Elite', price: 1499, desc: 'Aggressive 72h full momentum package' },
    ]
  },
];

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, background: copied ? 'rgba(16,185,129,0.15)' : '#1a1a1a', color: copied ? '#10b981' : '#666', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : '#2a2a2a'}`, borderRadius: 6, padding: '4px 8px', cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {copied ? <Check size={9} /> : <Copy size={9} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function PctBadge({ val }) {
  if (val == null) return <span style={{ color: '#444', fontSize: 12 }}>—</span>;
  const pos = parseFloat(val) >= 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: pos ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
      {pos ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
      {Math.abs(parseFloat(val)).toFixed(2)}%
    </span>
  );
}

function SocialLink({ href, color, children }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888', background: '#111', border: '1px solid #222', borderRadius: 8, padding: '5px 12px', fontWeight: 600, transition: 'all .15s', textDecoration: 'none' }}
      onMouseEnter={e => { e.currentTarget.style.color = color; e.currentTarget.style.borderColor = color + '44'; }}
      onMouseLeave={e => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#222'; }}>
      {children}
    </a>
  );
}

function TokenCard({ tokenData, service }) {
  return (
    <div style={{ background: '#080808', border: '1px solid #1e1e1e', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
      {tokenData.image_url && (
        <div style={{ width: '100%', height: 80, background: '#111', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 30% 50%, ${service.color}22, transparent 70%)` }} />
        </div>
      )}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          {tokenData.image_url ? (
            <img src={tokenData.image_url} alt={tokenData.symbol}
              style={{ width: 56, height: 56, borderRadius: '50%', border: `2px solid ${service.color}55`, flexShrink: 0, marginTop: tokenData.image_url ? -28 : 0 }}
              onError={e => { e.target.style.display = 'none'; }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: service.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: service.color, flexShrink: 0, border: `2px solid ${service.color}33` }}>
              {(tokenData.symbol || '?').charAt(0)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#f0f0f0' }}>{tokenData.name}</span>
              <span style={{ fontSize: 12, color: '#555' }}>${tokenData.symbol}</span>
              <span className={`chain-pill ${chainClass(tokenData.chain)}`}>{chainLabel(tokenData.chain)}</span>
              <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 6, padding: '2px 7px', fontWeight: 800, textTransform: 'uppercase' }}>✓ Verified</span>
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 15, fontWeight: 800, color: '#f0f0f0' }}>
              {formatPrice(tokenData.price_usd)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
          {[{ l: '1H', v: tokenData.price_change?.h1 }, { l: '6H', v: tokenData.price_change?.h6 }, { l: '24H', v: tokenData.price_change?.h24 }].map(({ l, v }) => (
            <div key={l} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '7px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 9, color: '#444', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase' }}>{l}</div>
              <PctBadge val={v} />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: tokenData.description ? 10 : 0 }}>
          {[
            { l: 'Market Cap', v: formatMarketCap(tokenData.market_cap) },
            { l: 'Liquidity',  v: formatVolume(tokenData.liquidity_usd) },
            { l: 'Volume 24H', v: formatVolume(tokenData.volume_24h) },
            { l: 'DEX',        v: (tokenData.dex || '—').toUpperCase() },
          ].map(({ l, v }) => (
            <div key={l} style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: 9, color: '#444', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#ccc', fontFamily: 'JetBrains Mono, monospace' }}>{v}</div>
            </div>
          ))}
        </div>

        {tokenData.description && (
          <div style={{ background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 8, padding: '10px 12px', marginTop: 10, marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: '#444', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>About</div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.7 }}>{tokenData.description.slice(0, 280)}{tokenData.description.length > 280 ? '…' : ''}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          <SocialLink href={tokenData.websites?.[0]} color="#f0f0f0"><Globe size={10} /> Website</SocialLink>
          <SocialLink href={tokenData.twitter_url}   color="#1d9bf0">𝕏 Twitter</SocialLink>
          <SocialLink href={tokenData.telegram_url}  color="#0088cc">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z"/></svg>
            Telegram
          </SocialLink>
          <SocialLink href={tokenData.discord_url}   color="#5865f2">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.045.036.059a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            Discord
          </SocialLink>
          <SocialLink href={tokenData.pair_url}      color="#10b981"><ExternalLink size={10} /> DexScreener</SocialLink>
        </div>
      </div>
    </div>
  );
}

function ServiceModal({ service, onClose }) {
  const [step, setStep]               = useState(service.noCA ? 'order' : 'ca');
  const [ca, setCa]                   = useState('');
  const [loading, setLoading]         = useState(false);
  const [tokenData, setTokenData]     = useState(null);
  const [error, setError]             = useState('');
  const [selectedTier, setSelectedTier] = useState(null);
  const [currency, setCurrency]       = useState('SOL');
  const [telegram, setTelegram]       = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const { data: wallets }      = useQuery({ queryKey: ['wallets'],      queryFn: () => getWallets(),      staleTime: Infinity });
  const { data: cryptoPrices } = useQuery({ queryKey: ['cryptoPrices'], queryFn: () => getCryptoPrices(), staleTime: 60000 });

  const walletAddr = wallets?.[currency] || '—';
  const cryptoAmt  = selectedTier ? toCryptoAmount(selectedTier.price, cryptoPrices, currency) : null;

  const handleLookup = async () => {
    if (!ca.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await lookupToken(ca.trim());
      setTokenData(data.found ? data : { manual: true, address: ca.trim(), name: 'Unverified', symbol: '', chain: '' });
      setStep('order');
    } catch {
      setError('Network error — please try again.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedTier) return;
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
          name:    tokenData?.name    || '',
          symbol:  tokenData?.symbol  || '',
          chain:   tokenData?.chain   || '',
        },
        contact: { telegram: telegram.trim() }
      });
      setOrderResult(result);
      setDone(true);
    } catch {
      setError('Submission failed — please try again.');
    }
    setSubmitting(false);
  };

  const CURRENCIES = [
    { key: 'SOL', sym: '◎', label: 'Solana' },
    { key: 'ETH', sym: '⟠', label: 'Ethereum' },
    { key: 'BNB', sym: '🟡', label: 'BNB' },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 20, width: '100%', maxWidth: 580, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 32px 96px rgba(0,0,0,0.7)' }}>

        <div style={{ position: 'sticky', top: 0, background: '#0a0a0a', zIndex: 10, padding: '20px 24px 16px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: service.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: service.color, flexShrink: 0 }}>
              {service.icon}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f0' }}>{service.name}</div>
              {!done && <div style={{ fontSize: 11, color: '#444', marginTop: 2 }}>{step === 'ca' ? 'Step 1 — Enter Contract Address' : 'Step 2 — Choose Package & Pay'}</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#141414', border: '1px solid #222', color: '#666', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: 24 }}>
          {done ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <ShieldCheck size={32} style={{ color: '#10b981' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>Order Submitted!</div>
              <div style={{ fontSize: 13, color: '#777', lineHeight: 1.7, marginBottom: 20 }}>
                Your order is <span style={{ color: '#f59e0b', fontWeight: 700 }}>pending admin review</span>.<br />
                Our team will confirm via Telegram within 30–60 minutes.
              </div>
              {orderResult?.payment && (
                <div style={{ background: '#080808', border: `1px solid ${service.color}33`, borderRadius: 14, padding: 20, marginBottom: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Payment Details</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: '#666' }}>Send</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 900, fontSize: 16, color: service.color }}>
                      {orderResult.payment.crypto_amount} {orderResult.payment.currency}
                      <span style={{ color: '#444', fontWeight: 400, fontSize: 11 }}> (${orderResult.payment.price_usd?.toLocaleString()})</span>
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginBottom: 6 }}>To address ({orderResult.payment.currency})</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', borderRadius: 10, padding: '10px 14px', border: '1px solid #1a1a1a' }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', flex: 1, wordBreak: 'break-all', color: '#ddd' }}>{orderResult.payment.address}</span>
                    <CopyBtn text={orderResult.payment.address} />
                  </div>
                </div>
              )}
              {service.key === 'alpha' && (
                <a href={ALPHA_GROUP} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#a855f7', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, marginBottom: 12, textDecoration: 'none' }}>
                  Join Alpha Group <ArrowRight size={14} />
                </a>
              )}
              <button onClick={onClose} style={{ width: '100%', background: '#141414', border: '1px solid #222', color: '#888', borderRadius: 10, padding: '12px', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', marginTop: 8 }}>Close</button>
            </div>

          ) : step === 'ca' ? (
            <div>
              <div style={{ fontSize: 14, color: '#777', lineHeight: 1.7, marginBottom: 20 }}>
                Enter your token's contract address. We'll fetch the full token profile — name, image, description, price, market data, and all social links from DexScreener.
              </div>
              <input value={ca} onChange={e => { setCa(e.target.value); setError(''); }}
                placeholder="Paste contract address (0x… or Solana…)"
                onKeyDown={e => e.key === 'Enter' && handleLookup()} autoFocus
                style={{ marginBottom: 14 }} />
              {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14 }}>⚠️ {error}</div>}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={onClose} style={{ flex: 1, background: '#141414', border: '1px solid #222', color: '#666', borderRadius: 10, padding: '11px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Cancel</button>
                <button onClick={handleLookup} disabled={loading || !ca.trim()}
                  style={{ flex: 2, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: ca.trim() && !loading ? service.color : '#1a1a1a', color: ca.trim() && !loading ? '#000' : '#555', fontWeight: 800, fontSize: 14, padding: '11px 20px', borderRadius: 10, border: 'none', cursor: ca.trim() && !loading ? 'pointer' : 'not-allowed', transition: 'all .15s' }}>
                  {loading ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                  {loading ? 'Fetching Info…' : 'Fetch Token Info'}
                </button>
              </div>
            </div>

          ) : step === 'order' ? (
            <div>
              {tokenData && !tokenData.manual && <TokenCard tokenData={tokenData} service={service} />}

              {tokenData?.manual && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '12px 14px', marginBottom: 20, fontSize: 12, color: '#f59e0b', lineHeight: 1.6 }}>
                  ⚠️ Token not found on DexScreener — manual entry accepted. Our team will verify before approval.
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 800, color: '#e0e0e0', marginBottom: 12 }}>Choose Package</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                {service.tiers.map(tier => {
                  const selected = selectedTier?.name === tier.name;
                  const solAmt = toCryptoAmount(tier.price, cryptoPrices, 'SOL');
                  const ethAmt = toCryptoAmount(tier.price, cryptoPrices, 'ETH');
                  return (
                    <div key={tier.name} onClick={() => setSelectedTier(selected ? null : tier)}
                      style={{ border: `2px solid ${selected ? service.color : '#1e1e1e'}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', background: selected ? service.bg : '#080808', transition: 'all .15s', position: 'relative' }}>
                      {tier.popular && (
                        <span style={{ position: 'absolute', top: -10, right: 14, background: service.color, color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '.04em' }}>Best Value</span>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div>
                          <span style={{ fontWeight: 800, fontSize: 14, color: '#f0f0f0' }}>{tier.name}</span>
                          <div style={{ fontSize: 11, color: '#666', marginTop: 2, lineHeight: 1.5 }}>{tier.desc}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                          <div style={{ fontWeight: 900, fontSize: 18, color: service.color }}>${tier.price.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: '#555', fontFamily: 'JetBrains Mono, monospace', marginTop: 2 }}>
                            ◎{solAmt} · ⟠{ethAmt}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedTier && (
                <div style={{ background: '#080808', border: `1px solid ${service.color}33`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 14 }}>Payment</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {CURRENCIES.map(({ key, sym, label }) => {
                      const amt = toCryptoAmount(selectedTier.price, cryptoPrices, key);
                      return (
                        <button key={key} onClick={() => setCurrency(key)}
                          style={{ padding: '12px 8px', borderRadius: 12, border: `2px solid ${currency === key ? service.color : '#1e1e1e'}`, background: currency === key ? service.bg : '#0d0d0d', color: currency === key ? service.color : '#777', fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, transition: 'all .15s', fontFamily: 'inherit' }}>
                          <span style={{ fontSize: 17 }}>{sym}</span>
                          <span style={{ fontSize: 12 }}>{key}</span>
                          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', opacity: .8 }}>{amt}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#444', marginBottom: 3 }}>Total to send</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 900, color: service.color }}>{cryptoAmt} {currency}</div>
                      <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>${selectedTier.price.toLocaleString()} USD at current rate</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: '#444', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em' }}>Send to ({currency} address)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#0d0d0d', borderRadius: 10, padding: '11px 14px', border: '1px solid #1a1a1a' }}>
                    <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', flex: 1, wordBreak: 'break-all', color: '#ddd' }}>{walletAddr}</span>
                    <CopyBtn text={walletAddr} />
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 10, display: 'flex', gap: 6, lineHeight: 1.6 }}>
                    <span style={{ color: '#f59e0b' }}>⚠️</span>
                    Send the exact amount shown. Our admin verifies payment before activating your order.
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#888', marginBottom: 6, display: 'block' }}>
                  Your Telegram Username <span style={{ color: '#444', fontWeight: 400 }}>(optional)</span>
                </label>
                <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@yourtelegram" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 10, color: '#444' }}>Optional — our admin may reach out to confirm your order.</div>
              </div>

              {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 14 }}>⚠️ {error}</div>}

              <button onClick={() => { if (!selectedTier) return setError('Please select a package first.'); setError(''); handleSubmit(); }}
                disabled={submitting || !selectedTier}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: selectedTier && !submitting ? service.color : '#141414', color: selectedTier && !submitting ? '#000' : '#555', fontWeight: 800, fontSize: 14, padding: '14px 20px', borderRadius: 12, border: 'none', cursor: selectedTier && !submitting ? 'pointer' : 'not-allowed', transition: 'all .15s', boxShadow: selectedTier ? `0 4px 20px ${service.color}33` : 'none', fontFamily: 'inherit' }}>
                {submitting ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
                {submitting ? 'Submitting Order…' : "I've Sent Payment — Submit Order"}
              </button>

              {!service.noCA && (
                <button onClick={() => { setStep('ca'); setSelectedTier(null); setTokenData(null); }}
                  style={{ width: '100%', marginTop: 8, background: 'transparent', border: 'none', color: '#444', fontSize: 11, cursor: 'pointer', padding: '8px', fontFamily: 'inherit' }}>
                  ← Change contract address
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const [modal,  setModal]  = useState(null);
  const [filter, setFilter] = useState('all');

  const filters = [
    { key: 'all',       label: 'All Services' },
    { key: 'listing',   label: 'Listing & DEX' },
    { key: 'marketing', label: 'Marketing' },
    { key: 'alpha',     label: 'Alpha & Tools' },
  ];
  const filterMap = {
    listing:   ['premium_listing', 'dex_listing', 'dex_trending', 'volume_bot', 'quick_pump'],
    marketing: ['calls', 'kol', 'promotion', 'meme', 'twitter'],
    alpha:     ['alpha', 'dex_tools'],
  };

  const filtered = filter === 'all' ? SERVICES : SERVICES.filter(s => (filterMap[filter] || []).includes(s.key));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {modal && <ServiceModal service={modal} onClose={() => setModal(null)} />}

      <div style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 20, padding: '6px 16px', fontSize: 11, color: '#a855f7', fontWeight: 700, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          <Star size={10} /> Marketing Services
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 900, marginBottom: 10, lineHeight: 1.2, color: '#f0f0f0' }}>Grow Your Token</h1>
        <p style={{ fontSize: 13, color: '#666', maxWidth: 460, margin: '0 auto 22px', lineHeight: 1.8 }}>
          Professional Web3 marketing, DEX trending, KOL outreach, and analytics. Click any service to get started.
        </p>
        <a href={BOT_LINK} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0088cc', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z" /></svg>
          Order via @crypto_guy02
        </a>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(249,115,22,0.04))', border: '1px solid rgba(168,85,247,0.18)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 46, height: 46, background: 'rgba(168,85,247,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Key size={20} style={{ color: '#a855f7' }} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 3 }}>🔑 Exclusive Alpha Group</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>Early gem calls, insider DEX signals, KOL network & priority listing slots. Limited spots.</div>
        </div>
        <a href={ALPHA_GROUP} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#a855f7', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, flexShrink: 0, textDecoration: 'none' }}>
          Join Alpha — from $99/mo <ArrowRight size={12} />
        </a>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '8px 18px', borderRadius: 20, border: `1px solid ${filter === f.key ? '#a855f7' : '#1e1e1e'}`, background: filter === f.key ? 'rgba(168,85,247,0.12)' : 'transparent', color: filter === f.key ? '#a855f7' : '#666', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all .15s', fontFamily: 'inherit' }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12 }}>
        {filtered.map(service => (
          <div key={service.key} onClick={() => setModal(service)}
            style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14, cursor: 'pointer', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = service.color + '44'; e.currentTarget.style.background = '#0d0d0d'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.background = '#0a0a0a'; }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: service.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: service.color, flexShrink: 0 }}>
                {service.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0', marginBottom: 4 }}>{service.name}</div>
                <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6 }}>{service.desc}</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #141414', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: '#444' }}>
                From <span style={{ color: service.color, fontWeight: 800 }}>${Math.min(...service.tiers.map(t => t.price)).toLocaleString()}</span> · {service.tiers.length} packages
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: service.bg, color: service.color, border: `1px solid ${service.color}22`, fontWeight: 700, fontSize: 11, padding: '6px 14px', borderRadius: 8 }}>
                Get Quote <ArrowRight size={10} />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 16, padding: 28, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#444', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 20 }}>How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
          {[
            { n: '1', t: 'Choose a Service', d: 'Browse and click "Get Quote" on any service.', c: '#f97316' },
            { n: '2', t: 'Enter Your CA',    d: 'Auto-fetch token info, pick a package, see prices.', c: '#a855f7' },
            { n: '3', t: 'Send Payment',     d: 'Copy the wallet address and send the exact crypto amount.', c: '#10b981' },
            { n: '4', t: 'Admin Confirms',   d: 'Your order activates within 30–60 minutes.', c: '#3b82f6' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${s.c}12`, border: `2px solid ${s.c}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#e0e0e0' }}>{s.t}</div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6, textAlign: 'center' }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

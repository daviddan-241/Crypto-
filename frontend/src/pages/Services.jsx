import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Zap, TrendingUp, Volume2, Users, Key, Wrench, BarChart2, Flame, Link2, Smile, ShieldCheck, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { lookupToken, getWallets, formatPrice, formatVolume, formatMarketCap, chainLabel, chainClass } from '../utils/api';

const ALPHA_GROUP = 'https://t.me/+QJVQUQIhP-82ZDk8';
const BOT_LINK = 'https://t.me/Cariz_bot';

const SERVICES = [
  {
    key: 'premium_listing',
    icon: <Flame size={22} />,
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    name: 'Premium Token Listing',
    desc: 'Get your token listed instantly on Nomics with full promotion and exposure to thousands of traders.',
    tiers: [
      { name: 'Standard', price: 150, desc: 'Instant listing + 24h highlighted + 200 boost points', popular: false },
      { name: 'Featured', price: 350, desc: 'Standard + Token of the Day + Newsletter mention', popular: true },
      { name: 'Elite', price: 799, desc: 'Featured + KOL signal + 7-day trending boost', popular: false },
    ]
  },
  {
    key: 'dex_trending',
    icon: <TrendingUp size={22} />,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    name: 'DEX Trending Push',
    desc: 'Push your token to the top of DEX trending charts across Raydium, Jupiter, Uniswap and more.',
    tiers: [
      { name: 'Basic', price: 99, desc: '24h single-DEX visibility boost', popular: false },
      { name: 'Pro', price: 299, desc: '72h multi-DEX trending campaign', popular: true },
      { name: 'Elite', price: 799, desc: '7-day sustained trending + volume acceleration', popular: false },
    ]
  },
  {
    key: 'calls',
    icon: <Volume2 size={22} />,
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.08)',
    name: 'Shill Calls & Promotion',
    desc: 'Coordinated caller campaigns across Telegram, Discord and social media for maximum signal exposure.',
    tiers: [
      { name: 'Micro', price: 149, desc: '3–5 micro caller groups, 50K+ combined reach', popular: false },
      { name: 'Mid-Tier', price: 399, desc: '8–12 quality callers, 250K+ combined reach', popular: true },
      { name: 'Premium', price: 999, desc: '20+ established callers, 1M+ combined reach', popular: false },
    ]
  },
  {
    key: 'alpha',
    icon: <Key size={22} />,
    color: '#a855f7',
    bg: 'rgba(168,85,247,0.08)',
    name: 'Alpha Group Access',
    desc: 'Join our exclusive private alpha channel for early calls, gem alerts, and insider signals.',
    alpha: true,
    tiers: [
      { name: 'Monthly', price: 99, desc: '30 days — early gems, insider signals, DEX alerts', popular: false },
      { name: 'Quarterly', price: 249, desc: '90 days — full alpha access (save $48)', popular: true },
      { name: 'Lifetime', price: 599, desc: 'Permanent access — best value forever', popular: false },
    ]
  },
  {
    key: 'volume_bot',
    icon: <BarChart2 size={22} />,
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.08)',
    name: 'Volume Bot Infrastructure',
    desc: 'Professional managed volume generation to build market momentum and DEX ranking.',
    tiers: [
      { name: 'Starter', price: 199, desc: '24h basic volume rotation', popular: false },
      { name: 'Growth', price: 599, desc: '72h managed volume + buy simulation', popular: true },
      { name: 'Premium', price: 1499, desc: '7-day advanced custom volume system', popular: false },
    ]
  },
  {
    key: 'kol',
    icon: <Users size={22} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    name: 'KOL / Influencer Outreach',
    desc: 'Connect with our verified network of crypto influencers for maximum reach and credibility.',
    tiers: [
      { name: 'Micro', price: 299, desc: '3–4 micro influencers, 100K+ reach', popular: false },
      { name: 'Mid-Tier', price: 799, desc: '6–9 quality mid-tier KOLs, 500K+ reach', popular: true },
      { name: 'Premium', price: 1999, desc: '20+ high-tier KOL partnerships, 2M+ reach', popular: false },
    ]
  },
  {
    key: 'dex_tools',
    icon: <Wrench size={22} />,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.08)',
    name: 'DEX Tools & Analytics',
    desc: 'Professional DEX analytics, real-time token scanning, whale alerts and monitoring dashboards.',
    tiers: [
      { name: 'Basic', price: 79, desc: 'Token scanner + basic chart access', popular: false },
      { name: 'Advanced', price: 249, desc: 'Full DEX analytics, holder tracking, whale alerts', popular: true },
      { name: 'Pro', price: 649, desc: 'Custom dashboard, API access, automated alerts', popular: false },
    ]
  },
  {
    key: 'promotion',
    icon: <BarChart2 size={22} />,
    color: '#84cc16',
    bg: 'rgba(132,204,22,0.08)',
    name: 'Full Promotion Package',
    desc: 'Complete multi-channel marketing campaign covering all major platforms simultaneously.',
    tiers: [
      { name: 'Basic', price: 129, desc: 'Social media posts + 3 community shills', popular: false },
      { name: 'Standard', price: 349, desc: 'Multi-platform + Twitter thread + TG push', popular: true },
      { name: 'Premium', price: 899, desc: 'Full campaign: KOL + trending + socials + TG wave', popular: false },
    ]
  },
  {
    key: 'dex_listing',
    icon: <Link2 size={22} />,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.08)',
    name: 'DEX Listing Support',
    desc: 'Fast-track your token listing on major DEX platforms including Raydium, Uniswap, and more.',
    tiers: [
      { name: 'Basic', price: 99, desc: 'Standard DEX listing assistance', popular: false },
      { name: 'Fast Track', price: 249, desc: 'Priority DEX listing + initial promotion', popular: true },
      { name: 'Full Service', price: 599, desc: 'Complete DEX + Birdeye + DexTools listing', popular: false },
    ]
  },
  {
    key: 'meme',
    icon: <Smile size={22} />,
    color: '#facc15',
    bg: 'rgba(250,204,21,0.08)',
    name: 'Meme Coin Campaign',
    desc: 'Viral meme strategy specifically designed for memecoin projects for explosive growth.',
    tiers: [
      { name: 'Basic', price: 79, desc: 'Quick meme visibility + 5 viral posts', popular: false },
      { name: 'Viral', price: 249, desc: 'Meme pack + community activation + listing', popular: true },
      { name: 'Explosion', price: 799, desc: 'Full viral meme campaign with KOL + trending', popular: false },
    ]
  },
  {
    key: 'twitter',
    icon: <span style={{ fontSize: 20, fontWeight: 900 }}>𝕏</span>,
    color: '#1d9bf0',
    bg: 'rgba(29,155,240,0.08)',
    name: 'X (Twitter) Campaign',
    desc: 'Structured Twitter/X marketing with organic reach strategies and influencer amplification.',
    tiers: [
      { name: 'Basic', price: 99, desc: '5 posts + community engagement', popular: false },
      { name: 'Growth', price: 299, desc: 'Daily tweets + thread + 10 KOL reposts', popular: true },
      { name: 'Viral', price: 799, desc: 'Full X strategy + paid amplification + trending hashtag', popular: false },
    ]
  },
  {
    key: 'quick_pump',
    icon: <Zap size={22} />,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.08)',
    name: 'Quick Pump Coordination',
    desc: 'Rapid coordinated buy pressure campaign for fast momentum and price action.',
    tiers: [
      { name: 'Basic', price: 199, desc: '24–48h call + volume burst', popular: false },
      { name: 'Pro', price: 599, desc: 'Calls + volume + TG raid combo', popular: true },
      { name: 'Elite', price: 1499, desc: 'Aggressive 72h full momentum package', popular: false },
    ]
  },
];

function CAModal({ service, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState('ca');
  const [ca, setCa] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState('');
  const [selectedTier, setSelectedTier] = useState(null);
  const [currency, setCurrency] = useState('SOL');
  const [telegram, setTelegram] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const { data: wallets } = useQuery({ queryKey: ['wallets'], queryFn: () => import('../utils/api').then(m => m.getWallets()), staleTime: Infinity });

  const handleLookup = async () => {
    if (!ca.trim()) return;
    setLoading(true);
    setError('');
    try {
      const data = await lookupToken(ca.trim());
      if (data.found) {
        setTokenData(data);
        setStep('tier');
      } else {
        setTokenData({ manual: true, address: ca.trim(), name: '', symbol: '' });
        setStep('tier');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!selectedTier || !telegram) return;
    setSubmitting(true);
    try {
      const { serviceOrder } = await import('../utils/api');
      await serviceOrder({
        service: service.name,
        tier: selectedTier.name,
        price_usd: selectedTier.price,
        currency,
        token: {
          address: ca,
          name: tokenData?.name || '',
          symbol: tokenData?.symbol || '',
          chain: tokenData?.chain || '',
        },
        contact: { telegram }
      });
      setDone(true);
    } catch {
      setError('Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  const walletAddr = wallets?.[currency] || '—';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#111', border: '1px solid #222', borderRadius: 20,
        width: '100%', maxWidth: 520, padding: 32, position: 'relative', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: '#1e1e1e', border: 'none', color: '#888', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 18 }}>×</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: service.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: service.color }}>
            {service.icon}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{service.name}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{service.desc.slice(0, 60)}…</div>
          </div>
        </div>

        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Order Submitted!</div>
            <div style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Our team will contact you via Telegram shortly.</div>
            {service.alpha && (
              <a href={ALPHA_GROUP} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#a855f7', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14 }}>
                Join Alpha Group <ArrowRight size={14} />
              </a>
            )}
            <div style={{ marginTop: 16 }}>
              <button onClick={onClose} className="btn btn-ghost btn-md">Close</button>
            </div>
          </div>
        ) : step === 'ca' ? (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Enter Token Contract Address</div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>We'll fetch your token info from DexScreener to customize the service.</div>
            <input value={ca} onChange={e => { setCa(e.target.value); setError(''); }}
              placeholder="0x... or Solana address"
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              style={{ marginBottom: 12 }} />
            {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost btn-md" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-orange btn-md" onClick={handleLookup} disabled={loading || !ca.trim()} style={{ flex: 2, opacity: (loading || !ca.trim()) ? 0.6 : 1 }}>
                {loading ? 'Looking up…' : 'Fetch Token Info'}
              </button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <a href={BOT_LINK} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#888' }}>
                Or order via Telegram bot
              </a>
            </div>
          </div>
        ) : step === 'tier' ? (
          <div>
            {tokenData && !tokenData.manual && (
              <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {tokenData.image_url && <img src={tokenData.image_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />}
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{tokenData.name} <span style={{ color: '#666', fontSize: 12 }}>${tokenData.symbol}</span></div>
                    <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
                      {chainLabel(tokenData.chain)} • {formatPrice(tokenData.price_usd)} • Liq: {formatVolume(tokenData.liquidity_usd)}
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>✅ Verified</span>
                </div>
              </div>
            )}
            {tokenData?.manual && (
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 12, color: '#f59e0b' }}>
                ⚠️ Token not found on DEX — manual entry, team will verify.
              </div>
            )}

            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Choose Package</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {service.tiers.map(tier => (
                <div key={tier.name}
                  onClick={() => setSelectedTier(tier)}
                  style={{
                    border: `2px solid ${selectedTier?.name === tier.name ? service.color : '#222'}`,
                    borderRadius: 12, padding: '14px 16px', cursor: 'pointer',
                    background: selectedTier?.name === tier.name ? service.bg : '#0d0d0d',
                    transition: 'all .15s', position: 'relative'
                  }}>
                  {tier.popular && (
                    <span style={{ position: 'absolute', top: -10, right: 12, background: service.color, color: '#000', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase' }}>
                      Most Popular
                    </span>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 15 }}>{tier.name}</span>
                    <span style={{ fontWeight: 900, fontSize: 18, color: service.color }}>${tier.price.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>{tier.desc}</div>
                </div>
              ))}
            </div>

            {selectedTier && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Your Telegram Contact</div>
                <input value={telegram} onChange={e => setTelegram(e.target.value)}
                  placeholder="@yourtelegram or https://t.me/..." style={{ marginBottom: 14 }} />

                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Payment Currency</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {['SOL', 'ETH', 'BNB'].map(c => (
                    <button key={c} onClick={() => setCurrency(c)}
                      style={{
                        flex: 1, padding: '10px 6px', borderRadius: 10, border: `2px solid ${currency === c ? service.color : '#272727'}`,
                        background: currency === c ? service.bg : '#141414',
                        color: currency === c ? service.color : '#888', fontWeight: 700, cursor: 'pointer', fontSize: 13
                      }}>{c}</button>
                  ))}
                </div>

                {wallets && (
                  <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>Payment address ({currency}):</div>
                    <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#aaa', wordBreak: 'break-all' }}>{walletAddr}</div>
                  </div>
                )}

                {error && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 12 }}>{error}</div>}
                <button className="btn btn-orange btn-md" style={{ width: '100%', opacity: (!telegram || submitting) ? 0.6 : 1 }}
                  onClick={handleSubmit} disabled={!telegram || submitting}>
                  {submitting ? 'Submitting…' : `Order ${selectedTier.name} — $${selectedTier.price.toLocaleString()}`}
                </button>
              </div>
            )}
          </div>
        ) : null}
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
      {/* Header */}
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 20, padding: '6px 16px', fontSize: 12, color: '#f97316', fontWeight: 700, marginBottom: 16 }}>
          <Star size={12} /> PREMIUM SERVICES
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, lineHeight: 1.2 }}>
          Web3 Marketing<br />
          <span style={{ color: '#f97316' }}>Services & Tools</span>
        </h1>
        <p style={{ fontSize: 15, color: '#888', maxWidth: 500, margin: '0 auto', marginBottom: 24 }}>
          Professional DEX marketing, volume strategies, KOL outreach, and analytics tools for serious token projects.
        </p>
        <a href={BOT_LINK} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#0088cc', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, marginRight: 12 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-2.018 9.501c-.147.65-.537.81-1.086.503l-3.01-2.214-1.452 1.396c-.16.16-.297.297-.608.297l.216-3.04 5.547-5.008c.24-.214-.055-.333-.374-.12L7.656 13.81 4.703 12.9c-.652-.203-.663-.648.137-.96l10.884-4.19c.543-.196 1.018.132.838.498z" /></svg>
          Order on Telegram
        </a>
      </div>

      {/* Alpha Access Banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(249,115,22,0.08))', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, background: 'rgba(168,85,247,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Key size={24} style={{ color: '#a855f7' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>🔑 Exclusive Alpha Group Access</div>
          <div style={{ fontSize: 13, color: '#888' }}>Early gem calls, insider DEX signals, KOL network access & priority listing slots. Limited spots available.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="https://t.me/+QJVQUQIhP-82ZDk8" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#a855f7', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13 }}>
            Join Alpha — from $99/mo <ArrowRight size={13} />
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="tabs" style={{ borderBottom: 'none', gap: 8 }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`tab ${filter === f.key ? 'active' : ''}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {filtered.map(service => (
          <div key={service.key} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 16, transition: 'border-color .15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = service.color + '44'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: service.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: service.color, flexShrink: 0 }}>
                {service.icon}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{service.name}</div>
                <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>from ${Math.min(...service.tiers.map(t => t.price))}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{service.desc}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {service.tiers.map(tier => (
                <div key={tier.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#0d0d0d', borderRadius: 8, border: tier.popular ? `1px solid ${service.color}33` : '1px solid transparent' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, marginRight: 8 }}>{tier.name}</span>
                    {tier.popular && <span style={{ fontSize: 9, background: service.color, color: '#000', padding: '2px 6px', borderRadius: 10, fontWeight: 800 }}>TOP</span>}
                    <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{tier.desc.slice(0, 45)}…</div>
                  </div>
                  <span style={{ fontWeight: 900, color: service.color, fontSize: 15, flexShrink: 0, marginLeft: 8 }}>${tier.price}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setModal(service)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: `1px solid ${service.color}44`, background: service.bg, color: service.color, fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = service.bg.replace('0.08', '0.15'); }}
              onMouseLeave={e => { e.currentTarget.style.background = service.bg; }}>
              {service.alpha ? '🔑 Get Alpha Access' : 'Get Started'} <ChevronRight size={15} />
            </button>
          </div>
        ))}
      </div>

      {modal && <CAModal service={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

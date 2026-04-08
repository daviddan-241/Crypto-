import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Flame, Zap, TrendingUp, ChevronUp, ChevronDown, Star, ArrowRight, Key, Volume2, BarChart2, Wrench, Users } from 'lucide-react';
import { getGlobalMarket, getTrending, getCoins, getListed, formatMarketCap, formatPrice, formatPercent, formatVolume, chainLabel, chainClass } from '../utils/api';

const ALPHA_GROUP = 'https://t.me/+QJVQUQIhP-82ZDk8';

const Sparkline = ({ prices, positive }) => {
  if (!prices || prices.length < 2) return <div style={{ width: 64, height: 28 }} />;
  const min = Math.min(...prices), max = Math.max(...prices);
  const range = max - min || 1;
  const W = 64, H = 28;
  const pts = prices.map((p, i) => `${(i / (prices.length - 1)) * W},${H - ((p - min) / range) * (H - 4) - 2}`).join(' ');
  const color = positive ? '#22c55e' : '#ef4444';
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};

const PctBadge = ({ val }) => {
  if (val == null) return <span style={{ color: '#555', fontSize: 12 }}>—</span>;
  const pos = val >= 0;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: pos ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>
      {pos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
      {Math.abs(val).toFixed(2)}%
    </span>
  );
};

const SERVICE_CARDS = [
  { icon: <Flame size={18} />, color: '#f97316', bg: 'rgba(249,115,22,0.1)', label: 'Premium Listing', price: 'from $150', to: '/submit' },
  { icon: <TrendingUp size={18} />, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'DEX Trending', price: 'from $99', to: '/services' },
  { icon: <Volume2 size={18} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Shill Calls', price: 'from $149', to: '/services' },
  { icon: <Key size={18} />, color: '#a855f7', bg: 'rgba(168,85,247,0.1)', label: 'Alpha Access', price: 'from $99/mo', to: '/services' },
  { icon: <BarChart2 size={18} />, color: '#ec4899', bg: 'rgba(236,72,153,0.1)', label: 'Volume Bot', price: 'from $199', to: '/services' },
  { icon: <Users size={18} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'KOL Outreach', price: 'from $299', to: '/services' },
  { icon: <Wrench size={18} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)', label: 'DEX Tools', price: 'from $79', to: '/services' },
  { icon: <Star size={18} />, color: '#84cc16', bg: 'rgba(132,204,22,0.1)', label: 'Full Promotion', price: 'from $129', to: '/services' },
];

const TABS = ['All', 'Trending', 'Hot', 'Gainers', 'New'];
const CHAINS = ['All', 'SOL', 'ETH', 'BSC', 'BASE', 'ARB'];

export default function Home() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('All');
  const [chain, setChain] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PER_PAGE = 50;

  const { data: global } = useQuery({ queryKey: ['global'], queryFn: getGlobalMarket, staleTime: 60000 });
  const { data: trendingData } = useQuery({ queryKey: ['trending'], queryFn: getTrending, staleTime: 120000 });
  const { data: coins = [], isLoading } = useQuery({ queryKey: ['coins'], queryFn: () => getCoins({ per_page: 100 }), staleTime: 60000 });
  const { data: listed = [] } = useQuery({ queryKey: ['listed'], queryFn: getListed, staleTime: 30000 });

  const trendingCoins = trendingData?.coins || [];

  const filtered = useMemo(() => {
    let list = [...coins];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name?.toLowerCase().includes(q) || c.symbol?.toLowerCase().includes(q));
    }
    if (tab === 'Gainers') list = [...list].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
    if (tab === 'Hot') list = [...list].sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0));
    if (tab === 'New') list = list.slice(-60).reverse();
    if (tab === 'Trending') {
      const tIds = new Set(trendingCoins.map(t => t.id));
      list = list.filter(c => tIds.has(c.id));
    }
    return list;
  }, [coins, search, tab, trendingCoins]);

  const paged = filtered.slice(0, (page + 1) * PER_PAGE);

  const statsData = [
    { label: 'Total Market Cap', value: formatMarketCap(global?.total_market_cap_usd), sub: `${formatPercent(global?.market_cap_change_percentage_24h)} (24h)`, subPos: (global?.market_cap_change_percentage_24h || 0) >= 0 },
    { label: '24H Volume', value: formatMarketCap(global?.total_volume_usd), sub: 'Global trading volume' },
    { label: 'BTC Dominance', value: `${(global?.btc_dominance || 0).toFixed(1)}%`, sub: 'Market share' },
    { label: 'ETH Dominance', value: `${(global?.eth_dominance || 0).toFixed(1)}%`, sub: 'Market share' },
    { label: 'Active Coins', value: (global?.active_cryptocurrencies || 0).toLocaleString(), sub: 'Tracked on Nomics' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 10 }}>
        {statsData.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            {s.sub && <div className="stat-sub" style={s.subPos !== undefined ? { color: s.subPos ? '#22c55e' : '#ef4444' } : {}}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Featured Listed Tokens */}
      {listed.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} style={{ color: '#f97316' }} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0f0' }}>Promoted Tokens</span>
              <span className="badge badge-premium">BOOSTED</span>
            </div>
            <Link to="/listed" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f97316', fontWeight: 600 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 80px 80px 80px 100px 80px', padding: '8px 16px', borderBottom: '1px solid #161616' }}>
              {['TOKEN', '1H', '6H', '24H', 'MARKET CAP', 'VOLUME', 'ACTION'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: h === 'TOKEN' ? 'left' : 'right' }}>{h}</div>
              ))}
            </div>
            {listed.slice(0, 8).map(token => (
              <div key={token.id} className="token-row"
                style={{ gridTemplateColumns: '2fr 1fr 80px 80px 80px 100px 80px', cursor: 'pointer' }}
                onClick={() => navigate(`/token/${token.address}`)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {token.image ? (
                    <img src={token.image} alt={token.symbol} style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#f97316', flexShrink: 0 }}>
                      {(token.symbol || '?').charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{token.name || token.symbol}</span>
                      <span className="badge badge-ad">AD</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{ fontSize: 11, color: '#555', fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(token.price_usd)}</span>
                      {token.chain && <span className={`chain-pill ${chainClass(token.chain)}`}>{chainLabel(token.chain)}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}><PctBadge val={token.price_change?.h1} /></div>
                <div style={{ textAlign: 'right' }}><PctBadge val={token.price_change?.h6} /></div>
                <div style={{ textAlign: 'right' }}><PctBadge val={token.price_change?.h24} /></div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#ccc', fontFamily: 'JetBrains Mono, monospace' }}>{formatMarketCap(token.market_cap)}</div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#ccc', fontFamily: 'JetBrains Mono, monospace' }}>{formatVolume(token.volume_24h)}</div>
                <div style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-outline-orange" onClick={e => { e.stopPropagation(); navigate('/services'); }}>Boost</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(168,85,247,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Star size={14} style={{ color: '#a855f7' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Marketing Services</span>
            <span style={{ fontSize: 9, background: '#a855f7', color: '#fff', padding: '2px 7px', borderRadius: 10, fontWeight: 800, textTransform: 'uppercase' }}>NEW</span>
          </div>
          <Link to="/services" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#a855f7', fontWeight: 600 }}>
            All Services <ArrowRight size={12} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {SERVICE_CARDS.map((s, i) => (
            <Link key={i} to={s.to} style={{ textDecoration: 'none' }}>
              <div style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '16px 14px', cursor: 'pointer', transition: 'all .15s', display: 'flex', flexDirection: 'column', gap: 10 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '44'; e.currentTarget.style.background = s.bg; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a1a1a'; e.currentTarget.style.background = '#111'; }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  {s.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#e0e0e0', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.price}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Alpha Access Banner */}
      <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(249,115,22,0.06))', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 44, height: 44, background: 'rgba(168,85,247,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Key size={22} style={{ color: '#a855f7' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>🔑 Join Our Alpha Group</div>
          <div style={{ fontSize: 13, color: '#777' }}>Early gem calls, insider DEX signals & priority listing alerts — exclusive members only.</div>
        </div>
        <a href={ALPHA_GROUP} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#a855f7', color: '#fff', padding: '10px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
          Join Alpha — from $99 <ArrowRight size={13} />
        </a>
      </div>

      {/* Trending Right Now */}
      {trendingCoins.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(249,115,22,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Flame size={14} style={{ color: '#f97316' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Trending Right Now</span>
          </div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }} className="hide-scrollbar">
            {trendingCoins.slice(0, 10).map(coin => {
              const pct = parseFloat(coin.data?.price_change_percentage_24h?.usd ?? 0);
              const pos = pct >= 0;
              return (
                <div key={coin.id}
                  style={{ flexShrink: 0, width: 155, background: '#111', border: '1px solid #1a1a1a', borderRadius: 12, padding: '14px 14px', cursor: 'pointer', transition: 'border-color .15s' }}
                  onClick={() => navigate(`/coin/${coin.id}`)}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#2a2a2a'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1a1a1a'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <img src={coin.thumb || coin.large} alt={coin.symbol} style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a1a' }} onError={e => e.target.style.display = 'none'} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#f0f0f0' }}>{coin.symbol?.toUpperCase()}</div>
                      <div style={{ fontSize: 10, color: '#444' }}>#{coin.market_cap_rank || '—'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#e0e0e0', marginBottom: 4 }}>
                    {coin.data?.price ? `$${parseFloat(coin.data.price).toFixed(4)}` : '—'}
                  </div>
                  <div style={{ fontSize: 11, color: pos ? '#22c55e' : '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                    {pos ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    {Math.abs(pct).toFixed(2)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Token Table */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div className="tabs" style={{ flex: 1, minWidth: 0, borderBottom: 'none' }}>
            {TABS.map(t => (
              <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setPage(0); }}>
                {t === 'Trending' && <Flame size={12} style={{ marginRight: 4 }} />}
                {t === 'Hot' && <TrendingUp size={12} style={{ marginRight: 4 }} />}
                {t === 'Gainers' && <ChevronUp size={12} style={{ marginRight: 4 }} />}
                {t}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search tokens…"
              style={{ width: 180, paddingLeft: 30, fontSize: 12, height: 36 }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
          {CHAINS.map(c => (
            <button key={c} onClick={() => setChain(c)}
              style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: chain === c ? '#f97316' : '#141414', color: chain === c ? '#000' : '#555',
                transition: 'all .15s'
              }}>
              {c}
            </button>
          ))}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 2.5fr 1fr 90px 90px 90px 120px 130px 70px', padding: '10px 16px', borderBottom: '1px solid #161616' }}>
            {['#', 'Token', 'Price', '1H', '24H', '7D', 'Volume', 'Market Cap', '7D'].map((h, i) => (
              <div key={i} style={{ fontSize: 10, fontWeight: 700, color: '#3a3a3a', textTransform: 'uppercase', letterSpacing: '.06em', textAlign: i > 1 ? 'right' : 'left' }}>{h}</div>
            ))}
          </div>

          {isLoading ? (
            Array(10).fill(0).map((_, i) => (
              <div key={i} style={{ height: 52, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #111' }}>
                <div className="shimmer" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="shimmer" style={{ width: 100, height: 12, marginBottom: 4 }} />
                  <div className="shimmer" style={{ width: 60, height: 10 }} />
                </div>
              </div>
            ))
          ) : paged.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#444' }}>No tokens found</div>
          ) : (
            paged.map((coin, idx) => {
              const chg1h = coin.price_change_percentage_1h_in_currency;
              const chg24h = coin.price_change_percentage_24h;
              const chg7d = coin.price_change_percentage_7d_in_currency;
              return (
                <div key={coin.id} className="token-row"
                  style={{ gridTemplateColumns: '40px 2.5fr 1fr 90px 90px 90px 120px 130px 70px' }}
                  onClick={() => navigate(`/coin/${coin.id}`)}>
                  <div style={{ fontSize: 12, color: '#444', fontWeight: 600 }}>{idx + 1}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={coin.image} alt={coin.name} style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a1a', flexShrink: 0 }} onError={e => e.target.style.display = 'none'} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0f0' }}>{coin.name}</div>
                      <div style={{ fontSize: 11, color: '#444', textTransform: 'uppercase' }}>{coin.symbol}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{formatPrice(coin.current_price)}</div>
                  <div style={{ textAlign: 'right' }}><PctBadge val={chg1h} /></div>
                  <div style={{ textAlign: 'right' }}><PctBadge val={chg24h} /></div>
                  <div style={{ textAlign: 'right' }}><PctBadge val={chg7d} /></div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>{formatVolume(coin.total_volume)}</div>
                  <div style={{ textAlign: 'right', fontSize: 12, color: '#888', fontFamily: 'JetBrains Mono, monospace' }}>{formatMarketCap(coin.market_cap)}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Sparkline prices={coin.sparkline_in_7d?.price} positive={(chg7d || 0) >= 0} />
                  </div>
                </div>
              );
            })
          )}

          {!isLoading && filtered.length > paged.length && (
            <div style={{ padding: '14px 16px', textAlign: 'center', borderTop: '1px solid #111' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)}>
                Load more ({filtered.length - paged.length} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
